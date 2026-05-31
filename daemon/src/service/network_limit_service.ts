import { exec, execFile } from "child_process";
import Dockerode from "dockerode";
import fs from "fs";
import { promisify } from "util";
import { DefaultDocker } from "./docker_service";
import logger from "./log";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const COMMAND_TIMEOUT_MS = 10000;

async function runCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  return execAsync(command, { timeout: COMMAND_TIMEOUT_MS });
}

async function runFile(
  command: string,
  args: string[] = []
): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync(command, args, { timeout: COMMAND_TIMEOUT_MS });
  return { stdout: String(stdout || ""), stderr: String(stderr || "") };
}

function getErrorText(err: any): string {
  return `${err?.stderr || ""}\n${err?.stdout || ""}\n${err?.message || ""}`;
}

function isPermissionError(err: any): boolean {
  const errorText = getErrorText(err);
  return (
    err?.code === "EACCES" ||
    err?.code === "EPERM" ||
    errorText.includes("Operation not permitted") ||
    errorText.includes("Permission denied") ||
    errorText.includes("RTNETLINK answers: Operation not permitted")
  );
}

function formatCommand(command: string, args: string[] = []): string {
  return [command, ...args].join(" ");
}

async function execWithSudo(
  command: string,
  args: string[] = []
): Promise<{ stdout: string; stderr: string }> {
  try {
    return await runFile(command, args);
  } catch (err: any) {
    if (!isPermissionError(err)) {
      throw err;
    }

    logger.info(
      `Command requires elevated privileges, retrying with sudo: ${formatCommand(command, args)}`
    );
    return await runFile("sudo", ["-n", command, ...args]);
  }
}

async function readFileWithSudo(path: string): Promise<string | null> {
  try {
    return (await fs.promises.readFile(path, "utf8")).trim();
  } catch (err: any) {
    if (err.code !== "EACCES" && err.code !== "EPERM") {
      return null;
    }
    logger.info(`File requires elevated privileges, retrying with sudo: ${path}`);
    try {
      const { stdout } = await runFile("sudo", ["-n", "cat", path]);
      return (stdout || "").trim();
    } catch {
      return null;
    }
  }
}

export interface BandwidthLimit {
  uploadLimit?: number;
  downloadLimit?: number;
}

/** State stored per container for teardown; veth and optional IFB name. */
interface LinuxBandwidthState {
  veth: string;
  ifb?: string;
}

const TBF_BURST = "32kbit";
const TBF_LATENCY = "400ms";

/**
 * Commands required for bandwidth limit. Only tc and ip are strictly required.
 * modprobe is not required: it is used only to load the ifb kernel module (upload limit).
 * Many kernels have ifb built-in or loaded at boot; modprobe comes from the kmod package
 * and may be missing on minimal/container hosts. We try "modprobe ifb" best-effort
 * and rely on "ip link add type ifb" failing with a clear error if ifb is unavailable.
 */
const REQUIRED_COMMANDS = ["tc", "ip"] as const;

/** Linux interface names are limited to 15 chars (IFNAMSIZ). */
function ifbNameForContainer(containerId: string): string {
  const shortId = containerId.replace(/^([a-f0-9]+).*/, "$1").slice(0, 11);
  return `ifb_${shortId}`;
}

export class NetworkLimitService {
  private static instance: NetworkLimitService;
  private docker: Dockerode;
  /** In-memory state: containerId -> { veth, ifb? } for clearBandwidthLimit. */
  private stateByContainer = new Map<string, LinuxBandwidthState>();

  private constructor() {
    this.docker = new DefaultDocker();
  }

  public static getInstance(): NetworkLimitService {
    if (!NetworkLimitService.instance) {
      NetworkLimitService.instance = new NetworkLimitService();
    }
    return NetworkLimitService.instance;
  }

  /**
   * Pre-check required commands (tc, ip). Throws if any are missing.
   * Call before setBandwidthLimit to fail fast with a clear error.
   */
  public async checkRequiredCommands(): Promise<void> {
    const missing = await this.getMissingCommands();
    if (missing.length > 0) {
      throw new Error(
        `Network limit requires the following commands to be installed: ${REQUIRED_COMMANDS.join(", ")}. Missing: ${missing.join(", ")}.`
      );
    }
  }

