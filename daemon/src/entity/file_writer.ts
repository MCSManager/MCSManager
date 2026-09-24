import fs from "fs-extra";
import path from "path";
import * as lockfile from "proper-lockfile";
import logger from "../service/log";
import { $t } from "../i18n";
import FileManager from "../service/system_file";
import uploadManager from "../service/upload_manager";
import {
  resolveInstanceFileOwnership,
  syncInstancePathOwnership
} from "../tools/file_ownership";
import type { FileOwnership } from "../tools/file_ownership";
import { globalEnv } from "./config";
import Instance from "./instance/instance";

type ChunkRange = { start: number; end: number };

export default class FileWriter {
  readonly path: string;
  id?: string;
  cwd?: string;
  private releaseLock?: () => Promise<void>;
  private fd: number | null = null;
  private completion?: Promise<void>;
  private pendingWrites = new Set<Promise<void>>();
  private stopPromise?: Promise<void>;
  private stopping = false;
  private ownsFile = false;
  readonly received: ChunkRange[] = [];
  lastUpdate: number = Date.now();

  constructor(
    public readonly instance: Instance,
    private filename: string,
    public readonly size: number,
    private unzip: boolean,
    private zipCode: string,
    filePath: string,
    private deleteAfterUnzip: boolean = false
  ) {
    if (!FileManager.checkFileName(path.basename(this.filename)))
      throw new Error("Access denied: Malformed file name");

    this.path = filePath;
    this.cwd = instance.absoluteCwdPath();
  }

  static async getPath(cwd: string, dir: string, filename: string, overwrite: boolean) {
    const fileManager = new FileManager(cwd);

    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);

    let tempFileSaveName = basename + ext;
    let counter = 1;

    const checkFile = async (name: string) => {
      const absolutePath = fileManager.toAbsolutePath(path.normalize(path.join(dir, name)));
      const isLock = await lockfile
        .check(absolutePath)
        .then((isLock) => isLock)
        .catch(() => false);
      const isAccess = await fs
        .access(absolutePath)
        .then(() => true)
        .catch(() => false);
      return isAccess && !isLock && !overwrite;
    };

    while (await checkFile(tempFileSaveName)) {
      if (counter == 1) {
        tempFileSaveName = `${basename}-copy${ext}`;
      } else {
        tempFileSaveName = `${basename}-copy-${counter}${ext}`;
      }
      counter++;
      if (counter > 100) {
        throw new Error("Access denied: File name already exists!");
      }
    }

    const fileSaveRelativePath = path.normalize(path.join(dir, tempFileSaveName));

    if (!fileManager.checkPath(fileSaveRelativePath))
      throw new Error("Access denied: Invalid destination");

