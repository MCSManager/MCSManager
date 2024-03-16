import { $t } from "../../../i18n";
import os from "os";
import Instance from "../../instance/instance";
import logger from "../../../service/log";
import fs from "fs-extra";
import path from "path";
import readline from "readline";
import InstanceCommand from "../base/command";
import EventEmitter from "events";
import { IInstanceProcess } from "../../instance/interface";
import { ChildProcess, ChildProcessWithoutNullStreams, exec, spawn } from "child_process";
import { commandStringToArray } from "../base/command_parser";
import { killProcess } from "common";
import FunctionDispatcher from "../dispatcher";
import { PTY_PATH } from "../../../const";
import { Writable } from "stream";

interface IPtySubProcessCfg {
  pid: number;
}

// Error exception at startup
class StartupError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

const GO_PTY_MSG_TYPE = {
  RESIZE: 0x04
};

// process adapter
export class GoPtyProcessAdapter extends EventEmitter implements IInstanceProcess {
  private pipeClient?: Writable;

  constructor(private process: ChildProcess, public pid: number, public pipeName: string) {
    super();
    process.stdout?.on("data", (text) => this.emit("data", text));
    process.stderr?.on("data", (text) => this.emit("data", text));
    process.on("exit", (code) => this.emit("exit", code));
    try {
      this.initNamedPipe();
    } catch (error: any) {
      logger.error(`Init Pipe Err: ${pipeName}, ${error}`);
    }
  }

  private initNamedPipe() {
    const fd = fs.openSync(this.pipeName, "w");
    const writePipe = fs.createWriteStream("", { fd });
    writePipe.on("close", () => {});
    writePipe.on("end", () => {});
    writePipe.on("error", (err) => {
      logger.error("Pipe error:", this.pipeName, err);
    });
    this.pipeClient = writePipe;
  }

  public resize(w: number, h: number) {
    const MAX_W = 900;
    if (w > MAX_W) w = MAX_W;
    if (h > MAX_W) h = MAX_W;
    const resizeStruct = JSON.stringify({ width: Number(w), height: Number(h) });
    const len = resizeStruct.length;
    const lenBuff = Buffer.alloc(2);
    lenBuff.writeInt16BE(len, 0);
    const buf = Buffer.from([GO_PTY_MSG_TYPE.RESIZE, ...lenBuff, ...Buffer.from(resizeStruct)]);
    this.writeToNamedPipe(buf);
  }

  public writeToNamedPipe(data: Buffer) {
    this.pipeClient?.write(data);
  }

  public write(data?: string) {
    return this.process.stdin?.write(data);
  }

  public kill(s?: any) {
    return killProcess(this.pid, this.process, s);
  }

  public async destroy() {
    for (const n of this.eventNames()) this.removeAllListeners(n);
    if (this.process.stdout)
      for (const eventName of this.process.stdout.eventNames())
        this.process.stdout.removeAllListeners(eventName);
    if (this.process.stderr)
      for (const eventName of this.process.stderr.eventNames())
        this.process.stderr.removeAllListeners(eventName);
    if (this.process)
      for (const eventName of this.process.eventNames())
        this.process.stdout?.removeAllListeners(eventName);
    if (this.pipeClient)
      for (const eventName of this.pipeClient.eventNames())
        this.pipeClient.removeAllListeners(eventName);
    this.pipeClient?.destroy();
    this.process?.stdout?.destroy();
    this.process?.stderr?.destroy();
    if (this.process?.exitCode === null) {
      this.process.kill("SIGTERM");
      this.process.kill("SIGKILL");
    }
    fs.remove(this.pipeName, (err) => {});
  }
}