  /** Start network rate limit for the given container. */
  public async setBandwidthLimit(containerId: string, limit: BandwidthLimit): Promise<void> {
    if (process.platform !== "linux") {
      logger.warn("Network limit is only supported on Linux.");
      return;
    }
    const uploadKbit = limit.uploadLimit && limit.uploadLimit > 0 ? limit.uploadLimit * 8 : 0;
    const downloadKbit =
      limit.downloadLimit && limit.downloadLimit > 0 ? limit.downloadLimit * 8 : 0;
    if (uploadKbit === 0 && downloadKbit === 0) return;

    await this.checkRequiredCommands();

    const info = await this.getContainerNetworkInfo(containerId);
    if (!info) return;
    const { pid, networkMode } = info;
    if (networkMode === "host" || networkMode === "none") {
      logger.info(`Container ${containerId} network mode is ${networkMode}, skip bandwidth limit.`);
      return;
    }

    // Give the container network time to appear on the host (veth may lag after start).
    await new Promise((r) => setTimeout(r, 3000));

    const veth = await this.resolveVethFromPid(containerId, pid);
    if (!veth) {
      logger.error(`Could not resolve veth for container ${containerId}`);
      throw new Error(`Could not resolve veth for container ${containerId}`);
    }

    // Idempotent: clear existing limits then apply new ones.
    const existing = this.stateByContainer.get(containerId);
    if (existing) await this.clearLimitForVeth(existing.veth, existing.ifb).catch(() => {});

    const ifbName = uploadKbit > 0 ? ifbNameForContainer(containerId) : undefined;

    try {
      if (downloadKbit > 0) await this.applyEgressLimit(veth, downloadKbit);
      if (uploadKbit > 0 && ifbName) await this.applyIngressLimit(veth, ifbName, uploadKbit);
      this.stateByContainer.set(containerId, { veth, ifb: ifbName });
    } catch (err) {
      this.stateByContainer.delete(containerId);
      throw err;
    }
  }

  /** Remove network rate limit for the given container. */
  public async clearBandwidthLimit(containerId: string): Promise<void> {
    if (process.platform !== "linux") return;

    let state = this.stateByContainer.get(containerId);
    if (!state) {
      try {
        const info = await this.getContainerNetworkInfo(containerId);
        if (!info || info.networkMode === "host" || info.networkMode === "none") {
          this.stateByContainer.delete(containerId);
          return;
        }
        const veth = await this.resolveVethFromPid(containerId, info.pid);
        if (veth) state = { veth, ifb: ifbNameForContainer(containerId) };
      } catch {
        this.stateByContainer.delete(containerId);
        return;
      }
    }
    if (!state) {
      this.stateByContainer.delete(containerId);
      return;
    }
    await this.clearLimitForVeth(state.veth, state.ifb).catch((e) =>
      logger.warn(`clearLimitForVeth failed for ${containerId}:`, e)
    );
    this.stateByContainer.delete(containerId);
  }

  /** Inspect container; return { pid, networkMode } or null if inspect fails. */
  private async getContainerNetworkInfo(
    containerId: string
  ): Promise<{ pid: number; networkMode: string } | null> {
    try {
      const inspect = await this.inspectContainer(containerId);
      const pid = inspect.State?.Pid ?? 0;
      const networkMode = inspect.HostConfig?.NetworkMode ?? "default";
      const mode = typeof networkMode === "string" ? networkMode : "default";
      return { pid, networkMode: mode };
    } catch (e) {
      logger.warn("getContainerNetworkInfo failed:", e);
      return null;
    }
  }

  /** Resolve host-side veth name from container PID (iflink -> ifindex match on host). */
  private async resolveVethFromPid(containerId: string, pid: number): Promise<string | null> {
    if (!pid) return null;
    const iflink = await this.readContainerIflink(containerId, pid);
    if (iflink === null) return null;

    const ifindex = String(iflink).replace(/[^0-9]/g, "");
    if (!ifindex) return null;

    return this.findVethByIfindex(ifindex);
  }

