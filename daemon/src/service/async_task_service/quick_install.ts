import { v4 } from "uuid";
import axios from "axios";
import { pipeline, Readable } from "stream";
import fs from "fs-extra";
import Instance from "../../entity/instance/instance";
import InstanceSubsystem from "../system_instance";
import InstanceConfig from "../../entity/instance/Instance_config";
import { $t } from "../../i18n";
import path from "path";
import { getFileManager } from "../file_router_service";
import { IAsyncTaskJSON, TaskCenter, AsyncTask } from "./index";
import logger from "../log";
import { t } from "i18next";
import { InstanceUpdateAction } from "../instance_update_action";
import prettyBytes from "pretty-bytes";
import { formatTime } from "../../tools/time";

export class QuickInstallTask extends AsyncTask {
  public static TYPE = "QuickInstallTask";

  public instance: Instance;
  public readonly TMP_ZIP_NAME = "mcsm_install_package.zip";
  public readonly ZIP_CONFIG_JSON = "mcsmanager-config.json";
  public filePath = "";
  public extName = "";

  public downloadProgress = {
    percentage: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    speed: 0, // bytes per second
    eta: 0 // estimated time remaining in seconds
  };

  private downloadStream?: fs.WriteStream;
  private writeStream?: fs.WriteStream;
  private updateTask?: InstanceUpdateAction;
  private lastProgressOutput = 0; // Throttle progress output
  private abortController = new AbortController();
  private isInitInstance = false;

  constructor(
    public instanceName: string,
    public targetLink?: string,
    public buildParams?: Partial<InstanceConfig>,
    curInstance?: Instance
  ) {
    super();
    const config = new InstanceConfig();
    config.nickname = instanceName;
    config.stopCommand = "^c";
    if (!curInstance) {
      config.cwd = "";
      this.instance = InstanceSubsystem.createInstance(config);
      this.isInitInstance = true;
    } else {
      this.instance = curInstance;
      this.isInitInstance = false;
    }

    this.taskId = `${QuickInstallTask.TYPE}-${this.instance.instanceUuid}-${v4()}`;
    this.type = QuickInstallTask.TYPE;
    this.extName = path.extname(this.targetLink ?? "") || ".zip";
  }

  private download(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.targetLink) return reject(new Error("No targetLink!"));
        let downloadFileName = this.TMP_ZIP_NAME;
        if (this.extName !== ".zip") {
          const url = new URL(this.targetLink);
          downloadFileName = url.pathname.split("/").pop() || `application${this.extName}`;
        }
        this.filePath = path.normalize(
          path.join(this.instance.absoluteCwdPath(), downloadFileName)
        );
        this.writeStream = fs.createWriteStream(this.filePath);

        // Initialize download progress
        this.downloadProgress = {
          percentage: 0,
          downloadedBytes: 0,
          totalBytes: 0,
          speed: 0,
          eta: 0
        };

        const response = await axios<Readable>({
          url: this.targetLink,
          responseType: "stream",
          signal: this.abortController.signal
        });

        // Get total file size
        const contentLength = response.headers["content-length"];
        if (contentLength) {
          this.downloadProgress.totalBytes = parseInt(contentLength);
        }

        let lastProgressUpdate = Date.now();
        let lastDownloadedBytes = 0;

        response.data.on("data", (chunk: Buffer) => {
          this.downloadProgress.downloadedBytes += chunk.length;

          // Calculate download speed (update every second)
          const currentTime = Date.now();
          if (currentTime - lastProgressUpdate >= 1000) {
            const timeDiff = (currentTime - lastProgressUpdate) / 1000;
            const bytesDiff = this.downloadProgress.downloadedBytes - lastDownloadedBytes;
            this.downloadProgress.speed = bytesDiff / timeDiff;

            // Calculate remaining time
            if (this.downloadProgress.speed > 0 && this.downloadProgress.totalBytes > 0) {
              const remainingBytes =
                this.downloadProgress.totalBytes - this.downloadProgress.downloadedBytes;
              this.downloadProgress.eta = remainingBytes / this.downloadProgress.speed;
            }

            lastProgressUpdate = currentTime;
            lastDownloadedBytes = this.downloadProgress.downloadedBytes;
          }

          // Calculate download percentage
          if (this.downloadProgress.totalBytes > 0) {
            this.downloadProgress.percentage = Math.round(
              (this.downloadProgress.downloadedBytes / this.downloadProgress.totalBytes) * 100
            );
          }

          // Throttle progress output to once per second
          const now = Date.now();
          if (now - this.lastProgressOutput >= 1000) {
            const size = `${prettyBytes(this.downloadProgress.downloadedBytes)}/${prettyBytes(
              this.downloadProgress.totalBytes
            )}`;
            const speed = `${prettyBytes(this.downloadProgress.speed)}/s, ETA: ${formatTime(
              this.downloadProgress.eta
            )}`;
            this.instance.println(
              "INFO",
              `Downloading... (${this.downloadProgress.percentage}%): ${size}, ${speed}`
            );
            this.lastProgressOutput = now;
          }
        });

