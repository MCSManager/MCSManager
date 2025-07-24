import FileManager from "../service/system_file";
import path from "path";
import fs from "fs-extra";
import logger from "../service/log";
import * as lockfile from "proper-lockfile";
import uploadManager from "../service/upload_manager";
import { createHash } from "crypto";

type ChunkRange = { start: number; end: number };

export default class FileWriter {
  readonly path: string;
  id?: string;
  private releaseLock?: { (): void };
  private fd: number | null = null;
  readonly received: ChunkRange[] = [];
  lastUpdate: number = Date.now();

  constructor(
    private cwd: string,
    private filename: string,
    public readonly size: number,
    private unzip: boolean,
    private zipCode: string,
    public readonly sum: string,
    filePath: string
  ) {
    if (!FileManager.checkFileName(path.basename(this.filename)))
      throw new Error("Access denied: Malformed file name");

    this.path = filePath;
  }

  static async getPath(cwd: string, dir: string, filename: string, overwrite: boolean) {
    const fileManager = new FileManager(cwd);

    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);

    let tempFileSaveName = basename + ext;
    let counter = 1;

    while (
      (await fs
        .access(fileManager.toAbsolutePath(path.normalize(path.join(dir, tempFileSaveName))))
        .then(() => true)
        .catch(() => false)) &&
      !(await lockfile.check(
        fileManager.toAbsolutePath(path.normalize(path.join(dir, tempFileSaveName)))
      )) &&
      !overwrite
    ) {
      if (counter == 1) {
        tempFileSaveName = `${basename}-copy${ext}`;
      } else {
        tempFileSaveName = `${basename}-copy-${counter}${ext}`;
      }
      counter++;
    }

    let fileSaveRelativePath = path.normalize(path.join(dir, tempFileSaveName));

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
      this.releaseLock = lockfile.lockSync(this.path);
      await fs.ftruncate(this.fd, this.size);
    } catch (e) {
      this.releaseLock!();
      this.releaseLock = undefined;
      throw e;
    }
  }

  async write(offset: number, chunk: Buffer) {
    this.lastUpdate = Date.now();
    if (offset + chunk.length > this.size) throw new Error("Write exceeds file size limit");
    if (this.fd === null) throw new Error("File is not opened");
    await fs.write(this.fd, chunk, 0, chunk.length, offset);

    this.addWrittenRange(offset, offset + chunk.length);
    if (this.isFullyCovered()) {
      this.done().catch((e) => {
        logger.error("Error completing file upload:", e);
      }); // async
    }
  }

  async done() {
    if (this.fd != null) {
      await fs.close(this.fd);
      this.fd = null;
      this.releaseLock!();
    }

    if (this.id != null) {
      uploadManager.delete(this.id);
    }

    if (!(await this.checkSum())) {
      await fs.remove(this.path);
      logger.error("File checksum does not match:", this.path);
      throw new Error("File checksum does not match");
    }

    logger.info("Browser Uploaded File:", this.path);

    if (this.unzip) {
      const instanceFiles = new FileManager(this.cwd);
      await instanceFiles.unzip(this.cwd, ".", this.zipCode);
      logger.info("File unzipped:", this.path);
    }
  }

  async stop() {
    if (this.fd != null) {
      await fs.close(this.fd);
      this.fd = null;
      this.releaseLock!();
    }
    if (this.id != null) {
      uploadManager.delete(this.id);
    }
    await fs.remove(this.path);
    logger.info("Browser Upload Task Stopped:", this.path);
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
    return (
      this.received.length === 1 &&
      this.received[0].start === 0 &&
      this.received[0].end === this.size
    );
  }

  private async checkSum(): Promise<boolean> {
    let md5 = await new Promise<string>((resolve, reject) => {
      const hash = createHash("md5");
      const stream = fs.createReadStream(this.path);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err) => reject(err));
    });
    return md5 == this.sum;
  }
}
