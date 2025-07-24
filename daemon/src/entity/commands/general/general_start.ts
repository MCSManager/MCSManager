import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import logger from "../../../service/log";
import fs from "fs-extra";
import EventEmitter from "events";
import { IInstanceProcess } from "../../instance/interface";
import { ChildProcess, spawn } from "child_process";
import { commandStringToArray } from "../base/command_parser";
import { killProcess } from "mcsmanager-common";
import AbsStartCommand from "../start";
import os from "os";

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

export default class GeneralStartCommand extends AbsStartCommand {
  async createProcess(instance: Instance, source = "") {
    if (
      (!instance.config.startCommand && instance.config.processType === "general") ||
      !instance.hasCwdPath() ||
      !instance.config.ie ||
      !instance.config.oe ||
      !instance.config.runAs
    )
      throw new StartupError($t("TXT_CODE_general_start.instanceConfigErr"));
    if (!fs.existsSync(instance.absoluteCwdPath())) fs.mkdirpSync(instance.absoluteCwdPath());

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
    logger.info($t("TXT_CODE_general_start.cwd", { cwd: instance.absoluteCwdPath() }));
    logger.info($t("TXT_CODE_general_start.runAs", { user: instance.config.runAs }));
    logger.info("----------------");

    // Get user info for the target user
    let uid: number | undefined;
    let gid: number | undefined;
    
    try {
      if (process.platform !== 'win32' && instance.config.runAs) {
        // Use child_process to execute 'id -u' and 'id -g' for the target user
        const { execSync } = require('child_process');
        uid = parseInt(execSync(`id -u ${instance.config.runAs}`).toString().trim());
        gid = parseInt(execSync(`id -g ${instance.config.runAs}`).toString().trim());
        
        // Also ensure the working directory has correct permissions
        fs.chownSync(instance.absoluteCwdPath(), uid, gid);
      }
    } catch (e) {
      throw new StartupError($t("TXT_CODE_general_start.userNotFound", { 
        user: instance.config.runAs,
        error: e
      }));
    }
    // create child process
    const subProcess = spawn(commandExeFile, commandParameters, {
      cwd: instance.absoluteCwdPath(),
      stdio: "pipe",
      windowsHide: true,
      env: {
        ...process.env,
        // Set important environment variables for the target user
        USER: instance.config.runAs,
        HOME: `/home/${instance.config.runAs}`,
        LOGNAME: instance.config.runAs
      },
      ...(process.platform !== 'win32' && uid && gid ? {
        uid,
        gid,
        // Ensure we don't inherit root privileges
        detached: true
      } : {})
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
        pid: subProcess.pid,
        user: instance.config.runAs,
        uid,
        gid
      })
    );
    instance.println("INFO", $t("TXT_CODE_general_start.startOrdinaryTerminal"));
  }
}

