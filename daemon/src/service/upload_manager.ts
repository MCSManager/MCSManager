import FileWriter from "../entity/file_writer";
import { v4 } from "uuid";

class UploadManager {
  private readonly uploads: Map<string, FileWriter> = new Map();
  static timeout = 60 * 60 * 1000; // 1 hour

  constructor() {
    setInterval(
      async () => {
        await this.clearExpired();
      },
      5 * 60 * 1000 // 5 min
    );
  }

  add(file: FileWriter): string {
    const key = v4();
    file.id = key;
    this.uploads.set(key, file);
    return key;
  }

  public getUploads() {
    return this.uploads.entries();
  }

  get(key: string): FileWriter | undefined {
    return this.uploads.get(key);
  }

  delete(key: string): boolean {
    return this.uploads.delete(key);
  }

  getByPath(path: string): { id: string; writer: FileWriter } | undefined {
    for (const [id, writer] of this.uploads.entries()) {
      if (writer.path == path) {
        return { id, writer };
      }
    }
    return undefined;
  }

  async clearExpired(): Promise<void> {
    const now = Date.now();
    for (const [key, writer] of this.uploads.entries()) {
      if (now - writer.lastUpdate > UploadManager.timeout) {
        try {
          await writer.stop();
          this.uploads.delete(key);
        } catch (e) {
          console.error(`Failed to stop upload writer for key ${key}:`, e);
        }
      }
    }
  }

  async exit() {
    for (const [key, writer] of this.uploads.entries()) {
      try {
        await writer.stop();
        this.uploads.delete(key);
      } catch (e) {
        console.error(`Failed to stop upload writer for key ${key}:`, e);
      }
    }
  }
}

const uploadManager = new UploadManager();

export default uploadManager;
