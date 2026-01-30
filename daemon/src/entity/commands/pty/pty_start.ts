import { ChildProcess, ChildProcessWithoutNullStreams, spawn } from "child_process";
import EventEmitter from "events";
import fs from "fs-extra";
import { killProcess } from "mcsmanager-common";
import os from "os";
import path from "path";
import readline from "readline";
import { Writable } from "stream";
import { v4 } from "uuid";
import { PTY_PATH } from "../../../const";
import { $t } from "../../../i18n";
import logger from "../../../service/log";
import { getRunAsUserParams } from "../../../tools/system_user";
import Instance from "../../instance/instance";
import { IInstanceProcess } from "../../instance/interface";
import { commandStringToArray } from "../base/command_parser";
import FunctionDispatcher from "../dispatcher";
import AbsStartCommand from "../start";

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

  constructor(
    private readonly process: ChildProcess,
    public readonly pid: number,
    public readonly pipeName: string
  ) {
    super();
    process.stdout?.on("data", (text) => this.emit("data", text));
    process.stderr?.on("data", (text) => this.emit("data", text));
    process.on("exit", (code) => this.emit("exit", code));
    setTimeout(() => {
      this.initNamedPipe();
    }, 1000);
  }

  private async initNamedPipe() {
    try {
      const fd = await fs.open(this.pipeName, "w");
      const writePipe = fs.createWriteStream("", { fd });
      writePipe.on("close", () => {});
      writePipe.on("end", () => {});
      writePipe.on("error", (err) => {
        logger.error("Pipe error:", this.pipeName, err);
      });
      this.pipeClient = writePipe;
    } catch (error) {
      logger.warn("Start PTY Pipe error, This maybe is not a bug:", this.pipeName, error);
    }
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

export default class PtyStartCommand extends AbsStartCommand {
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

  async createProcess(instance: Instance) {
    if (!instance.config.ie || !instance.config.oe) {
      instance.config.ie = "utf-8";
      instance.config.oe = "utf-8";
    }
    if (!instance.config.startCommand || !instance.hasCwdPath())
      throw new StartupError($t("TXT_CODE_pty_start.cmdErr"));
    if (!fs.existsSync(instance.absoluteCwdPath())) fs.mkdirpSync(instance.absoluteCwdPath());
    if (!path.isAbsolute(path.normalize(instance.absoluteCwdPath())))
      throw new StartupError($t("TXT_CODE_pty_start.mustAbsolutePath"));

    // PTY mode correctness check
    logger.info($t("TXT_CODE_pty_start.startPty", { source: "" }));
    let checkPtyEnv = true;

    if (!fs.existsSync(PTY_PATH)) {
      instance.println("ERROR", $t("TXT_CODE_pty_start.startErr"));
      checkPtyEnv = false;
    }

    if (checkPtyEnv === false) {
      instance.config.terminalOption.pty = false;
      await instance.forceExec(new FunctionDispatcher());
      await instance.execPreset("start");
      return;
    }

    // command parsing
    let commandList: string[] = [];
    const tmpStarCmd = await instance.parseTextParams(instance.config.startCommand);
    if (os.platform() === "win32") {
      // windows: cmd.exe /c {{startCommand}}
      commandList = [tmpStarCmd];
    } else {
      // other
      commandList = commandStringToArray(tmpStarCmd);
    }

    if (commandList.length === 0)
      return instance.failure(new StartupError($t("TXT_CODE_pty_start.cmdEmpty")));

    const pipeId = v4();
    const pipeLinuxDir = "/tmp/mcsmanager-instance-pipe";
    if (!fs.existsSync(pipeLinuxDir)) fs.mkdirsSync(pipeLinuxDir);
    let pipeName = `${pipeLinuxDir}/pipe-${pipeId}`;
    if (os.platform() === "win32") {
      pipeName = `\\\\.\\pipe\\mcsmanager-${pipeId}`;
    }

    const runAsConfig = await getRunAsUserParams(instance);

    // Prepare PTY parameters
    const ptyParameter = [
      "-size",
      `${instance.config.terminalOption.ptyWindowCol},${instance.config.terminalOption.ptyWindowRow}`,
      "-coder",
      instance.config.oe,
      "-dir",
      instance.absoluteCwdPath(),
      "-fifo",
      pipeName,
      "-cmd",
      JSON.stringify(commandList)
    ];

    logger.info("----------------");
    logger.info($t("TXT_CODE_pty_start.sourceRequest", { source: "" }));
    logger.info($t("TXT_CODE_pty_start.instanceUuid", { instanceUuid: instance.instanceUuid }));
    logger.info($t("TXT_CODE_pty_start.startCmd", { cmd: commandList.join(" ") }));
    logger.info($t("TXT_CODE_pty_start.ptyPath", { path: PTY_PATH }));
    logger.info($t("TXT_CODE_pty_start.ptyParams", { param: ptyParameter.join(" ") }));
    logger.info($t("TXT_CODE_pty_start.ptyCwd", { cwd: instance.absoluteCwdPath() }));
    logger.info($t("TXT_CODE_general_start.runAs", { user: runAsConfig.runAsName }));
    logger.info("----------------");

    if (runAsConfig.isEnableRunAs) {
      instance.println("INFO", $t("TXT_CODE_ba09da46", { name: runAsConfig.runAsName }));
    }

    instance.println("INFO", "> " + commandList.join(" "));

    // create pty child process
    const subProcess = spawn(PTY_PATH, ptyParameter, {
      ...runAsConfig,
      cwd: path.dirname(PTY_PATH),
      stdio: "pipe",
      windowsHide: true,
      env: instance.generateEnv(),
      // Do not detach the child process;
      // otherwise, an abnormal exit of the parent process may cause the child process to continue running,
      // leading to an abnormal instance state.
      detached: false
    });

    // pty child process creation result check
    if (!subProcess || !subProcess.pid) {
      instance.println(
        "ERROR",
        $t("TXT_CODE_pty_start.pidErr", {
          startCommand: commandList.join(" "),
          path: PTY_PATH,
          params: JSON.stringify(ptyParameter)
        })
      );
      throw new StartupError($t("TXT_CODE_pty_start.instanceStartErr"));
    }

    // create process adapter
    const ptySubProcessCfg = await this.readPtySubProcessConfig(subProcess);
    const processAdapter = new GoPtyProcessAdapter(subProcess, ptySubProcessCfg.pid, pipeName);

    if (subProcess.exitCode !== null || processAdapter.pid == null || processAdapter.pid === 0) {
      instance.println(
        "ERROR",
        $t("TXT_CODE_pty_start.pidErr", {
          startCommand: commandList.join(" "),
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
    instance.println("INFO", $t("TXT_CODE_b50ffba8"));
  }
}
