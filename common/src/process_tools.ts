import { ChildProcess, exec, execSync, SpawnOptionsWithoutStdio } from "child_process";
import os from "os";
import child_process from "child_process";
import path from "path";
import EventEmitter from "events";
import iconv from "iconv-lite";

export class StartError extends Error {}

export class ProcessWrapper extends EventEmitter {
  public process?: ChildProcess;
  public pid?: number;

  public errMsg = {
    timeoutErr: "task timeout!",
    exitErr: "task error!",
    startErr: "task start error!"
  };

  constructor(
    public readonly file: string,
    public readonly args: string[],
    public readonly cwd: string,
    public readonly timeout: number = 0,
    public readonly code = "utf-8",
    public readonly option: SpawnOptionsWithoutStdio = {}
  ) {
    super();
  }

  public setErrMsg(errMsg: { timeoutErr: string; exitErr: string; startErr: string }) {
    this.errMsg = errMsg;
  }

  public start(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let timeTask: NodeJS.Timeout;
      const subProcess = child_process.spawn(this.file, this.args, {
        stdio: "pipe",
        windowsHide: true,
        cwd: path.normalize(this.cwd),
        ...this.option
      });
      this.process = subProcess;
      this.pid = subProcess.pid;

      this.emit("start", subProcess.pid);
      if (!subProcess || !subProcess.pid) return reject(new Error(this.errMsg.startErr));

      subProcess.stdout.on("data", (text) => this.emit("data", iconv.decode(text, this.code)));
      subProcess.stderr.on("data", (text) => this.emit("data", iconv.decode(text, this.code)));
      subProcess.on("exit", (code) => {
        try {
          this.emit("exit", code);
          this.destroy();
        } catch (error: any) {}
        if (timeTask) clearTimeout(timeTask);
        if (code !== 0) return reject(new Error(this.errMsg.exitErr));
        return resolve(true);
      });

      // timeout, terminate the task
      if (this.timeout) {
        timeTask = setTimeout(() => {
          if (subProcess?.pid && !subProcess.exitCode && subProcess.exitCode !== 0) {
            killProcess(subProcess.pid, subProcess);
            reject(new Error(this.errMsg.timeoutErr));
          } else {
            reject(new Error(this.errMsg.exitErr));
          }
        }, 1000 * this.timeout);
      }
    });
  }

  public getPid() {
    return this.process?.pid;
  }

  public write(data?: any) {
    return this.process?.stdin?.write(iconv.encode(data, this.code));
  }

  public kill() {
    if (this.process?.pid) killProcess(this.process?.pid, this.process);
  }

  public status() {
    return !!this.process?.exitCode;
  }

  public exitCode() {
    return this.process?.exitCode;
  }

  private async destroy() {
    try {
      for (const n of this.eventNames()) this.removeAllListeners(n);
      if (this.process?.stdout)
        for (const eventName of this.process.stdout.eventNames())
          this.process.stdout.removeAllListeners(eventName);
      if (this.process?.stderr)
        for (const eventName of this.process.stderr.eventNames())
          this.process.stderr.removeAllListeners(eventName);
      if (this.process)
        for (const eventName of this.process.eventNames())
          this.process.removeAllListeners(eventName);
      this.process?.stdout?.destroy();
      this.process?.stderr?.destroy();
      if (this.process?.exitCode === null) {
        this.process.kill("SIGTERM");
        this.process.kill("SIGKILL");
      }
    } catch (error: any) {
      console.log("[ProcessWrapper destroy() Error]", error);
    } finally {
      this.process = undefined;
    }
  }
}

export function killProcess(
  pid: string | number,
  process: { kill(signal?: any): any },
  signal?: any
) {
  try {
    if (os.platform() === "win32") {
      execSync(`taskkill /PID ${pid} /T /F`);
      return true;
    }
    if (os.platform() === "linux") {
      execSync(`kill -s 9 ${pid}`);
      return true;
    }
  } catch (err) {
    return signal ? process.kill(signal) : process.kill("SIGKILL");
  }
  return signal ? process.kill(signal) : process.kill("SIGKILL");
}
