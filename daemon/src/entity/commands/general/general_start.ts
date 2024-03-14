import { $t } from "../../../i18n";
import os from "os";
import Instance from "../../instance/instance";
import logger from "../../../service/log";
import fs from "fs-extra";
import InstanceCommand from "../base/command";
import EventEmitter from "events";
import { IInstanceProcess } from "../../instance/interface";
import { ChildProcess, exec, spawn } from "child_process";
import { commandStringToArray } from "../base/command_parser";
import { killProcess } from "common";

// Error exception at startup
class StartupError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

// Docker process adapter
class ProcessAdapter extends EventEmitter implements IInstanceProcess {
  pid?: number | string;

  constructor(private process: ChildProcess) {
    super();
    this.pid = this.process.pid;
    process.stdout?.on("data", (text) => this.emit("data", text));
    process.stderr?.on("data", (text) => this.emit("data", text));
    process.on("exit", (code) => this.emit("exit", code));
  }

  public write(data?: string) {
    return this.process.stdin?.write(data);
  }

  public kill(s?: any) {
    if (this.pid) return killProcess(this.pid, this.process, s);
  }

  public async destroy() {
    // remove all dynamically added event listeners
    for (const n of this.eventNames()) this.removeAllListeners(n);
    if (this.process.stdout)
      for (const eventName of this.process.stdout.eventNames())
        this.process.stdout.removeAllListeners(eventName);
    if (this.process.stderr)
      for (const eventName of this.process.stderr.eventNames())
        this.process.stderr.removeAllListeners(eventName);
    if (this.process)
      for (const eventName of this.process.eventNames()) this.process.removeAllListeners(eventName);
    this.process?.stdout?.destroy();
    this.process?.stderr?.destroy();
    if (this.process?.exitCode === null) {
      this.process.kill("SIGTERM");
      this.process.kill("SIGKILL");
    }
  }
}

export default class GeneralStartCommand extends InstanceCommand {
  constructor() {
    super("StartCommand");
  }

  async exec(instance: Instance, source = "Unknown") {
    if (
      (!instance.config.startCommand && instance.config.processType === "general") ||
      !instance.config.cwd ||
      !instance.config.ie ||
      !instance.config.oe
    )
      throw new StartupError($t("TXT_CODE_general_start.instanceConfigErr"));
    if (!fs.existsSync(instance.absoluteCwdPath()))
      throw new StartupError($t("TXT_CODE_general_start.cwdPathNotExist"));

    // command parsing
    const commandList = commandStringToArray(instance.config.startCommand);
    const commandExeFile = commandList[0];
    const commandParameters = commandList.slice(1);
    if (commandList.length === 0) {
      throw new StartupError($t("TXT_CODE_general_start.cmdEmpty"));
    }

    logger.info("----------------");
    logger.info($t("TXT_CODE_general_start.startInstance", { source: source }));
    logger.info($t("TXT_CODE_general_start.instanceUuid", { uuid: instance.instanceUuid }));
    logger.info($t("TXT_CODE_general_start.startCmd", { cmdList: JSON.stringify(commandList) }));
    logger.info($t("TXT_CODE_general_start.cwd", { cwd: instance.config.cwd }));
    logger.info("----------------");

    // create child process
    // Parameter 1 directly passes the process name or path (including spaces) without double quotes
    const subProcess = spawn(commandExeFile, commandParameters, {
      cwd: instance.config.cwd,
      stdio: "pipe",
      windowsHide: true,
      env: process.env
    });

    // child process creation result check
    if (!subProcess || !subProcess.pid) {
      instance.println(
        "ERROR",
        $t("TXT_CODE_general_start.pidErr", {
          startCommand: instance.config.startCommand,
          commandExeFile: commandExeFile,
          commandParameters: JSON.stringify(commandParameters)
        })
      );
      throw new StartupError($t("TXT_CODE_general_start.startErr"));
    }

    // create process adapter
    const processAdapter = new ProcessAdapter(subProcess);

    // generate open event
    instance.started(processAdapter);
    logger.info(
      $t("TXT_CODE_general_start.startSuccess", {
        instanceUuid: instance.instanceUuid,
        pid: subProcess.pid
      })
    );
    instance.println("INFO", $t("TXT_CODE_general_start.startOrdinaryTerminal"));
  }
}
