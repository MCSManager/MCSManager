import { exec } from "child_process";
import { promisify } from "util";
import Dockerode from "dockerode";
import logger from "./log";
import { DefaultDocker } from "./docker_service";

const execAsync = promisify(exec);

export interface BandwidthLimit {
  uploadLimit?: number;
  downloadLimit?: number;
}

export interface ContainerNetworkStats {
  rxBytes?: number;
  txBytes?: number;
  interfaceNames?: string[];
  source?: "namespace" | "docker";
}

interface LinuxBandwidthState {
  pid: number;
  interfaceName: string;
  uploadApplied: boolean;
  downloadApplied: boolean;
}

export class NetworkLimitService {
  private static readonly STATS_WARNED_CONTAINERS_LIMIT = 512;
  private static instance: NetworkLimitService;
  private docker: Dockerode;
  private activeLimits: Map<string, BandwidthLimit> = new Map();
  private activeStates: Map<string, LinuxBandwidthState> = new Map();
  private linuxEnvironmentReady = false;
  private linuxEnvironmentUnsupportedReason?: string;
  private linuxEnvironmentWarningEmitted = false;
  private statsWarnedContainers = new Set<string>();
  private statsWarnedOrder: string[] = [];

  private constructor() {
    this.docker = new DefaultDocker();
  }

  public static getInstance(): NetworkLimitService {
    if (!NetworkLimitService.instance) {
      NetworkLimitService.instance = new NetworkLimitService();
    }
    return NetworkLimitService.instance;
  }

  public async setBandwidthLimit(containerId: string, limit: BandwidthLimit): Promise<void> {
    const normalizedLimit = {
      uploadLimit: this.normalizeLimit(limit.uploadLimit),
      downloadLimit: this.normalizeLimit(limit.downloadLimit)
    };

    await this.ensureLinuxEnvironment();
    await this.clearBandwidthLimit(containerId);

    if (!normalizedLimit.uploadLimit && !normalizedLimit.downloadLimit) {
      return;
    }

    const inspect = await this.inspectContainer(containerId);
    const networkMode = this.getNetworkMode(inspect);
    this.ensureSupportedNetworkMode(networkMode);
    const pid = await this.resolveContainerPid(containerId, inspect);
    const interfaceName = await this.resolveContainerInterfaceName(pid);

    const state: LinuxBandwidthState = {
      pid,
      interfaceName,
      uploadApplied: false,
      downloadApplied: false
    };

    try {
      if (normalizedLimit.downloadLimit) {
        await this.applyDownloadLimit(pid, interfaceName, normalizedLimit.downloadLimit);
        state.downloadApplied = true;
        await this.verifyDownloadLimit(pid, interfaceName);
      }

      if (normalizedLimit.uploadLimit) {
        await this.applyUploadLimit(pid, interfaceName, normalizedLimit.uploadLimit);
        state.uploadApplied = true;
        await this.verifyUploadLimit(pid, interfaceName);
      }

      this.activeLimits.set(containerId, normalizedLimit);
      this.activeStates.set(containerId, state);
      logger.info(
        `[NetworkLimitService] Applied Linux tc limits for ${containerId} on ${interfaceName} ` +
          `(upload=${normalizedLimit.uploadLimit ?? 0}KB/s, download=${normalizedLimit.downloadLimit ?? 0}KB/s)`
      );
    } catch (error) {
      await Promise.all(
        [
          state.downloadApplied
            ? this.deleteQdisc(state.pid, state.interfaceName, "ingress")
            : Promise.resolve(),
          state.uploadApplied
            ? this.deleteQdisc(state.pid, state.interfaceName, "root")
            : Promise.resolve()
        ].map((task) => task.catch(() => undefined))
      );
      throw new Error(
        `[NetworkLimitService] Failed to apply Linux tc limits for ${containerId} on ${interfaceName}: ${this.getErrorMessage(
          error
        )}`
      );
    }
  }