  /** Read iflink from container: try eth0 first, then first non-lo interface. */
  private async readContainerIflink(containerId: string, pid: number): Promise<string | null> {
    const tryPaths = ["eth0"];
    try {
      const netDir = `/proc/${pid}/root/sys/class/net`;
      try {
        const ifaces = fs.readdirSync(netDir).filter((n) => n !== "lo");
        ifaces.forEach((n) => {
          if (!tryPaths.includes(n)) tryPaths.push(n);
        });
      } catch (err: any) {
        if (err.code !== "EACCES" && err.code !== "EPERM") throw err;
        try {
          const { stdout } = await execWithSudo("ls", ["-1", netDir]);
          if (stdout) {
            const ifaces = stdout.trim().split("\n").filter((n) => n !== "lo");
            ifaces.forEach((n) => {
              if (!tryPaths.includes(n)) tryPaths.push(n);
            });
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    for (const iface of tryPaths) {
      const procPath = `/proc/${pid}/root/sys/class/net/${iface}/iflink`;
      const value = await readFileWithSudo(procPath);
      if (value) return value;
    }
    for (const iface of tryPaths) {
      try {
        const { stdout } = await runFile("docker", [
          "exec",
          containerId,
          "cat",
          `/sys/class/net/${iface}/iflink`
        ]);
        const value = (stdout || "").trim().replace(/\r/g, "");
        if (value) return value;
      } catch (err: any) {
        if (err?.code === "ENOENT") {
          logger.warn(
            `Could not read iflink for container ${containerId}: docker binary is unavailable`
          );
          break;
        }
        // continue
      }
    }
    logger.warn(
      `Could not read iflink for container ${containerId} (tried: ${tryPaths.join(", ")})`
    );
    return null;
  }

  /** Find host interface name by ifindex using ip -o link (avoids shell escaping). */
  private async findVethByIfindex(ifindex: string): Promise<string | null> {
    try {
      const { stdout } = await execWithSudo("ip", ["-o", "link", "show"]);
      const lines = (stdout || "").trim().split("\n");
      for (const line of lines) {
        const match = line.match(/^\s*(\d+)\s*:\s*(\S+)\s*:/);
        if (match && match[1] === ifindex) {
          const name = match[2].split("@")[0].trim();
          return name || null;
        }
      }
    } catch {
      return this.findVethByIfindexFromSysfs(ifindex);
    }
    return this.findVethByIfindexFromSysfs(ifindex);
  }

  /** Apply egress TBF on veth (limits download: host -> container). */
  private async applyEgressLimit(veth: string, rateKbit: number): Promise<void> {
    const rate = `${rateKbit}kbit`;
    await execWithSudo("tc", [
      "qdisc",
      "replace",
      "dev",
      veth,
      "root",
      "tbf",
      "rate",
      rate,
      "burst",
      TBF_BURST,
      "latency",
      TBF_LATENCY
    ]);
  }

  /** Apply ingress limit via IFB (limits upload: container -> host). */
  private async applyIngressLimit(veth: string, ifbName: string, rateKbit: number): Promise<void> {
    const rate = `${rateKbit}kbit`;
    await execWithSudo("modprobe", ["ifb"]).catch((err) => {
      const errorText = getErrorText(err).trim();
      logger.info(
        `Best-effort modprobe ifb failed before ingress setup; continuing. ` +
          `veth=${veth}, ifb=${ifbName}, error=${errorText}`
      );
    });
    await execWithSudo("ip", ["link", "add", "name", ifbName, "type", "ifb"]).catch((err) => {
      if (!this.isAlreadyExistsError(err)) throw err;
    });
    await execWithSudo("ip", ["link", "set", "dev", ifbName, "up"]);
    await execWithSudo("tc", ["qdisc", "replace", "dev", veth, "ingress"]);
    await execWithSudo("tc", [
      "filter",
      "add",
      "dev",
      veth,
      "parent",
      "ffff:",
      "protocol",
      "all",
      "u32",
      "match",
      "u32",
      "0",
      "0",
      "action",
      "mirred",
      "egress",
      "redirect",
      "dev",
      ifbName
    ]);
    await execWithSudo("tc", [
      "qdisc",
      "replace",
      "dev",
      ifbName,
      "root",
      "tbf",
      "rate",
      rate,
      "burst",
      TBF_BURST,
      "latency",
      TBF_LATENCY
    ]);
  }

  /** Remove tc qdiscs and IFB for the given veth (and optional ifb). */
  private async clearLimitForVeth(veth: string, ifbName?: string): Promise<void> {
    await execWithSudo("tc", ["qdisc", "del", "dev", veth, "root"]).catch((err) => {
      if (!this.isIgnorableDeleteError(err)) throw err;
    });
    await execWithSudo("tc", ["qdisc", "del", "dev", veth, "ingress"]).catch((err) => {
      if (!this.isIgnorableDeleteError(err)) throw err;
    });
    if (ifbName) {
      await execWithSudo("tc", ["qdisc", "del", "dev", ifbName, "root"]).catch((err) => {
        if (!this.isIgnorableDeleteError(err)) throw err;
      });
      await execWithSudo("ip", ["link", "del", ifbName]).catch((err) => {
        if (!this.isIgnorableDeleteError(err)) throw err;
      });
    }
  }

  /** Returns list of required commands that are not available on PATH. */
  private async getMissingCommands(): Promise<string[]> {
    const missing: string[] = [];
    for (const cmd of REQUIRED_COMMANDS) {
      try {
        await runCommand(`command -v ${cmd}`);
      } catch {
        missing.push(cmd);
      }
    }
    return missing;
  }

  private findVethByIfindexFromSysfs(ifindex: string): string | null {
    try {
      const names = fs.readdirSync("/sys/class/net");
      for (const name of names) {
        try {
          const value = fs.readFileSync(`/sys/class/net/${name}/ifindex`, "utf8").trim();
          if (value === ifindex) return name;
        } catch {
          // continue
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  private isAlreadyExistsError(err: any): boolean {
    const text = getErrorText(err);
    return text.includes("File exists") || text.includes("already exists");
  }

  private isIgnorableDeleteError(err: any): boolean {
    const text = getErrorText(err);
    return (
      text.includes("No such file or directory") ||
      text.includes("Cannot find device") ||
      text.includes("Invalid argument") ||
      text.includes("No such process")
    );
  }

  private async inspectContainer(containerId: string) {
    return this.docker.getContainer(containerId).inspect();
  }
}
