import { $t } from "../../../i18n";
import os from "os";
import Instance from "../../instance/instance";
import logger from "../../../service/log";
import fs from "fs-extra";
import path from "path";
import readline from "readline";
import InstanceCommand from "../base/command";
import { ChildProcess, ChildProcessWithoutNullStreams, spawn } from "child_process";
import { commandStringToArray } from "../base/command_parser";
import FunctionDispatcher from "../dispatcher";
import type { IPty, spawn as spawnType } from "node-pty";
import { killProcess } from "common";
import { EventEmitter } from "koa";
import { IInstanceProcess } from "../../instance/interface";
interface IPtySubProcessCfg {
  pid: number;
}

// Error exception at startup
class StartupError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

// process adapter
class ProcessAdapter extends EventEmitter implements IInstanceProcess {
  public pid?: number;
  public exitCode: number;

  constructor(private process: IPty) {
    super();
    this.pid = this.process.pid;
    this.process.onData((data: string | Buffer) => this.emit("data", data));
    this.process.onExit((info) => {
      this.exitCode = info.exitCode;
      this.emit("exit", info.exitCode);
    });
  }

  public write(data?: string) {
    return this.process.write(data);
  }

  public kill(s?: any) {
    return killProcess(this.pid, this.process);
  }

  public async destroy() {
    try {
      // remove all dynamically added event listeners
      for (const n of this.eventNames()) this.removeAllListeners(n);
      if (this.exitCode) {
        this.kill();
      }
    } catch (error) {}
  }
}

export default class NodePtyStartCommand extends InstanceCommand {
  constructor() {
    super("PtyStartCommand");
  }

  readPtySubProcessConfig(subProcess: ChildProcessWithoutNullStreams): Promise<IPtySubProcessCfg> {
    return new Promise((r, j) => {
      const errConfig = {
        pid: 0
      };
      const rl = readline.createInterface({
        input: subProcess.stdout,
        crlfDelay: Infinity
      });
      rl.on("line", (line = "") => {
        try {
          rl.removeAllListeners();
          const cfg = JSON.parse(line) as IPtySubProcessCfg;
          if (cfg.pid == null) throw new Error("Error");
          r(cfg);
        } catch (error) {
          r(errConfig);
        }
      });
      setTimeout(() => {
        r(errConfig);
      }, 1000 * 3);
    });
  }

  async exec(instance: Instance, source = "Unknown") {
    if (
      !instance.config.startCommand ||
      !instance.config.cwd ||
      !instance.config.ie ||
      !instance.config.oe
    )
      throw new StartupError($t("TXT_CODE_pty_start.cmdErr"));
    if (!fs.existsSync(instance.absoluteCwdPath()))
      throw new StartupError($t("TXT_CODE_pty_start.cwdNotExist"));
    if (!path.isAbsolute(path.normalize(instance.config.cwd)))
      throw new StartupError($t("TXT_CODE_pty_start.mustAbsolutePath"));

    // PTY mode correctness check
    logger.info($t("TXT_CODE_pty_start.startPty", { source: source }));

    try {
      require.resolve("node-pty");
    } catch (e) {
      // node-pty not available
      instance.println("ERROR", $t("TXT_CODE_pty_start.startErr"));
      instance.config.terminalOption.pty = false;
      await instance.forceExec(new FunctionDispatcher());
      await instance.execPreset("start", source);
      return;
    }

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

    const { spawn } = require("node-pty") as {
      spawn: typeof spawnType;
    };

    logger.info($t("模式：仿真终端（node-pty）"));

    const ptyProcess = spawn(commandExeFile, commandParameters, {
      name: "xterm-256color",
      cols: 170,
      rows: 40,
      cwd: instance.config.cwd,
      env: { ...process.env, TERM: "xterm-256color" },
      encoding: null
    });

    if (!ptyProcess.pid) {
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

    const processAdapter = new ProcessAdapter(ptyProcess);
    instance.started(processAdapter);
    logger.info(
      $t("TXT_CODE_pty_start.startSuccess", {
        instanceUuid: instance.instanceUuid,
        pid: processAdapter.pid
      })
    );
    instance.println("INFO", $t("TXT_CODE_pty_start.startEmulatedTerminal"));
  }
}
