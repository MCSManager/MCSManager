import { $t } from "../../../i18n";
import { killProcess } from "common";
import { ChildProcess, ChildProcessWithoutNullStreams, exec, spawn } from "child_process";
import logger from "../../../service/log";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { commandStringToArray } from "../base/command_parser";
import iconv from "iconv-lite";
import { AsyncTask, IAsyncTaskJSON } from "../../../service/async_task_service";

export class InstanceUpdateAction extends AsyncTask {
  public pid?: number;
  public process?: ChildProcessWithoutNullStreams;

  constructor(public readonly instance: Instance) {
    super();
  }

  public async onStart() {
    let updateCommand = this.instance.config.updateCommand;
    updateCommand = updateCommand.replace(/\{mcsm_workspace\}/gm, this.instance.config.cwd);
    logger.info(
      $t("TXT_CODE_general_update.readyUpdate", { instanceUuid: this.instance.instanceUuid })
    );
    logger.info(
      $t("TXT_CODE_general_update.updateCmd", { instanceUuid: this.instance.instanceUuid })
    );
    logger.info(updateCommand);

    this.instance.println(
      $t("TXT_CODE_general_update.update"),
      $t("TXT_CODE_general_update.readyUpdate", { instanceUuid: this.instance.instanceUuid })
    );

    // command parsing
    const commandList = commandStringToArray(updateCommand);
    const commandExeFile = commandList[0];
    const commandParameters = commandList.slice(1);
    if (commandList.length === 0) {
      return this.instance.failure(new Error($t("TXT_CODE_general_update.cmdFormatErr")));
    }

    // start the update command
    const process = spawn(commandExeFile, commandParameters, {
      cwd: this.instance.config.cwd,
      stdio: "pipe",
      windowsHide: true
    });
    if (!process || !process.pid) {
      return this.instance.println(
        $t("TXT_CODE_general_update.err"),
        $t("TXT_CODE_general_update.updateFailed")
      );
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
    if (this.pid && this.process) {
      killProcess(this.pid, this.process);
    }
  }

  public onError(err: Error): void {}
  public toObject(): IAsyncTaskJSON {
    throw new Error("Method not implemented.");
  }
}

export default class GeneralUpdateCommand extends InstanceCommand {
  private pid?: number;
  private process?: ChildProcess;

  constructor() {
    super("GeneralUpdateCommand");
  }

  private stopped(instance: Instance) {
    instance.asynchronousTask = undefined;
    instance.setLock(false);
    instance.status(Instance.STATUS_STOP);
  }

  async exec(instance: Instance) {
    if (instance.status() !== Instance.STATUS_STOP && instance.status() !== Instance.STATUS_BUSY)
      return instance.failure(new Error($t("TXT_CODE_general_update.statusErr_notStop")));
    if (instance.asynchronousTask)
      return instance.failure(new Error($t("TXT_CODE_general_update.statusErr_otherProgress")));

    try {
      instance.setLock(true);
      instance.asynchronousTask = this;
      instance.status(Instance.STATUS_BUSY);

      const instanceUpdateAction = new InstanceUpdateAction(instance);
      await instanceUpdateAction.start();
      await instanceUpdateAction.wait();
    } catch (err: any) {
      instance.println(
        $t("TXT_CODE_general_update.update"),
        $t("TXT_CODE_general_update.error", { err: err })
      );
    } finally {
      this.stopped(instance);
    }
  }

  async stop(instance: Instance): Promise<void> {
    instance.asynchronousTask = undefined;
    logger.info(
      $t("TXT_CODE_general_update.terminateUpdate", { instanceUuid: instance.instanceUuid })
    );
    instance.println(
      $t("TXT_CODE_general_update.update"),
      $t("TXT_CODE_general_update.terminateUpdate", { instanceUuid: instance.instanceUuid })
    );
    instance.println(
      $t("TXT_CODE_general_update.update"),
      $t("TXT_CODE_general_update.killProcess")
    );
    if (this.pid && this.process) {
      killProcess(this.pid, this.process);
    }
  }
}