  public async clearBandwidthLimit(containerId: string): Promise<void> {
    const state = this.activeStates.get(containerId);
    if (!state) {
      this.activeLimits.delete(containerId);
      this.clearStatsWarning(containerId);
      return;
    }

    const cleanupTasks: Promise<void>[] = [];
    if (state.downloadApplied) {
      cleanupTasks.push(this.deleteQdisc(state.pid, state.interfaceName, "ingress"));
    }
    if (state.uploadApplied) {
      cleanupTasks.push(this.deleteQdisc(state.pid, state.interfaceName, "root"));
    }

    await Promise.all(cleanupTasks.map((task) => task.catch(() => undefined)));
    this.activeStates.delete(containerId);
    this.activeLimits.delete(containerId);
    this.clearStatsWarning(containerId);
  }

  public getBandwidthLimit(containerId: string): BandwidthLimit | undefined {
    return this.activeLimits.get(containerId);
  }

  public async getContainerNetworkStats(containerId: string): Promise<ContainerNetworkStats | null> {
    const linuxSupported = await this.isLinuxEnvironmentSupported();
    if (!linuxSupported) {
      return null;
    }

    let pid: number | undefined;
    let interfaceNames: string[] = [];

    try {
      const state = this.activeStates.get(containerId);
      pid = state?.pid;

      if (!pid) {
        const inspect = await this.inspectContainer(containerId);
        const networkMode = this.getNetworkMode(inspect);
        if (networkMode === "none") return null;
        this.ensureSupportedNetworkMode(networkMode);
        pid = this.ensureContainerPid(inspect.State?.Pid);
      }

      interfaceNames = await this.resolveContainerInterfaceNames(pid);
      if (!interfaceNames.length) {
        throw new Error(`Unable to resolve container network interfaces for PID ${pid}`);
      }

      if (this.looksLikeHostNamespaceInterfaces(interfaceNames)) {
        throw new Error(
          `Detected host-like interfaces in namespace stats: ${interfaceNames.join(",")}`
        );
      }

      let rxBytes = 0;
      let txBytes = 0;
      for (const interfaceName of interfaceNames) {
        rxBytes += await this.readInterfaceCounter(pid, interfaceName, "rx_bytes");
        txBytes += await this.readInterfaceCounter(pid, interfaceName, "tx_bytes");
      }

      return {
        rxBytes,
        txBytes,
        interfaceNames,
        source: "namespace"
      };
    } catch (error) {
      if (this.markStatsWarning(containerId)) {
        logger.warn(
          `[NetworkLimitService] Failed to read container network counters for ${containerId} ` +
            `(pid=${pid ?? "unknown"}, interfaces=${interfaceNames.join(",") || "unknown"}), fallback to Docker API stats. ` +
            `Error: ${this.getErrorMessage(error)}`
        );
      }
      return null;
    }
  }

  private normalizeLimit(value?: number): number | undefined {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
    return Math.floor(value);
  }

  private async ensureLinuxEnvironment() {
    if (this.linuxEnvironmentReady) {
      return true;
    }
    if (this.linuxEnvironmentUnsupportedReason) {
      throw new Error(this.linuxEnvironmentUnsupportedReason);
    }

    try {
      if (process.platform !== "linux") {
        throw new Error("Docker traffic limiting is only supported on Linux");
      }
      await this.execCommand("command -v tc >/dev/null 2>&1");
      await this.execCommand("command -v ip >/dev/null 2>&1");
      await this.execCommand("command -v nsenter >/dev/null 2>&1");
      this.linuxEnvironmentReady = true;
      return true;
    } catch (error) {
      this.linuxEnvironmentUnsupportedReason = this.getErrorMessage(error);
      if (!this.linuxEnvironmentWarningEmitted) {
        this.linuxEnvironmentWarningEmitted = true;
        logger.warn(
          `[NetworkLimitService] Linux network limiter unavailable, namespace stats disabled. ${this.linuxEnvironmentUnsupportedReason}`
        );
      }
      throw new Error(this.linuxEnvironmentUnsupportedReason);
    }
  }

  public async isLinuxEnvironmentSupported(): Promise<boolean> {
    try {
      await this.ensureLinuxEnvironment();
      return true;
    } catch (error) {
      return false;
    }
  }

