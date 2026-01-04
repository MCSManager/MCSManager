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

      const urlObj = new URL(url);
      const response = await axios({
        method: "get",
        url: url,
        responseType: "stream",
        timeout: 60000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Referer: urlObj.origin,
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1"
        },
        maxRedirects: 10
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
