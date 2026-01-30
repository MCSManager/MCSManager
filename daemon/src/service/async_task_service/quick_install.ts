import axios from "axios";
import fs from "fs-extra";
import { t } from "i18next";
import path from "path";
import { pipeline, Readable } from "stream";
import { v4 } from "uuid";
import Instance from "../../entity/instance/instance";
import InstanceConfig from "../../entity/instance/Instance_config";
import { $t } from "../../i18n";
import { getFileManager } from "../file_router_service";
import { getCommonHeaders } from "../../common/network";
import { InstanceUpdateAction } from "../instance_update_action";
import logger from "../log";
import InstanceSubsystem from "../system_instance";
import { AsyncTask, IAsyncTaskJSON, TaskCenter } from "./index";

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

  private lastProgressOutput = 0; // Throttle progress output
  private isInitInstance = false;

  private abortController?: AbortController;
  private downloadStream?: fs.WriteStream;
  private writeStream?: fs.WriteStream;
  private updateTask?: InstanceUpdateAction;

  constructor(
    public instanceName: string,
    public targetLink?: string,
    public buildParams?: IGlobalInstanceConfig,
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

  private async download() {
    this.abortController = new AbortController();
    if (!this.targetLink) throw new Error("No targetLink!");
    let downloadFileName = this.TMP_ZIP_NAME;
    if (this.extName !== ".zip") {
      const url = new URL(this.targetLink);
      downloadFileName = url.pathname.split("/").pop() || `application${this.extName}`;
    }
    this.filePath = path.normalize(path.join(this.instance.absoluteCwdPath(), downloadFileName));
    this.writeStream = fs.createWriteStream(this.filePath);
    if (!this.writeStream) throw new Error("Not writeStream!");

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
      signal: this.abortController.signal,
      headers: getCommonHeaders(this.targetLink),
      maxRedirects: 10
    });

    // Get total file size
    const contentLength = response.headers["content-length"];
    if (contentLength) {
      this.downloadProgress.totalBytes = parseInt(contentLength);
    }

    let lastProgressUpdate = Date.now();
    let lastDownloadedBytes = 0;

    // listen download progress
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
      const PROGRESS_THROTTLE_MS = 1000;
      if (now - this.lastProgressOutput >= PROGRESS_THROTTLE_MS) {
        const downloadText = t("TXT_CODE_b135e9bd");
        const speed = `${(this.downloadProgress.speed / 1024 / 1024).toFixed(2)} MB/s`;
        this.instance.println(
          "INFO",
          `${downloadText} ${this.downloadProgress.percentage}% ${speed}`
        );
        this.lastProgressOutput = now;
      }
    });

    // await download
    await new Promise<boolean>(async (resolve, reject) => {
      this.downloadStream = pipeline(response.data, this.writeStream!, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });

    this.downloadProgress.percentage = 100;
    this.downloadProgress.downloadedBytes = this.downloadProgress.totalBytes;
    this.instance.println("INFO", `Download "${this.targetLink}" success!!!`);
  }

  async onStart() {
    this.instance.print("\n");
    if (
      this.instance.config.processType === "docker" &&
      this.buildParams?.processType !== "docker"
    ) {
      this.instance.println("ERROR", $t("TXT_CODE_f8145844"));
      this.stop();
      return;
    }

    this.instance.println("INFO", $t("TXT_CODE_e166bc2f"));

    const fileManager = getFileManager(this.instance.instanceUuid);
    try {
      this.instance.status(Instance.STATUS_BUSY);
      if (this.isInitInstance) {
        if (this.instance.asynchronousTask) {
          throw new Error($t("TXT_CODE_5b0e93b5"));
        }
        this.instance.asynchronousTask = this;
      }

      if (this.targetLink) {
        await this.download();
        this.instance.println("INFO", $t("TXT_CODE_e4a926bf"));
        if (this.extName === ".zip") {
          const isOk = await fileManager.unzip(this.TMP_ZIP_NAME, ".", "UTF-8");
          if (!isOk) {
            this.error(new Error($t("TXT_CODE_quick_install.unzipError")));
            return;
          }
        }
      }

      this.instance.println("INFO", $t("TXT_CODE_9df98e2"));
      let config: Partial<IGlobalInstanceConfig>;
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

      this.instance.resetConfigWithoutDocker();
      this.instance.parameters(config, true);

      this.instance.println("INFO", $t("TXT_CODE_4eccdde8"));

      if (this.instance?.config?.updateCommand) {
        try {
          this.instance.println("INFO", $t("TXT_CODE_e577c77c"));
          this.updateTask = new InstanceUpdateAction(this.instance);
          await this.updateTask.start();
          await this.updateTask.wait();
          this.instance.println("INFO", $t("TXT_CODE_9b4985d3"));
          this.instance.println("INFO", $t("TXT_CODE_1562f6cf"));
        } catch (error: any) {
          this.instance.println(
            "ERROR",
            `\n========================================
${$t("TXT_CODE_47d56d0d")}
${error?.message}
========================================\n`
          );
        }
      } else {
        this.instance.println("INFO", $t("TXT_CODE_1562f6cf"));
      }

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
      this.abortController?.abort();
      this.writeStream?.destroy();
      this.downloadStream?.destroy();
      this.writeStream = undefined;
      this.downloadStream = undefined;
      this.abortController = undefined;
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
    } finally {
      this.instance.print("\n");
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