  public clearStatsWarning(containerId: string): void {
    if (!this.statsWarnedContainers.has(containerId)) {
      return;
    }
    this.statsWarnedContainers.delete(containerId);
    this.statsWarnedOrder = this.statsWarnedOrder.filter((id) => id !== containerId);
  }

  private markStatsWarning(containerId: string): boolean {
    if (this.statsWarnedContainers.has(containerId)) {
      return false;
    }

    this.statsWarnedContainers.add(containerId);
    this.statsWarnedOrder.push(containerId);

    if (this.statsWarnedOrder.length > NetworkLimitService.STATS_WARNED_CONTAINERS_LIMIT) {
      const oldestContainerId = this.statsWarnedOrder.shift();
      if (oldestContainerId) {
        this.statsWarnedContainers.delete(oldestContainerId);
      }
    }

    return true;
  }

  private async inspectContainer(containerId: string) {
    return this.docker.getContainer(containerId).inspect();
  }

  private getNetworkMode(inspect: Dockerode.ContainerInspectInfo): string {
    const networkMode = inspect.HostConfig?.NetworkMode || "bridge";
    if (networkMode === "default") return "bridge";
    return networkMode;
  }

  private ensureSupportedNetworkMode(networkMode: string) {
    if (networkMode === "host") {
      throw new Error("Docker traffic limiting does not support host network mode");
    }
    if (networkMode === "none") {
      throw new Error("Docker traffic limiting does not support none network mode");
    }
    if (networkMode.startsWith("container:")) {
      throw new Error("Docker traffic limiting does not support container network mode");
    }
  }

  private ensureContainerPid(pid?: number): number {
    if (!pid || pid <= 0) {
      throw new Error("Container PID is unavailable, cannot configure tc rules");
    }

    return pid;
  }

  private async resolveContainerPid(
    containerId: string,
    initialInspect?: Dockerode.ContainerInspectInfo
  ): Promise<number> {
    const maxAttempts = 10;
    const retryDelayMs = 200;
    let inspect = initialInspect;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const pid = inspect?.State?.Pid;
      if (pid && pid > 0) {
        return pid;
      }

      if (attempt < maxAttempts - 1) {
        await this.sleep(retryDelayMs);
        inspect = await this.inspectContainer(containerId);
      }
    }

