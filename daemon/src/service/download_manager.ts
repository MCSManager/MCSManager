import axios from "axios";
import { createWriteStream } from "fs";
import fs from "fs-extra";
import path from "path";
import { Throttle } from "stream-throttle";
import { getCommonHeaders } from "../common/network";
import { globalConfiguration } from "../entity/config";
import { checkSafeUrl } from "../utils/url";
import { openOwnedWriteFile } from "../tools/owned_write_file";
import type { OwnedWriteFile } from "../tools/owned_write_file";
import type { FileOwnership } from "../tools/file_ownership";
import { $t } from "../i18n";

function createCancellationError(): Error {
  return Object.assign(new Error($t("TXT_CODE_1b7a8832")), { name: "CanceledError" });
}

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
  descriptorCleanup?: boolean;
}

export interface DownloadDestination {
  workspace: string;
  ownership: FileOwnership;
}

class DownloadManager {
  public tasks: DownloadTask[] = [];

  public get downloadingCount() {
    return this.tasks.length;
  }

  public async downloadFromUrl(
    url: string,
    targetPath: string,
    fallbackUrl?: string,
    onDownloaded?: () => Promise<void>,
    destination?: DownloadDestination
  ): Promise<void> {
    const taskId = Math.random().toString(36).substring(2, 15);
    const controller = new AbortController();
    const task: DownloadTask = {
      id: taskId,
      path: targetPath,
      total: 0,
      current: 0,
      status: DOWNLOAD_STATUS.DOWNLOADING,
      controller,
      descriptorCleanup: Boolean(destination)
    };
    this.tasks.push(task);

    let ownedTarget: OwnedWriteFile | undefined;
    let responseStream: import("stream").Readable | undefined;
    let targetModified = false;
    const closeTarget = async () => {
      const target = ownedTarget;
      ownedTarget = undefined;
      if (!target) return;
      try {
        if (controller.signal.aborted && targetModified) await target.remove();
      } finally {
        await target.close();
      }
    };
    try {
      // Ensure directory exists
      const dir = path.dirname(targetPath);
      if (!destination && !fs.existsSync(dir)) fs.mkdirpSync(dir);

      const response = await this.requestWithRetry(url, controller);
      const total = parseInt(response.headers["content-length"] || "0");
      let current = 0;
      const stream = response.data;
      responseStream = stream;
      if (destination) {
        ownedTarget = await openOwnedWriteFile(
          destination.workspace,
          targetPath,
          destination.ownership
        );
        if (controller.signal.aborted) throw createCancellationError();
        await ownedTarget.file.truncate(0);
        targetModified = true;
      }
      const writeStream = ownedTarget
        ? ownedTarget.file.createWriteStream({ autoClose: false })
        : createWriteStream(targetPath);

      task.total = total;

      return await new Promise<void>((resolve, reject) => {
        let settled = false;
        let throttleStream: Throttle | undefined;
        const onAbort = () => onError(createCancellationError());
        const onError = (err: Error) => {
          if (settled) return;
          settled = true;
          controller.signal.removeEventListener("abort", onAbort);
          stream.destroy();
          throttleStream?.destroy();
          const activeTask = this.tasks.find((t) => t.id === taskId);
          if (activeTask) {
            activeTask.status = DOWNLOAD_STATUS.ERROR;
            activeTask.error = err.message;
          }
          setTimeout(() => {
            this.tasks = this.tasks.filter((t) => t.id !== taskId);
          }, 1000);

          const settle = () => (err.name === "CanceledError" ? resolve() : reject(err));
          // Wait for pending stream I/O before releasing the destination handles.
          if (ownedTarget && !writeStream.closed) writeStream.once("close", settle);
          else settle();
          writeStream.destroy();
        };

        const onFinish = async () => {
          if (settled) return;
          try {
            if (onDownloaded && !controller.signal.aborted) await onDownloaded();
          } catch (error) {
            onError(error as Error);
            return;
          }
          if (settled) return;
          settled = true;
          controller.signal.removeEventListener("abort", onAbort);
          const activeTask = this.tasks.find((t) => t.id === taskId);
          if (activeTask) {
            activeTask.status = DOWNLOAD_STATUS.COMPLETED;
            if (total > 0) activeTask.current = total;
          }
          setTimeout(() => {
            this.tasks = this.tasks.filter((t) => t.id !== taskId);
          }, 1000);
          if (ownedTarget) {
            writeStream.once("close", resolve);
            writeStream.destroy();
          } else {
            resolve();
          }
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
        controller.signal.addEventListener("abort", onAbort, { once: true });
        if (controller.signal.aborted) {
          onAbort();
          return;
        }

        const speedLimit = globalConfiguration.config.uploadSpeedRate;
        if (speedLimit <= 0) {
          stream.pipe(writeStream);
          return;
        }
        throttleStream = new Throttle({ rate: speedLimit * 64 * 1024 });
        throttleStream.on("error", onError);
        stream.pipe(throttleStream).pipe(writeStream);
      }).finally(closeTarget);
    } catch (err: any) {
      responseStream?.destroy();
      await closeTarget();
      if (fallbackUrl && !controller.signal.aborted) {
        this.tasks = this.tasks.filter((t) => t.id !== taskId);
        return await this.downloadFromUrl(
          fallbackUrl,
          targetPath,
          undefined,
          onDownloaded,
          destination
        );
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
    if (!task.descriptorCleanup)
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
    if (!task.descriptorCleanup)
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
      let currentUrl = url;
      for (let redirectCount = 0; ; redirectCount++) {
        if (!(await checkSafeUrl(currentUrl))) {
          throw new Error(`Refusing unsafe download URL: ${currentUrl}`);
        }

        const response = await axios({
          method: "get",
          url: currentUrl,
          responseType: "stream",
          timeout: 60000,
          headers: getCommonHeaders(currentUrl),
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
          signal: controller.signal
        });

        if (response.status < 300) return response;
        if (redirectCount >= 10) {
          response.data?.destroy?.();
          throw new Error("Too many redirects while downloading file");
        }

        const location = response.headers.location;
        response.data?.destroy?.();
        if (!location) throw new Error("Redirect response did not include a location");
        currentUrl = new URL(location, currentUrl).toString();
      }
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
