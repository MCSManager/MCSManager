import axios from "axios";
import { createWriteStream } from "fs";
import fs from "fs-extra";
import path from "path";
import { Throttle } from "stream-throttle";
import { getCommonHeaders } from "../common/network";
import { globalConfiguration } from "../entity/config";

export const DOWNLOAD_STATUS = {
  DOWNLOADING: 0,
  COMPLETED: 1,
  ERROR: 2
};

interface DownloadTask {
  id: string;
  path: string;
  total: number;
  current: number;
  status: number;
  error?: string;
  controller: AbortController;
}

class DownloadManager {
  public tasks: DownloadTask[] = [];

  public get downloadingCount() {
    return this.tasks.length;
  }

  public async downloadFromUrl(
    url: string,
    targetPath: string,
    fallbackUrl?: string
  ): Promise<void> {
    const taskId = Math.random().toString(36).substring(2, 15);
    const controller = new AbortController();
    const task: DownloadTask = {
      id: taskId,
      path: targetPath,
      total: 0,
      current: 0,
      status: DOWNLOAD_STATUS.DOWNLOADING,
      controller
    };
    this.tasks.push(task);

    try {
      // Ensure directory exists
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) fs.mkdirpSync(dir);

      const response = await this.requestWithRetry(url, controller);
      const total = parseInt(response.headers["content-length"] || "0");
      let current = 0;
      const stream = response.data;
      const writeStream = createWriteStream(targetPath);

      task.total = total;

      return new Promise((resolve, reject) => {
        const onError = (err: Error) => {
          stream.destroy();
          writeStream.destroy();
          const activeTask = this.tasks.find((t) => t.id === taskId);
          if (activeTask) {
            activeTask.status = DOWNLOAD_STATUS.ERROR;
            activeTask.error = err.message;
          }
          setTimeout(() => {
            this.tasks = this.tasks.filter((t) => t.id !== taskId);
          }, 1000);

          if (err.name === "CanceledError") {
            resolve();
            return;
          }
          reject(err);
        };

        const onFinish = () => {
          const activeTask = this.tasks.find((t) => t.id === taskId);
          if (activeTask) {
            activeTask.status = DOWNLOAD_STATUS.COMPLETED;
            if (total > 0) activeTask.current = total;
          }
          setTimeout(() => {
            this.tasks = this.tasks.filter((t) => t.id !== taskId);
          }, 1000);
          resolve();
        };

        stream.on("data", (chunk: any) => {
          current += chunk.length;
          const activeTask = this.tasks.find((t) => t.id === taskId);
          if (!activeTask) return;
          activeTask.current = current;
        });

        stream.on("error", onError);
        writeStream.on("error", onError);
        writeStream.on("finish", onFinish);

        const speedLimit = globalConfiguration.config.uploadSpeedRate;
        if (speedLimit <= 0) {
          stream.pipe(writeStream);
          return;
        }
        const throttleStream = new Throttle({ rate: speedLimit * 64 * 1024 });
        throttleStream.on("error", onError);
        stream.pipe(throttleStream).pipe(writeStream);
      });
    } catch (err: any) {
      if (fallbackUrl && !controller.signal.aborted) {
        this.tasks = this.tasks.filter((t) => t.id !== taskId);
        return await this.downloadFromUrl(fallbackUrl, targetPath);
      }

      if (err.name === "CanceledError") {
        this.tasks = this.tasks.filter((t) => t.id !== taskId);
        return;
      }

      const activeTask = this.tasks.find((t) => t.id === taskId);
      if (activeTask) {
        activeTask.status = DOWNLOAD_STATUS.ERROR;
        activeTask.error = err.message;
      }
      setTimeout(() => {
        this.tasks = this.tasks.filter((t) => t.id !== taskId);
      }, 1000);
      throw err;
    }
  }

  public stop(targetPath: string) {
    const task = this.tasks.find((t) => t.path === targetPath);
    if (!task) return false;

    task.controller.abort();
    this.tasks = this.tasks.filter((t) => t.id !== task.id);
    setTimeout(() => {
      fs.remove(task.path).catch(() => {});
    }, 1000);
    return true;
  }

  public stopById(taskId: string) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    task.controller.abort();
    this.tasks = this.tasks.filter((t) => t.id !== task.id);
    setTimeout(() => {
      fs.remove(task.path).catch(() => {});
    }, 1000);
    return true;
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