export default class PtyStartCommand extends InstanceCommand {
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
        } catch (error: any) {
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
    let checkPtyEnv = true;

    if (!fs.existsSync(PTY_PATH)) {
      instance.println("ERROR", $t("TXT_CODE_pty_start.startErr"));
      checkPtyEnv = false;
    }

    if (checkPtyEnv === false) {
      // Close the PTY type, reconfigure the instance function group, and restart the instance
      instance.config.terminalOption.pty = false;
      await instance.forceExec(new FunctionDispatcher());
      await instance.execPreset("start", source); // execute the preset command directly
      return;
    }

    // Set the startup state & increase the number of startups
    instance.setLock(true);
    instance.status(Instance.STATUS_STARTING);
    instance.startCount++;

    // command parsing
    let commandList: string[] = [];
    if (os.platform() === "win32") {
      // windows: cmd.exe  /c {{startCommand}}
      commandList = [instance.config.startCommand];
    } else {
      commandList = commandStringToArray(instance.config.startCommand);
    }

    if (commandList.length === 0)
      return instance.failure(new StartupError($t("TXT_CODE_pty_start.cmdEmpty")));

    const pipeLinuxDir = "/tmp/mcsmanager-instance-pipe";
    if (!fs.existsSync(pipeLinuxDir)) fs.mkdirsSync(pipeLinuxDir);
    let pipeName = `${pipeLinuxDir}/pipe-${instance.instanceUuid}`;
    if (os.platform() === "win32") {
      pipeName = `\\\\.\\pipe\\mcsmanager-${instance.instanceUuid}`;
    }

    const ptyParameter = [
      "-size",
      `${instance.config.terminalOption.ptyWindowCol},${instance.config.terminalOption.ptyWindowRow}`,
      "-coder",
      instance.config.oe,
      "-dir",
      instance.config.cwd,
      "-fifo",
      pipeName,
      "-cmd",
      JSON.stringify(commandList)
    ];

    logger.info("----------------");
    logger.info($t("TXT_CODE_pty_start.sourceRequest", { source: source }));
    logger.info($t("TXT_CODE_pty_start.instanceUuid", { instanceUuid: instance.instanceUuid }));
    logger.info($t("TXT_CODE_pty_start.startCmd", { cmd: commandList.join(" ") }));
    logger.info($t("TXT_CODE_pty_start.ptyPath", { path: PTY_PATH }));
    logger.info($t("TXT_CODE_pty_start.ptyParams", { param: ptyParameter.join(" ") }));
    logger.info($t("TXT_CODE_pty_start.ptyCwd", { cwd: instance.config.cwd }));
    logger.info("----------------");

    // create pty child process
    // Parameter 1 directly passes the process name or path (including spaces) without double quotes
    const subProcess = spawn(PTY_PATH, ptyParameter, {
      cwd: path.dirname(PTY_PATH),
      stdio: "pipe",
      windowsHide: true,
      env: {
        ...process.env,
        TERM: "xterm-256color"
      }
    });

    // pty child process creation result check
    if (!subProcess || !subProcess.pid) {
      instance.println(
        "ERROR",
        $t("TXT_CODE_pty_start.pidErr", {
          startCommand: instance.config.startCommand,
          path: PTY_PATH,
          params: JSON.stringify(ptyParameter)
        })
      );
      throw new StartupError($t("TXT_CODE_pty_start.instanceStartErr"));
    }

    // create process adapter
    const ptySubProcessCfg = await this.readPtySubProcessConfig(subProcess);
    const processAdapter = new GoPtyProcessAdapter(subProcess, ptySubProcessCfg.pid, pipeName);
    logger.info(`pty.exe response: ${JSON.stringify(ptySubProcessCfg)}`);

    // After reading the configuration, Need to check the process status
    // The "processAdapter.pid" here represents the process created by the PTY process
    if (subProcess.exitCode !== null || processAdapter.pid == null || processAdapter.pid === 0) {
      instance.println(
        "ERROR",
        $t("TXT_CODE_pty_start.pidErr", {
          startCommand: instance.config.startCommand,
          path: PTY_PATH,
          params: JSON.stringify(ptyParameter)
        })
      );
      throw new StartupError($t("TXT_CODE_pty_start.instanceStartErr"));
    }

    // generate open event
    instance.started(processAdapter);

    logger.info(
      $t("TXT_CODE_pty_start.startSuccess", {
        instanceUuid: instance.instanceUuid,
        pid: ptySubProcessCfg.pid
      })
    );
    instance.println("INFO", $t("TXT_CODE_pty_start.startEmulatedTerminal"));
  }
}
