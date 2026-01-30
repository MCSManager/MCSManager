import fs from "fs-extra";
import path from "path";
import * as lockfile from "proper-lockfile";
import logger from "../service/log";
import FileManager from "../service/system_file";
import uploadManager from "../service/upload_manager";

type ChunkRange = { start: number; end: number };

export default class FileWriter {
  readonly path: string;
  id?: string;
  private releaseLock?: () => Promise<void>;
  private fd: number | null = null;
  readonly received: ChunkRange[] = [];
  lastUpdate: number = Date.now();

  constructor(
    public readonly cwd: string,
    private filename: string,
    public readonly size: number,
    private unzip: boolean,
    private zipCode: string,
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
      this.releaseLock = await lockfile.lock(this.path);
      await fs.ftruncate(this.fd, this.size);
    } catch (e) {
      if (typeof this.releaseLock === "function") await this.releaseLock();
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
      await this.releaseLock!();
    }

    if (this.id != null) {
      uploadManager.delete(this.id);
    }

    logger.info("Browser Uploaded File:", this.path);

    if (this.unzip) {
      const instanceFiles = new FileManager(this.cwd);
      await instanceFiles.unzip(this.path, ".", this.zipCode);
      logger.info("File unzipped:", this.path);
    }
  }

  async stop() {
    if (this.fd != null) {
      await fs.close(this.fd);
      this.fd = null;
      await this.releaseLock!();
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
