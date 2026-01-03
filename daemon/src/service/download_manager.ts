import axios from "axios";
import { createWriteStream } from "fs";
import fs from "fs-extra";
import path from "path";
import { Throttle } from "stream-throttle";
import { globalConfiguration } from "../entity/config";

class DownloadManager {
  public downloadingCount = 0;
  public tasks = new Map<string, { total: number; current: number; status: number; error?: string }>();

  public async downloadFromUrl(url: string, targetPath: string): Promise<void> {
    const taskId = targetPath;
    this.tasks.set(taskId, { total: 0, current: 0, status: 0 });
    this.downloadingCount++;

    try {
      // Ensure directory exists
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirpSync(dir);
      }

      const response = await axios({
        method: "get",
        url: url,
        responseType: "stream",
        timeout: 30000
      });

      const total = parseInt(response.headers["content-length"] || "0");
      let current = 0;
      this.tasks.set(taskId, { total, current, status: 0 });

      return new Promise((resolve, reject) => {
        const stream = response.data;

        const writeStream = createWriteStream(targetPath);
        const onError = (err: Error) => {
          stream.destroy();
          writeStream.destroy();

          this.tasks.set(taskId, { total, current, status: 2, error: err.message });
          setTimeout(() => this.tasks.delete(taskId), 10000);
          this.downloadingCount--;
          reject(err);
        };
        const onFinish = () => {
          this.tasks.set(taskId, { total, current: total, status: 1 });
          setTimeout(() => this.tasks.delete(taskId), 5000);
          this.downloadingCount--;
          resolve();
        };

        stream.on("data", (chunk: any) => {
          current += chunk.length;
          this.tasks.set(taskId, { total, current, status: 0 });
        });

        stream.on("error", onError);
        writeStream.on("error", onError);
        writeStream.on("finish", onFinish);

        const speedLimit = globalConfiguration.config.uploadSpeedRate;
        if (speedLimit > 0) {
          const throttleStream = new Throttle({
            rate: speedLimit * 64 * 1024
          });
          throttleStream.on("error", onError);
          stream.pipe(throttleStream).pipe(writeStream);
        } else {
          stream.pipe(writeStream);
        }
      });
    } catch (err: any) {
      this.tasks.set(taskId, { total: 0, current: 0, status: 2, error: err.message });
      setTimeout(() => this.tasks.delete(taskId), 10000);
      this.downloadingCount--;
      throw err;
    }
  }
}

const downloadManager = new DownloadManager();

export default downloadManager;