    throw new Error("Container PID is unavailable, cannot configure tc rules");
  }

  private async resolveContainerInterfaceNames(pid: number): Promise<string[]> {
    const result = await this.execInNetworkNamespace(
      pid,
      `for p in /sys/class/net/*; do
name=$(basename "$p")
if [ "$name" = "lo" ]; then
  continue
fi
case "$name" in
  bonding_masters|ifb*)
    continue
    ;;
esac
if [ -r "$p/statistics/rx_bytes" ] && [ -r "$p/statistics/tx_bytes" ]; then
  echo "$name"
fi
done`
    );
    return result.stdout
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter((item) => !!item)
      .filter((item) => this.isValidInterfaceName(item));
  }

  private async resolveContainerInterfaceName(pid: number): Promise<string> {
    const candidates = await this.resolveContainerInterfaceNames(pid);

    const interfaceName = candidates.find((item) => item === "eth0") || candidates[0];
    if (!interfaceName) {
      const diagnostics = await this.execInNetworkNamespace(
        pid,
        `for p in /sys/class/net/*; do
name=$(basename "$p")
if [ -d "$p/statistics" ]; then
  echo "$name:stats-dir"
else
  echo "$name:no-stats-dir"
fi
done`
      );
      throw new Error(
        `Unable to resolve a container network interface for PID ${pid}. Available entries: ${diagnostics.stdout
          .trim()
          .replace(/\s+/g, " ")}`
      );
    }
    return interfaceName;
  }

  private isValidInterfaceName(interfaceName: string): boolean {
    if (!interfaceName) return false;
    return /^[a-zA-Z0-9_.:-]+$/.test(interfaceName);
  }

  private looksLikeHostNamespaceInterfaces(interfaceNames: string[]): boolean {
    if (!interfaceNames.length) return false;
    return interfaceNames.some((name) => {
      if (name === "docker0") return true;
      return /^(br-|veth|virbr|cni|flannel|kube-|cali|zt|tailscale)/.test(name);
    });
  }

  private ensureValidInterfaceName(interfaceName: string): string {
    if (!this.isValidInterfaceName(interfaceName)) {
      throw new Error(`Invalid interface name: ${interfaceName}`);
    }
    return interfaceName;
  }

  private limitToBitPerSecond(limitKBps: number): number {
    return Math.max(8 * 1024, Math.floor(limitKBps * 1024 * 8));
  }

  private async verifyDownloadLimit(pid: number, interfaceName: string): Promise<void> {
    const safeInterface = this.ensureValidInterfaceName(interfaceName);
    await this.execInNetworkNamespace(
      pid,
      `tc qdisc show dev ${safeInterface} | grep -q "ingress ffff:"`
    );
    await this.execInNetworkNamespace(
      pid,
      `tc filter show dev ${safeInterface} parent ffff: | grep -Eq "police|rate"`
    );
  }

  private async verifyUploadLimit(pid: number, interfaceName: string): Promise<void> {
    const safeInterface = this.ensureValidInterfaceName(interfaceName);
    await this.execInNetworkNamespace(
      pid,
      `tc qdisc show dev ${safeInterface} | grep -Eq "\\btbf\\b"`
    );
  }

  private async applyDownloadLimit(
    pid: number,
    interfaceName: string,
    limitKBps: number
  ): Promise<void> {
    const safeInterface = this.ensureValidInterfaceName(interfaceName);
    const rateBitPerSecond = this.limitToBitPerSecond(limitKBps);
    await this.execInNetworkNamespace(
      pid,
      `tc qdisc replace dev ${safeInterface} ingress`
    );
    await this.execInNetworkNamespace(
      pid,
      `tc filter replace dev ${safeInterface} parent ffff: protocol all prio 1 u32 match u32 0 0 police rate ${rateBitPerSecond}bit burst 32k drop flowid :1`
    );
  }

  private async applyUploadLimit(
    pid: number,
    interfaceName: string,
    limitKBps: number
  ): Promise<void> {
    const safeInterface = this.ensureValidInterfaceName(interfaceName);
    const rateBitPerSecond = this.limitToBitPerSecond(limitKBps);
    await this.execInNetworkNamespace(
      pid,
      `tc qdisc replace dev ${safeInterface} root tbf rate ${rateBitPerSecond}bit burst 32kbit latency 400ms`
    );
  }

  private async readInterfaceCounter(
    pid: number,
    interfaceName: string,
    counterName: "rx_bytes" | "tx_bytes"
  ): Promise<number> {
    const safeInterface = this.ensureValidInterfaceName(interfaceName);
    await this.execInNetworkNamespace(
      pid,
      `[ -r /sys/class/net/${safeInterface}/statistics/${counterName} ]`
    );
    const result = await this.execInNetworkNamespace(
      pid,
      `cat /sys/class/net/${safeInterface}/statistics/${counterName}`
    );
    const value = Number(result.stdout.trim());
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Invalid ${counterName} value for ${safeInterface}: ${result.stdout.trim()}`);
    }
    return value;
  }

  private async deleteQdisc(pid: number, interfaceName: string, parent: "root" | "ingress") {
    try {
      const safeInterface = this.ensureValidInterfaceName(interfaceName);
      await this.execInNetworkNamespace(pid, `tc qdisc del dev ${safeInterface} ${parent}`);
    } catch (error) {}
  }

  private async execInNetworkNamespace(pid: number, command: string) {
    return this.execCommand(`nsenter -t ${pid} -n sh -c '${command.replace(/'/g, `'"'"'`)}'`);
  }

  private async sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private async execCommand(command: string) {
    try {
      return await execAsync(command);
    } catch (error: any) {
      const stderr = error?.stderr || error?.message || "Unknown command error";
      throw new Error(stderr);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
