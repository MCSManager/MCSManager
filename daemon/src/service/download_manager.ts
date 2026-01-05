import axios from "axios";
import { createWriteStream } from "fs";
import fs from "fs-extra";
import path from "path";
import { Throttle } from "stream-throttle";
import { globalConfiguration } from "../entity/config";

class DownloadManager {
  public downloadingCount = 0;
  public tasks = new Map<
    string,
    {
      total: number;
      current: number;
      status: number;
      error?: string;
      stream?: any;
      controller?: AbortController;
      writeStream?: any;
    }
  >();

  public async downloadFromUrl(url: string, targetPath: string, fallbackUrl?: string): Promise<void> {
    const taskId = targetPath;
    const controller = new AbortController();
    this.tasks.set(taskId, { total: 0, current: 0, status: 0, controller });
    this.downloadingCount++;

    try {
      // Ensure directory exists
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirpSync(dir);
      }

      const urlObj = new URL(url);
      const commonHeaders = {
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
      };

      let response;
      const maxRetries = 2;
      let lastError: any;

      for (let i = 0; i <= maxRetries; i++) {
        try {
          response = await axios({
            method: "get",
            url: url,
            responseType: "stream",
            timeout: 60000,
            headers: commonHeaders,
            maxRedirects: 10,
            signal: controller.signal
          });
          break;
        } catch (err: any) {
          lastError = err;
          const isNetworkError =
            err.code === "ECONNRESET" || err.code === "ETIMEDOUT" || err.code === "ECONNABORTED";
          const isRetryableStatus = [500, 502, 503, 504].includes(err.response?.status);

          if (i < maxRetries && (isNetworkError || isRetryableStatus) && !controller.signal.aborted) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }

          // If primary URL fails after retries, try fallback URL if provided
          if (fallbackUrl && !controller.signal.aborted) {
            const fallbackUrlObj = new URL(fallbackUrl);
            try {
              response = await axios({
                method: "get",
                url: fallbackUrl,
                responseType: "stream",
                timeout: 60000,
                headers: {
                  ...commonHeaders,
                  Referer: fallbackUrlObj.origin
                },
                maxRedirects: 10,
                signal: controller.signal
              });
              break;
            } catch (fallbackErr) {
              throw fallbackErr;
            }
          } else {
            throw err;
          }
        }
      }

      if (!response) throw new Error("Download failed: No response received");

      const total = parseInt(response.headers["content-length"] || "0");
      let current = 0;
      const stream = response.data;
      const writeStream = createWriteStream(targetPath);

      this.tasks.set(taskId, { total, current, status: 0, stream, controller, writeStream });

      return new Promise((resolve, reject) => {
        const onError = (err: Error) => {
          stream.destroy();
          writeStream.destroy();

          // Only update status if task wasn't manually stopped
          if (this.tasks.has(taskId)) {
            this.tasks.set(taskId, { total, current, status: 2, error: err.message });
            setTimeout(() => this.tasks.delete(taskId), 10000);
            this.downloadingCount--;
          }
          reject(err);
        };
        const onFinish = () => {
          if (this.tasks.has(taskId)) {
            this.tasks.set(taskId, { total, current: total, status: 1 });
            setTimeout(() => this.tasks.delete(taskId), 5000);
            this.downloadingCount--;
          }
          resolve();
        };

        stream.on("data", (chunk: any) => {
          current += chunk.length;
          if (this.tasks.has(taskId)) {
            this.tasks.set(taskId, { total, current, status: 0, stream, controller, writeStream });
          }
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
      if (this.tasks.has(taskId)) {
        this.tasks.set(taskId, { total: 0, current: 0, status: 2, error: err.message });
        setTimeout(() => this.tasks.delete(taskId), 10000);
        this.downloadingCount--;
      }
      throw err;
    }
  }

  public stop(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      if (task.controller) task.controller.abort();
      if (task.stream) task.stream.destroy();
      if (task.writeStream) {
        task.writeStream.destroy();
        // Try to delete the partial file
        setTimeout(() => {
          fs.remove(taskId).catch(() => {});
        }, 1000);
      }
      this.tasks.delete(taskId);
      this.downloadingCount--;
      return true;
    }
    return false;
  }
}

const downloadManager = new DownloadManager();

export default downloadManager;
