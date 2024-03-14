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
import EventEmitter from "events";
import { IAsyncTask, IAsyncTaskJSON, TaskCenter, AsyncTask } from "./index";
import logger from "../log";

export class QuickInstallTask extends AsyncTask {
  public static TYPE = "QuickInstallTask";

  public instance: Instance;
  public readonly TMP_ZIP_NAME = "mcsm_install_package.zip";
  public readonly ZIP_CONFIG_JSON = "mcsmanager-config.json";
  public zipPath = "";

  private downloadStream?: fs.WriteStream;
  private JAVA_17_PATH = path.normalize(
    path.join(process.cwd(), "lib", "jre17", "bin", "java.exe")
  );

  constructor(public instanceName: string, public targetLink: string) {
    super();
    const config = new InstanceConfig();
    config.nickname = instanceName;
    config.cwd = "";
    config.stopCommand = "stop";
    config.type = Instance.TYPE_MINECRAFT_JAVA;
    this.instance = InstanceSubsystem.createInstance(config);
    this.taskId = `${QuickInstallTask.TYPE}-${this.instance.instanceUuid}-${v4()}`;
    this.type = QuickInstallTask.TYPE;
  }

  private download(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        this.zipPath = path.normalize(path.join(this.instance.config.cwd, this.TMP_ZIP_NAME));
        const writeStream = fs.createWriteStream(this.zipPath);
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

  private hasJava17() {
    return fs.existsSync(this.JAVA_17_PATH);
  }

  async onStarted() {
    const fileManager = getFileManager(this.instance.instanceUuid);
    try {
      let result = await this.download();
      result = await fileManager.unzip(this.TMP_ZIP_NAME, ".", "UTF-8");
      if (!result) throw new Error($t("TXT_CODE_quick_install.unzipError"));
      const config = JSON.parse(await fileManager.readFile(this.ZIP_CONFIG_JSON)) as InstanceConfig;

      if (config.startCommand && config.startCommand.includes("{{java}}")) {
        if (this.hasJava17()) {
          config.startCommand = config.startCommand.replace("{{java}}", `"${this.JAVA_17_PATH}"`);
        } else {
          config.startCommand = config.startCommand.replace("{{java}}", "java");
        }
      }

      this.instance.parameters(config);
      this.stop();
    } catch (error: any) {
      this.error(error);
    } finally {
      fs.remove(fileManager.toAbsolutePath(this.TMP_ZIP_NAME), () => {});
    }
  }

  async onStopped(): Promise<boolean | void> {
    try {
      if (this.downloadStream) this.downloadStream.destroy(new Error("STOP TASK"));
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

export function createQuickInstallTask(targetLink: string, instanceName: string) {
  if (!targetLink || !instanceName) throw new Error("targetLink or instanceName is null!");
  const task = new QuickInstallTask(instanceName, targetLink);
  TaskCenter.addTask(task);
  return task;
}
