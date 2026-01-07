import axios from "axios";
import { createWriteStream } from "fs";
import fs from "fs-extra";
import path from "path";
import { Throttle } from "stream-throttle";
import { globalConfiguration } from "../entity/config";
import { getCommonHeaders } from "../common/network";

class DownloadManager {
  private controller: AbortController | null = null;
  public task: {
    path: string;
    total: number;
    current: number;
    status: number;
    error?: string;
  } | null = null;

  public get downloadingCount() {
    return this.task ? 1 : 0;
  }

  public async downloadFromUrl(url: string, targetPath: string, fallbackUrl?: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) fs.mkdirpSync(dir);

      // Setup controller and task state
      if (this.controller) this.controller.abort();
      this.controller = new AbortController();
      this.task = { path: targetPath, total: 0, current: 0, status: 0 };

      const response = await this.requestWithRetry(url, this.controller);
      const total = parseInt(response.headers["content-length"] || "0");
      let current = 0;
      const stream = response.data;
      const writeStream = createWriteStream(targetPath);

      this.task.total = total;

      return new Promise((resolve, reject) => {
        const onError = (err: Error) => {
          stream.destroy();
          writeStream.destroy();
          if (this.task) {
            this.task.status = 2;
            this.task.error = err.message;
            setTimeout(() => {
              if (this.task?.status === 2) this.task = null;
            }, 10000);
          }
          reject(err);
        };

        const onFinish = () => {
          if (this.task) {
            this.task.status = 1;
            this.task.current = total;
            setTimeout(() => {
              if (this.task?.status === 1) this.task = null;
            }, 5000);
          }
          resolve();
        };

        stream.on("data", (chunk: any) => {
          current += chunk.length;
          if (this.task) this.task.current = current;
        });

        stream.on("error", onError);
        writeStream.on("error", onError);
        writeStream.on("finish", onFinish);

        const speedLimit = globalConfiguration.config.uploadSpeedRate;
        if (speedLimit > 0) {
          const throttleStream = new Throttle({ rate: speedLimit * 64 * 1024 });
          throttleStream.on("error", onError);
          stream.pipe(throttleStream).pipe(writeStream);
        } else {
          stream.pipe(writeStream);
        }
      });
    } catch (err: any) {
      if (fallbackUrl && !this.controller?.signal.aborted) {
        return await this.downloadFromUrl(fallbackUrl, targetPath);
      }
      if (this.task) {
        this.task.status = 2;
        this.task.error = err.message;
        setTimeout(() => {
          if (this.task?.status === 2) this.task = null;
        }, 10000);
      }
      throw err;
    }
  }

  public stop(taskId?: string) {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
      if (this.task) {
        const path = this.task.path;
        this.task = null;
        setTimeout(() => {
          fs.remove(path).catch(() => {});
        }, 1000);
      }
      return true;
    }
    return false;
  }

  private async requestWithRetry(
    url: string,
    controller: AbortController,
    retries = 2
  ): Promise<any> {
    try {
      return await axios({
        method: "get",
        url: url,
        responseType: "stream",
        timeout: 60000,
        headers: getCommonHeaders(url),
        maxRedirects: 10,
        signal: controller.signal
      });
    } catch (err: any) {
      if (controller.signal.aborted) throw err;

      const isNetworkError =
        !err.response &&
        (err.code === "ECONNRESET" || err.code === "ETIMEDOUT" || err.code === "ECONNABORTED");
      const isRetryableStatus = [500, 502, 503, 504].includes(err.response?.status);

      if (retries > 0 && (isNetworkError || isRetryableStatus)) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return await this.requestWithRetry(url, controller, retries - 1);
      }
      if (err.response?.status === 403) {
        throw new Error(
          `Access denied (403) for ${url}. This might be a premium plugin or Cloudflare protection.`
        );
      }
      throw err;
    }
  }
}

const downloadManager = new DownloadManager();

export default downloadManager;
