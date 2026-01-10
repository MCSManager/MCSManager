import axios from "axios";
import { createWriteStream } from "fs";
import fs from "fs-extra";
import path from "path";
import { Throttle } from "stream-throttle";
import { getCommonHeaders } from "../common/network";
import { globalConfiguration } from "../entity/config";
import Instance from "../entity/instance/instance";
import { $t } from "../i18n";
import { DiskQuotaService } from "./disk_quota_service";
import { globalTaskQueue } from "./task_queue";

interface DownloadOptions {
  instance?: Instance;
  quotaService?: DiskQuotaService;
  hooks?: {
    taskId?: string;
    onProgress?: (current: number, total: number) => void;
    onComplete?: (status: "success" | "failed", error?: string) => void;
  };
}

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

  public async downloadFromUrl(
    url: string,
    targetPath: string,
    fallbackUrl?: string,
    options?: DownloadOptions
  ): Promise<void> {
    return await globalTaskQueue.enqueue(`download:${targetPath}`, async () => {
      try {
        // Ensure directory exists
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) fs.mkdirpSync(dir);

        const quotaService = options?.quotaService;
        const instance = options?.instance;
        const hooks = options?.hooks;

        // Setup controller and task state
        if (this.controller) this.controller.abort();
        this.controller = new AbortController();
        this.task = { path: targetPath, total: 0, current: 0, status: 0 };

        const response = await this.requestWithRetry(url, this.controller);
        const total = parseInt(response.headers["content-length"] || "0");
        let quotaLimit = 0;
        let quotaCurrent = 0;
        if (quotaService && instance) {
          const quotaInfo = await quotaService.getQuotaInfo(instance);
          quotaLimit = quotaInfo.limit;
          quotaCurrent = quotaInfo.used;
          if (quotaLimit > 0 && total > 0 && quotaCurrent + total > quotaLimit) {
            throw new Error($t("TXT_CODE_disk_quota_exceeded_write"));
          }
        }

        let current = 0;
        const stream = response.data;
        const writeStream = createWriteStream(targetPath);

        this.task.total = total;
        hooks?.onProgress?.(0, total);

        return new Promise((resolve, reject) => {
          const onError = (err: Error) => {
            stream.destroy();
            writeStream.destroy();
            fs.remove(targetPath).catch(() => {});
            if (this.task) {
              this.task.status = 2;
              this.task.error = err.message;
              setTimeout(() => {
                if (this.task?.status === 2) this.task = null;
              }, 10000);
            }
            hooks?.onComplete?.("failed", err.message);
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
            hooks?.onComplete?.("success");
            resolve();
          };

          stream.on("data", (chunk: any) => {
            current += chunk.length;
            if (this.task) this.task.current = current;
            hooks?.onProgress?.(current, total);

            if (quotaLimit > 0) {
              quotaCurrent += chunk.length;
              if (quotaCurrent > quotaLimit) {
                const err = new Error($t("TXT_CODE_disk_quota_exceeded_write"));
                return onError(err);
              }
            }
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
          return await this.downloadFromUrl(fallbackUrl, targetPath, undefined, options);
        }
        if (this.task) {
          this.task.status = 2;
          this.task.error = err.message;
          setTimeout(() => {
            if (this.task?.status === 2) this.task = null;
          }, 10000);
        }
        options?.hooks?.onComplete?.("failed", err.message);
        throw err;
      }
    });
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