        this.downloadStream = pipeline(response.data, this.writeStream, (err) => {
          if (err) {
            reject(err);
          } else {
            this.downloadProgress.percentage = 100;
            this.downloadProgress.downloadedBytes = this.downloadProgress.totalBytes;
            this.instance.println(
              "INFO",
              `Download "${this.targetLink}" success! ${(
                this.downloadProgress.downloadedBytes /
                1024 /
                1024
              ).toFixed(2)} MB`
            );
            resolve(true);
          }
        });
      } catch (error: any) {
        reject(error);
      }
    });
  }

  async onStart() {
    const fileManager = getFileManager(this.instance.instanceUuid);
    try {
      this.instance.status(Instance.STATUS_BUSY);
      if (this.isInitInstance) {
        if (this.instance.asynchronousTask) {
          throw new Error(
            $t("无法开始安装，因为有其他的异步任务正在进行，请在终端页先终止其他任务！")
          );
        }
        this.instance.asynchronousTask = this;
      }

      if (this.targetLink) {
        let result = await this.download();
        this.instance.println("INFO", $t("正在解压文件..."));
        if (this.extName === ".zip")
          result = await fileManager.unzip(this.TMP_ZIP_NAME, ".", "UTF-8");
        if (!result) {
          this.error(new Error($t("TXT_CODE_quick_install.unzipError")));
          return;
        }
      }

      this.instance.println("INFO", $t("正在构建配置..."));
      let config: Partial<InstanceConfig>;
      if (this.buildParams?.startCommand || !fs.existsSync(this.ZIP_CONFIG_JSON)) {
        config = this.buildParams || {};
      } else {
        config = JSON.parse(await fileManager.readFile(this.ZIP_CONFIG_JSON));
      }

      logger.info(
        t("TXT_CODE_e5ba712d"),
        this.instance.config.nickname,
        this.instance.instanceUuid,
        "URL:",
        this.targetLink
      );
      logger.info(t("TXT_CODE_ac225d07") + JSON.stringify(config));

      this.instance.parameters(config);

      this.instance.println("INFO", $t("配置构建成功！"));

      if (this.instance?.config?.updateCommand) {
        try {
          this.instance.println("INFO", $t("正在更新实例..."));
          this.updateTask = new InstanceUpdateAction(this.instance);
          await this.updateTask.start();
          await this.updateTask.wait();
          this.instance.println("INFO", $t("实例更新成功！"));
        } catch (error: any) {
          this.instance.println("WARNING", $t("实例更新失败！原因：") + error?.message);
        }
      }
      this.instance.println("INFO", $t("所有安装操作均已执行完成，请尝试启动实例..."));

      this.stop();
    } catch (error: any) {
      this.error(error);
    } finally {
      this.instance.status(Instance.STATUS_STOP);
      if (this.isInitInstance && this.instance.asynchronousTask === this)
        this.instance.asynchronousTask = undefined;
      if (fs.existsSync(fileManager.toAbsolutePath(this.TMP_ZIP_NAME)))
        fs.remove(fileManager.toAbsolutePath(this.TMP_ZIP_NAME), () => {});
    }
  }

  async onStop() {
    try {
      this.abortController.abort();
      this.writeStream?.destroy();
      this.downloadStream?.destroy();
      this.writeStream = undefined;
      this.downloadStream = undefined;
    } catch (error: any) {
      this.instance.println(
        "ERROR",
        "QuickInstallTask -> onStop(): destroy download stream error: " + error?.message
      );
      logger.error("QuickInstallTask -> onStop(): destroy download stream error: ", error);
    }

    try {
      await this.updateTask?.stop();
      this.updateTask = undefined;
    } catch (error: any) {
      this.instance.println(
        "ERROR",
        "QuickInstallTask -> onStop(): updateTask stop error: " + error?.message
      );
      logger.error("QuickInstallTask -> onStop(): updateTask stop error: ", error);
    }
  }

  toObject(): IAsyncTaskJSON {
    return JSON.parse(
      JSON.stringify({
        taskId: this.taskId,
        status: this.status(),
        instanceUuid: this.instance.instanceUuid,
        instanceStatus: this.instance.status(),
        instanceConfig: this.instance.config,
        downloadProgress: this.downloadProgress
      })
    );
  }

  async onError(err: Error) {
    this.instance.println("ERROR", err?.message);
  }
}

export function createQuickInstallTask(
  targetLink?: string,
  instanceName?: string,
  buildParams?: any
) {
  if (!instanceName) throw new Error("Instance name is empty!");
  const task = new QuickInstallTask(instanceName, targetLink, buildParams);
  TaskCenter.addTask(task);
  return task;
}