    return fileManager.toAbsolutePath(fileSaveRelativePath);
  }

  async init() {
    if (this.fd != null) return;
    let locked = false;
    try {
      if (lockfile.checkSync(this.path)) locked = true;
    } catch {}
    if (locked) {
      throw new Error("File is locked");
    }
    try {
      this.fd = await fs.open(this.path, "w+");
      this.ownsFile = true;
      this.releaseLock = await lockfile.lock(this.path);
      await fs.ftruncate(this.fd, this.size);
    } catch (e) {
      try {
        await this.stop();
      } catch (cleanupError) {
        logger.error("Error cleaning failed file upload initialization:", this.path, cleanupError);
      }
      throw e;
    }
  }

  async write(offset: number, chunk: Buffer) {
    if (this.stopping) throw new Error("File is not opened");
    const operation = this.writeChunk(offset, chunk);
    this.pendingWrites.add(operation);
    operation.catch(() => {
      this.stopping = true;
    });
    try {
      await operation;
    } catch (error) {
      this.pendingWrites.delete(operation);
      try {
        await this.stop();
      } catch (cleanupError) {
        logger.error("Error cleaning failed file upload:", this.path, cleanupError);
      }
      throw error;
    } finally {
      this.pendingWrites.delete(operation);
    }
  }

  private async writeChunk(offset: number, chunk: Buffer) {
    this.lastUpdate = Date.now();
    if (offset + chunk.length > this.size) throw new Error("Write exceeds file size limit");
    if (this.stopping || this.fd === null) throw new Error("File is not opened");

    let written = 0;
    while (written < chunk.length) {
      const result = await fs.write(
        this.fd,
        chunk,
        written,
        chunk.length - written,
        offset + written
      );
      if (result.bytesWritten <= 0) {
        throw new Error($t("TXT_CODE_http_router.updateErr"));
      }
      written += result.bytesWritten;
    }

    this.addWrittenRange(offset, offset + chunk.length);
    if (this.isFullyCovered()) {
      await this.complete();
    }
  }

  private complete(): Promise<void> {
    this.completion ||= this.done().catch((error) => {
      logger.error("Error completing file upload:", error);
      throw error;
    });
    return this.completion;
  }

  async done() {
    if (this.fd != null) {
      await fs.close(this.fd);
      this.fd = null;
      if (typeof this.releaseLock === "function") {
        await this.releaseLock();
        this.releaseLock = undefined;
      }
    }

    if (this.id != null) {
      uploadManager.delete(this.id);
    }

    const ownership = await resolveInstanceFileOwnership(this.instance);
    if (ownership) await syncInstancePathOwnership(this.instance, this.path, ownership);

    logger.info("Browser Uploaded File:", this.path);

    if (this.unzip) {
      this.startExtraction(ownership);
    }
  }

  private startExtraction(ownership?: FileOwnership): void {
    globalEnv.fileTaskCount++;
    if (this.instance) this.instance.info.fileLock++;

    void (async () => {
      try {
        const instanceFiles = new FileManager(this.cwd);
        await instanceFiles.unzip(this.path, path.dirname(this.path), this.zipCode, ownership);
        logger.info("File unzipped:", this.path);

        if (this.deleteAfterUnzip) {
          await fs.remove(this.path);
          logger.info("Temporary zip deleted:", this.path);
        }
      } catch (error) {
        logger.error("Error extracting uploaded archive:", this.path, error);
      } finally {
        globalEnv.fileTaskCount--;
        if (this.instance) this.instance.info.fileLock--;
      }
    })();
  }

  async stop() {
    this.stopping = true;
    this.stopPromise ||= this.stopInternal();
    return this.stopPromise;
  }

  private async stopInternal() {
    await Promise.allSettled(this.pendingWrites);

    let cleanupError: unknown;
    const fd = this.fd;
    this.fd = null;
    if (fd != null) {
      try {
        await fs.close(fd);
      } catch (error) {
        cleanupError ||= error;
      }
    }

    const releaseLock = this.releaseLock;
    this.releaseLock = undefined;
    if (releaseLock) {
      try {
        await releaseLock();
      } catch (error) {
        cleanupError ||= error;
      }
    }

    if (this.ownsFile) {
      try {
        await fs.remove(this.path);
      } catch (error) {
        cleanupError ||= error;
      }
    }
    if (this.id != null) {
      uploadManager.delete(this.id);
    }

    logger.info("Browser Upload Task Stopped:", this.path);
    if (cleanupError) throw cleanupError;
  }

  private addWrittenRange(start: number, end: number): void {
    if (start > end) return;

    let i = 0;
    let ranges = this.received;
    while (i < ranges.length && ranges[i].end < start - 1) i++;

    let mergeStart = start,
      mergeEnd = end;
    let removeCount = 0;

    while (i + removeCount < ranges.length && ranges[i + removeCount].start <= end + 1) {
      mergeStart = Math.min(mergeStart, ranges[i + removeCount].start);
      mergeEnd = Math.max(mergeEnd, ranges[i + removeCount].end);
      removeCount++;
    }

    ranges.splice(i, removeCount, { start: mergeStart, end: mergeEnd });
  }

  private isFullyCovered(): boolean {
    // Zero-byte uploads never receive pieces; treat them as complete.
    if (this.size === 0) return true;
    return (
      this.received.length === 1 &&
      this.received[0].start === 0 &&
      this.received[0].end === this.size
    );
  }

  /** Complete the upload when no further pieces are expected (e.g. empty files). */
  async completeIfCovered() {
    if (this.fd != null && this.isFullyCovered()) {
      await this.complete();
    }
  }

  private readStreamToHash(
    filePath: string,
    hash: any,
    options?: { start: number; end: number }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath, options);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });
  }
}
