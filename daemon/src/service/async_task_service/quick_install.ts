import { v4 } from "uuid";
import axios from "axios";
import { pipeline, Readable } from "stream";
import fs from "fs-extra";
import Instance from "../../entity/instance/instance";
import InstanceSubsystem from "../system_instance";
import InstanceConfig from "../../entity/instance/Instance_config";
import { $t, i18next } from "../../i18n";
import path from "path";
import { getFileManager } from "../file_router_service";
import { IAsyncTaskJSON, TaskCenter, AsyncTask } from "./index";
import logger from "../log";
import { t } from "i18next";
import type { IJsonData } from "common/global";
import GeneralUpdateCommand, {
  InstanceUpdateAction
} from "../../entity/commands/general/general_update";

export class QuickInstallTask extends AsyncTask {
  public static TYPE = "QuickInstallTask";

  public instance: Instance;
  public readonly TMP_ZIP_NAME = "mcsm_install_package.zip";
  public readonly ZIP_CONFIG_JSON = "mcsmanager-config.json";
  public filePath = "";
  public extName = "";

  private downloadStream?: fs.WriteStream;

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
    } else {
      this.instance = curInstance;
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
        this.filePath = path.normalize(path.join(this.instance.config.cwd, downloadFileName));
        const writeStream = fs.createWriteStream(this.filePath);
        const response = await axios<Readable>({
          url: this.targetLink,
          responseType: "stream"
        });
        this.downloadStream = pipeline(response.data, writeStream, (err) => {
          if (err) {
            reject(err);
          } else {
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
      if (this.targetLink) {
        let result = await this.download();
        if (this.extName === ".zip")
          result = await fileManager.unzip(this.TMP_ZIP_NAME, ".", "UTF-8");
        if (!result) throw new Error($t("TXT_CODE_quick_install.unzipError"));
      }

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

      // Render startCommand with ENV
      if (this.instance.config.startCommand) {
        let startCommand = this.instance.config.startCommand;
        const ENV_MAP: IJsonData = {
          java: "java",
          cwd: this.instance.config.cwd,
          rconIp: this.instance.config.rconIp || "localhost",
          rconPort: String(this.instance.config.rconPort),
          rconPassword: this.instance.config.rconPassword,
          nickname: this.instance.config.nickname,
          instanceUuid: this.instance.instanceUuid
        };
        for (const key in ENV_MAP) {
          const varDefine = `{{${key}}}`;
          while (startCommand.includes(varDefine))
            startCommand = startCommand?.replace(varDefine, ENV_MAP[key] || "");
        }
        this.instance.parameters({
          startCommand
        });
      }

      if (this.instance?.config?.updateCommand) {
        try {
          const updateAction = new InstanceUpdateAction(this.instance);
          await updateAction.start();
          await updateAction.wait();
        } catch (error) {}
      }

      this.stop();
    } catch (error: any) {
      this.error(error);
    } finally {
      if (fs.existsSync(fileManager.toAbsolutePath(this.TMP_ZIP_NAME)))
        fs.remove(fileManager.toAbsolutePath(this.TMP_ZIP_NAME), () => {});
    }
  }

  async onStop() {
    try {
      if (this.downloadStream && typeof this.downloadStream.destroy === "function")
        this.downloadStream.destroy(new Error("STOP TASK"));
    } catch (error: any) {}
  }

  onError(): void {}

  toObject(): IAsyncTaskJSON {
    return JSON.parse(
      JSON.stringify({
        taskId: this.taskId,
        status: this.status(),
        instanceUuid: this.instance.instanceUuid,
        instanceStatus: this.instance.status(),
        instanceConfig: this.instance.config
      })
    );
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
