import { exec } from "child_process";
import Dockerode from "dockerode";
import fs from "fs";
import { promisify } from "util";
import { DefaultDocker } from "./docker_service";
import logger from "./log";

const execAsync = promisify(exec);

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
 * and may be missing on minimal/container hosts. We run "modprobe ifb 2>/dev/null || true"
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
      if (fs.existsSync(netDir)) {
        const ifaces = fs.readdirSync(netDir).filter((n) => n !== "lo");
        ifaces.forEach((n) => {
          if (!tryPaths.includes(n)) tryPaths.push(n);
        });
      }
    } catch {
      // ignore
    }
    for (const iface of tryPaths) {
      const procPath = `/proc/${pid}/root/sys/class/net/${iface}/iflink`;
      try {
        const value = fs.readFileSync(procPath, "utf8").trim();
        if (value) return value;
      } catch {
        // continue
      }
    }
    for (const iface of tryPaths) {
      try {
        const { stdout } = await execAsync(
          `docker exec ${this.escapeShell(containerId)} cat /sys/class/net/${this.escapeShell(
            iface
          )}/iflink 2>/dev/null`
        );
        const value = (stdout || "").trim().replace(/\r/g, "");
        if (value) return value;
      } catch {
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
      const { stdout } = await execAsync("ip -o link show");
      const lines = (stdout || "").trim().split("\n");
      for (const line of lines) {
        const match = line.match(/^\s*(\d+)\s*:\s*(\S+)\s*:/);
        if (match && match[1] === ifindex) {
          const name = match[2].split("@")[0].trim();
          return name || null;
        }
      }
    } catch {
      // fallback: grep + sed on host
      try {
        const { stdout } = await execAsync(
          `sh -c 'F=$(grep -l "^${ifindex}$" /sys/class/net/*/ifindex 2>/dev/null | head -1) && [ -n "$F" ] && basename $(dirname "$F")'`
        );
        const veth = (stdout || "").trim();
        return veth || null;
      } catch {
        // ignore
      }
    }
    return null;
  }

  /** Apply egress TBF on veth (limits download: host -> container). */
  private async applyEgressLimit(veth: string, rateKbit: number): Promise<void> {
    const rate = `${rateKbit}kbit`;
    await execAsync(
      `tc qdisc replace dev ${this.escapeShell(
        veth
      )} root tbf rate ${rate} burst ${TBF_BURST} latency ${TBF_LATENCY}`
    );
  }

  /** Apply ingress limit via IFB (limits upload: container -> host). */
  private async applyIngressLimit(veth: string, ifbName: string, rateKbit: number): Promise<void> {
    const rate = `${rateKbit}kbit`;
    await execAsync("modprobe ifb 2>/dev/null || true");
    await execAsync(`ip link add name ${this.escapeShell(ifbName)} type ifb 2>/dev/null || true`);
    await execAsync(`ip link set dev ${this.escapeShell(ifbName)} up`);
    await execAsync(`tc qdisc replace dev ${this.escapeShell(veth)} ingress`);
    await execAsync(
      `tc filter add dev ${this.escapeShell(
        veth
      )} parent ffff: protocol all u32 match u32 0 0 action mirred egress redirect dev ${this.escapeShell(
        ifbName
      )}`
    );
    await execAsync(
      `tc qdisc replace dev ${this.escapeShell(
        ifbName
      )} root tbf rate ${rate} burst ${TBF_BURST} latency ${TBF_LATENCY}`
    );
  }

  /** Remove tc qdiscs and IFB for the given veth (and optional ifb). */
  private async clearLimitForVeth(veth: string, ifbName?: string): Promise<void> {
    await execAsync(`tc qdisc del dev ${this.escapeShell(veth)} root 2>/dev/null || true`);
    await execAsync(`tc qdisc del dev ${this.escapeShell(veth)} ingress 2>/dev/null || true`);
    if (ifbName) {
      await execAsync(`tc qdisc del dev ${this.escapeShell(ifbName)} root 2>/dev/null || true`);
      await execAsync(`ip link del ${this.escapeShell(ifbName)} 2>/dev/null || true`);
    }
  }

  /** Returns list of required commands that are not available on PATH. */
  private async getMissingCommands(): Promise<string[]> {
    const missing: string[] = [];
    for (const cmd of REQUIRED_COMMANDS) {
      try {
        await execAsync(`command -v ${this.escapeShell(cmd)}`);
      } catch {
        missing.push(cmd);
      }
    }
    return missing;
  }

  private escapeShell(s: string): string {
    return `'${String(s).replace(/'/g, "'\"'\"'")}'`;
  }

  private async inspectContainer(containerId: string) {
    return this.docker.getContainer(containerId).inspect();
  }
}
