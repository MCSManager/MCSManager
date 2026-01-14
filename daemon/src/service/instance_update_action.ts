import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import iconv from "iconv-lite";
import { killProcess } from "mcsmanager-common";
import { commandStringToArray } from "../entity/commands/base/command_parser";
import Instance from "../entity/instance/instance";
import { $t } from "../i18n";
import { AsyncTask, IAsyncTaskJSON } from "../service/async_task_service";
import logger from "../service/log";
import { SetupDockerContainer } from "./docker_process_service";

export class InstanceUpdateAction extends AsyncTask {
  public pid?: number;

  private process?: ChildProcessWithoutNullStreams;
  private containerWrapper?: SetupDockerContainer;

  constructor(public readonly instance: Instance) {
    super();
  }

  public async onStart() {
    const updateCommand = await this.instance.parseTextParams(this.instance.config.updateCommand);
    logger.info(
      $t("TXT_CODE_general_update.readyUpdate", { instanceUuid: this.instance.instanceUuid })
    );
    logger.info(
      $t("TXT_CODE_general_update.updateCmd", { instanceUuid: this.instance.instanceUuid })
    );
    logger.info(updateCommand);

    this.instance.print("\n");
    this.instance.println(
      $t("TXT_CODE_general_update.update"),
      $t("TXT_CODE_general_update.readyUpdate", { instanceUuid: this.instance.instanceUuid })
    );
    this.instance.println($t("TXT_CODE_general_update.update"), `${updateCommand}`);

    // Docker Update Command Mode
    if (this.instance.config.processType === "docker" && this.instance.config.docker?.image) {
      this.containerWrapper = new SetupDockerContainer(this.instance, updateCommand);
      await this.containerWrapper.start();
      await this.containerWrapper.attach(this.instance);
      await this.containerWrapper.wait();
      this.stop();
      return;
    }

    const commandList = commandStringToArray(updateCommand);
    const commandExeFile = commandList[0];
    const commandParameters = commandList.slice(1);
    if (commandList.length === 0) {
      throw new Error($t("TXT_CODE_general_update.cmdFormatErr"));
    }

    // start the update command
    const process = spawn(commandExeFile, commandParameters, {
      cwd: this.instance.absoluteCwdPath(),
      stdio: "pipe",
      windowsHide: true
    });
    if (!process || !process.pid) {
      throw new Error($t("TXT_CODE_general_update.updateFailed"));
    }

    // process & pid
    this.pid = process.pid;
    this.process = process;

    process.stdout.on("data", (text) => {
      this.instance.print(iconv.decode(text, this.instance.config.oe));
    });
    process.stderr.on("data", (text) => {
      this.instance.print(iconv.decode(text, this.instance.config.oe));
    });

    process.on("exit", (code) => {
      if (code === 0) {
        this.stop();
      } else {
        this.error(new Error($t("TXT_CODE_general_update.updateErr")));
      }
    });
  }

  public async onStop() {
    if (this.containerWrapper) {
      await this.containerWrapper.stop();
    }
    if (this.pid && this.process) {
      killProcess(this.pid, this.process);
    }
  }

  public async onError(err: Error) {}
  public toObject(): IAsyncTaskJSON {
    throw new Error("Method not implemented.");
  }
}
