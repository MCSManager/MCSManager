import { createHash } from "crypto";
import { systemInfo, toNumber, toText } from "mcsmanager-common";
import { globalConfiguration } from "../entity/config";
import { getLinuxDiskSnapshots, selectPrimaryDiskForPaths } from "./host_metrics";
import type { IProcessRuntimeSnapshot } from "./process_monitor";

const INSTANCE_STATUS_BUSY = -1;
const INSTANCE_STATUS_STOPPING = 1;
const INSTANCE_STATUS_STARTING = 2;
const INSTANCE_STATUS_RUNNING = 3;

interface IPluginHeartbeatPayload {
  serverId: string;
  instanceToken: string;
  timestamp?: number;
  tps?: Record<string, any>;
  onlinePlayers?: number;
  maxPlayers?: number;
  worlds?: string[];
  pluginVersion?: string;
  serverVersion?: string;
  motd?: string;
  mainThreadBlocked?: boolean;
}

interface IPluginHeartbeatState {
  serverId: string;
  lastSeen: number;
  pluginVersion?: string;
  serverVersion?: string;
  motd?: string;
  worlds: string[];
  mainThreadBlocked: boolean;
  tps: IMcsmMonitorTpsSnapshot;
  onlinePlayers: number;
  maxPlayers: number;
}

interface IInstanceExitEvent {
  instanceUuid: string;
  instanceName: string;
}

interface IMonitorInstanceLike {
  instanceUuid: string;
  config: {
    nickname: string;
  };
  info: {
    currentPlayers: number;
    maxPlayers: number;
    version: string;
    cpuUsage?: number;
    memoryUsagePercent?: number;
    memoryUsage?: number;
  };
  process?: {
    pid?: number | string;
  };
  status(): number;
  absoluteCwdPath(): string;
}

interface IInstanceSubsystemLike {
  getInstances(): IMonitorInstanceLike[];
  getInstance(instanceUuid: string): IMonitorInstanceLike | undefined;
  on(event: "exit", listener: (payload: IInstanceExitEvent, ...args: any[]) => void): any;
}

interface IProcessMonitorLike {
  sample(pid?: number | string): IProcessRuntimeSnapshot;
}

interface IMonitorServiceDeps {
  instanceSubsystem?: IInstanceSubsystemLike;
  processMonitor?: IProcessMonitorLike;
  now?: () => number;
  setIntervalFn?: typeof setInterval;
}

function getDefaultInstanceSubsystem(): IInstanceSubsystemLike {
  return require("./system_instance").default as IInstanceSubsystemLike;
}

function getDefaultProcessMonitor(): IProcessMonitorLike {
  return require("./process_monitor").default as IProcessMonitorLike;
}

class RingQueue<T> {
  private readonly arr: T[] = [];

  constructor(private readonly maxSize: number) {}

  push(data: T) {
    if (this.arr.length >= this.maxSize) this.arr.shift();
    this.arr.push(data);
  }

  toArray() {
    return [...this.arr];
  }
}

export class MonitorService {
  private readonly pluginStateMap = new Map<string, IPluginHeartbeatState>();
  private readonly processSnapshotMap = new Map<string, IProcessRuntimeSnapshot>();
  private readonly historyMap = new Map<string, RingQueue<IMcsmMonitorHistoryPoint>>();
  private readonly HEARTBEAT_TIMEOUT = 1000 * 30;
  private readonly HISTORY_SIZE = 180;
  private readonly DISK_CACHE_TTL = 1000 * 5;
  private readonly instanceSubsystem: IInstanceSubsystemLike;
  private readonly processMonitorRef: IProcessMonitorLike;
  private readonly now: () => number;
  private diskCacheAt = 0;
  private diskCache: IMcsmMonitorDiskSnapshot[] = [];

  constructor(deps: IMonitorServiceDeps = {}) {
    this.instanceSubsystem = deps.instanceSubsystem ?? getDefaultInstanceSubsystem();
    this.processMonitorRef = deps.processMonitor ?? getDefaultProcessMonitor();
    this.now = deps.now ?? Date.now;

    this.instanceSubsystem.on("exit", ({ instanceUuid }) => {
      this.handleInstanceExit(instanceUuid);
    });

    const timer = (deps.setIntervalFn ?? setInterval)(() => this.sampleInstances(), 1000 * 5);
    if (typeof (timer as any)?.unref === "function") {
      (timer as any).unref();
    }
  }

  private sampleInstances() {
    const now = this.now();
    for (const instance of this.instanceSubsystem.getInstances()) {
      const processRunning = this.isProcessRunning(instance);
      const processSnapshot = processRunning ? this.processMonitorRef.sample(instance.process?.pid) : {};

      if (processRunning) {
        this.processSnapshotMap.set(instance.instanceUuid, processSnapshot);

        if (processSnapshot.cpuPercent != null) instance.info.cpuUsage = processSnapshot.cpuPercent;
        if (processSnapshot.memoryPercent != null)
          instance.info.memoryUsagePercent = processSnapshot.memoryPercent;
        if (processSnapshot.memoryBytes != null) instance.info.memoryUsage = processSnapshot.memoryBytes;
      } else {
        this.processSnapshotMap.delete(instance.instanceUuid);
      }

      const pluginState = this.pluginStateMap.get(instance.instanceUuid);
      const pluginMetricsLive = this.isPluginMetricsLive(instance, pluginState);
      this.pushHistoryPoint(instance.instanceUuid, {
        timestamp: now,
        tps: pluginMetricsLive && pluginState ? pluginState.tps.oneMin : 0,
        onlinePlayers: pluginMetricsLive && pluginState ? pluginState.onlinePlayers : 0,
        procCpu: processRunning ? processSnapshot.cpuPercent ?? 0 : 0,
        procMemPercent: processRunning ? processSnapshot.memoryPercent ?? 0 : 0
      });
    }
  }

  private ensureHistory(serverId: string) {
    if (!this.historyMap.has(serverId)) {
      this.historyMap.set(serverId, new RingQueue<IMcsmMonitorHistoryPoint>(this.HISTORY_SIZE));
    }
    return this.historyMap.get(serverId)!;
  }

  private getInstancePath(instance: IMonitorInstanceLike) {
    try {
      return instance.absoluteCwdPath();
    } catch (error) {
      return "";
    }
  }

  private getDiskSnapshots(forceRefresh = false) {
    const now = this.now();
    if (!forceRefresh && this.diskCacheAt > 0 && now - this.diskCacheAt < this.DISK_CACHE_TTL) {
      return this.diskCache;
    }

    this.diskCache = getLinuxDiskSnapshots();
    this.diskCacheAt = now;
    return this.diskCache;
  }

  private createEmptyTpsSnapshot(): IMcsmMonitorTpsSnapshot {
    return {
      oneMin: 0,
      fiveMin: 0,
      fifteenMin: 0
    };
  }

  private isProcessRunning(instance: IMonitorInstanceLike) {
    return instance.status() === INSTANCE_STATUS_RUNNING;
  }

  private getHeartbeatAgeMs(pluginState?: IPluginHeartbeatState) {
    if (!pluginState) return undefined;
    return Math.max(0, this.now() - pluginState.lastSeen);
  }

  private isPluginMetricsLive(instance: IMonitorInstanceLike, pluginState?: IPluginHeartbeatState) {
    const heartbeatAgeMs = this.getHeartbeatAgeMs(pluginState);
    return Boolean(
      this.isProcessRunning(instance) &&
        pluginState &&
        heartbeatAgeMs != null &&
        heartbeatAgeMs <= this.HEARTBEAT_TIMEOUT
    );
  }

  private pushHistoryPoint(serverId: string, point: IMcsmMonitorHistoryPoint) {
    this.ensureHistory(serverId).push(point);
  }

  private pushZeroHistory(serverId: string, timestamp = this.now()) {
    this.pushHistoryPoint(serverId, {
      timestamp,
      tps: 0,
      onlinePlayers: 0,
      procCpu: 0,
      procMemPercent: 0
    });
  }

  private handleInstanceExit(serverId: string) {
    this.pluginStateMap.delete(serverId);
    this.processSnapshotMap.delete(serverId);
    this.pushZeroHistory(serverId);
  }

  public getHostSnapshot(paths: string[] = []): IMcsmMonitorHostSnapshot {
    const info = systemInfo();
    const disks = this.getDiskSnapshots();

    return {
      cpuPercent: Number((info.cpuUsage * 100).toFixed(1)),
      memPercent: Number((info.memUsage * 100).toFixed(1)),
      totalmem: info.totalmem,
      freemem: info.freemem,
      hostname: info.hostname,
      platform: info.platform,
      loadavg: info.loadavg,
      disks,
      primaryDisk: selectPrimaryDiskForPaths(disks, paths)
    };
  }

  private normalizeTps(data: Record<string, any> | undefined): IMcsmMonitorTpsSnapshot {
    const oneMin = toNumber(data?.oneMin ?? data?.["1m"] ?? data?.tps1m) ?? 0;
    const fiveMin = toNumber(data?.fiveMin ?? data?.["5m"] ?? data?.tps5m) ?? 0;
    const fifteenMin = toNumber(data?.fifteenMin ?? data?.["15m"] ?? data?.tps15m) ?? 0;
    return {
      oneMin: Number(oneMin.toFixed(2)),
      fiveMin: Number(fiveMin.toFixed(2)),
      fifteenMin: Number(fifteenMin.toFixed(2))
    };
  }

  private getStatusText(status: number) {
    switch (status) {
      case INSTANCE_STATUS_RUNNING:
        return "running";
      case INSTANCE_STATUS_STARTING:
        return "starting";
      case INSTANCE_STATUS_STOPPING:
        return "stopping";
      case INSTANCE_STATUS_BUSY:
        return "busy";
      default:
        return "stopped";
    }
  }

  private buildExpectedToken(serverId: string) {
    return createHash("sha256")
      .update(`${globalConfiguration.config.key}:${serverId}`)
      .digest("hex");
  }

  public getExpectedToken(serverId: string) {
    return this.buildExpectedToken(serverId);
  }

  public recordHeartbeat(payload: IPluginHeartbeatPayload) {
    const serverId = toText(payload?.serverId)?.trim() || "";
    const instanceToken = toText(payload?.instanceToken)?.trim() || "";
    if (!serverId) throw new Error("serverId is required");
    if (!instanceToken) throw new Error("instanceToken is required");

    const instance = this.instanceSubsystem.getInstance(serverId);
    if (!instance) throw new Error("serverId does not match any managed instance");

    const expectedToken = this.buildExpectedToken(serverId);
    if (instanceToken !== expectedToken && instanceToken !== globalConfiguration.config.key) {
      throw new Error("instanceToken is invalid");
    }

    const currentState: IPluginHeartbeatState = {
      serverId,
      lastSeen: toNumber(payload?.timestamp) ?? Date.now(),
      pluginVersion: toText(payload?.pluginVersion) || "",
      serverVersion: toText(payload?.serverVersion) || "",
      motd: toText(payload?.motd) || "",
      worlds: Array.isArray(payload?.worlds)
        ? payload.worlds.map((item) => String(item)).filter(Boolean)
        : [],
      mainThreadBlocked: Boolean(payload?.mainThreadBlocked),
      tps: this.normalizeTps(payload?.tps),
      onlinePlayers: toNumber(payload?.onlinePlayers) ?? 0,
      maxPlayers: toNumber(payload?.maxPlayers) ?? 0
    };

    this.pluginStateMap.set(serverId, currentState);
    instance.info.currentPlayers = currentState.onlinePlayers;
    instance.info.maxPlayers = currentState.maxPlayers;
    if (currentState.serverVersion) instance.info.version = currentState.serverVersion;

    return {
      serverId,
      acceptedAt: this.now(),
      pluginOnline: true
    };
  }

  private buildPluginSnapshot(instance: IMonitorInstanceLike): IMcsmMonitorPluginSnapshot {
    const pluginState = this.pluginStateMap.get(instance.instanceUuid);
    const heartbeatAgeMs = this.getHeartbeatAgeMs(pluginState);
    const online = this.isPluginMetricsLive(instance, pluginState);
    return {
      online,
      lastSeen: pluginState?.lastSeen,
      heartbeatAgeMs,
      pluginVersion: pluginState?.pluginVersion,
      serverVersion: pluginState?.serverVersion || instance.info.version || "",
      motd: pluginState?.motd || "",
      worlds: pluginState?.worlds || [],
      mainThreadBlocked: online ? pluginState?.mainThreadBlocked ?? false : false,
      tps: online && pluginState ? pluginState.tps : this.createEmptyTpsSnapshot(),
      onlinePlayers: online && pluginState ? pluginState.onlinePlayers : 0,
      maxPlayers: online && pluginState ? pluginState.maxPlayers : 0
    };
  }

  private buildProcessSnapshot(instance: IMonitorInstanceLike): IMcsmMonitorProcessSnapshot {
    if (!this.isProcessRunning(instance)) return {};

    const processSnapshot =
      this.processSnapshotMap.get(instance.instanceUuid) ??
      this.processMonitorRef.sample(instance.process?.pid);
    this.processSnapshotMap.set(instance.instanceUuid, processSnapshot);

    return {
      pid: processSnapshot.pid,
      cpuPercent: processSnapshot.cpuPercent,
      memoryBytes: processSnapshot.memoryBytes,
      memoryPercent: processSnapshot.memoryPercent
    };
  }

  public buildServerSnapshot(instance: IMonitorInstanceLike): IMcsmMonitorServerSnapshot {
    const instancePath = this.getInstancePath(instance);
    const hostPrimaryDisk = selectPrimaryDiskForPaths(this.getDiskSnapshots(), [instancePath]);

    return {
      serverId: instance.instanceUuid,
      instanceId: instance.instanceUuid,
      instanceName: instance.config.nickname,
      daemonTime: this.now(),
      status: instance.status(),
      statusText: this.getStatusText(instance.status()),
      processRunning: this.isProcessRunning(instance),
      process: this.buildProcessSnapshot(instance),
      plugin: this.buildPluginSnapshot(instance),
      hostPrimaryDisk,
      history: this.ensureHistory(instance.instanceUuid).toArray()
    };
  }

  public getAgentOverview() {
    const instancePaths = this.instanceSubsystem
      .getInstances()
      .map((instance) => this.getInstancePath(instance));
    const servers = this.instanceSubsystem
      .getInstances()
      .map((instance) => this.buildServerSnapshot(instance));
    return {
      generatedAt: this.now(),
      host: this.getHostSnapshot(instancePaths),
      servers
    };
  }

  public renderPrometheusMetrics() {
    const overview = this.getAgentOverview();
    const lines = [
      "# HELP mcsm_host_cpu_percent Host CPU usage percent.",
      "# TYPE mcsm_host_cpu_percent gauge",
      `mcsm_host_cpu_percent ${overview.host.cpuPercent}`,
      "# HELP mcsm_host_memory_percent Host memory usage percent.",
      "# TYPE mcsm_host_memory_percent gauge",
      `mcsm_host_memory_percent ${overview.host.memPercent}`,
      "# HELP mcsm_host_disk_total_bytes Host disk total bytes.",
      "# TYPE mcsm_host_disk_total_bytes gauge",
      "# HELP mcsm_host_disk_free_bytes Host disk free bytes.",
      "# TYPE mcsm_host_disk_free_bytes gauge",
      "# HELP mcsm_host_disk_usage_percent Host disk usage percent.",
      "# TYPE mcsm_host_disk_usage_percent gauge",
      "# HELP mcsm_server_up Managed server process status.",
      "# TYPE mcsm_server_up gauge",
      "# HELP mcsm_server_plugin_up Minecraft plugin heartbeat status.",
      "# TYPE mcsm_server_plugin_up gauge",
      "# HELP mcsm_server_players_online Online player count.",
      "# TYPE mcsm_server_players_online gauge",
      "# HELP mcsm_server_players_max Configured max player count.",
      "# TYPE mcsm_server_players_max gauge",
      "# HELP mcsm_server_tps Minecraft TPS by moving window.",
      "# TYPE mcsm_server_tps gauge",
      "# HELP mcsm_server_process_cpu_percent Process CPU usage percent.",
      "# TYPE mcsm_server_process_cpu_percent gauge",
      "# HELP mcsm_server_process_memory_bytes Process resident memory bytes.",
      "# TYPE mcsm_server_process_memory_bytes gauge"
    ];

    for (const server of overview.servers) {
      const baseLabels = `server_id="${this.escapeLabel(server.serverId)}",instance_name="${this.escapeLabel(
        server.instanceName
      )}"`;
      lines.push(`mcsm_server_up{${baseLabels}} ${server.processRunning ? 1 : 0}`);
      lines.push(`mcsm_server_plugin_up{${baseLabels}} ${server.plugin.online ? 1 : 0}`);
      lines.push(`mcsm_server_players_online{${baseLabels}} ${server.plugin.onlinePlayers}`);
      lines.push(`mcsm_server_players_max{${baseLabels}} ${server.plugin.maxPlayers}`);
      lines.push(`mcsm_server_tps{${baseLabels},window="1m"} ${server.plugin.tps.oneMin}`);
      lines.push(`mcsm_server_tps{${baseLabels},window="5m"} ${server.plugin.tps.fiveMin}`);
      lines.push(`mcsm_server_tps{${baseLabels},window="15m"} ${server.plugin.tps.fifteenMin}`);
      if (server.process.cpuPercent != null) {
        lines.push(`mcsm_server_process_cpu_percent{${baseLabels}} ${server.process.cpuPercent}`);
      }
      if (server.process.memoryBytes != null) {
        lines.push(`mcsm_server_process_memory_bytes{${baseLabels}} ${server.process.memoryBytes}`);
      }
    }

    const daemonPrefix = this.escapeLabel(globalConfiguration.config.prefix || "default");
    const hostName = this.escapeLabel(overview.host.hostname || "unknown");
    for (const disk of overview.host.disks) {
      const diskLabels =
        `daemon_prefix="${daemonPrefix}",host="${hostName}",mount="${this.escapeLabel(disk.mount)}"` +
        `,device="${this.escapeLabel(disk.device)}"`;
      lines.push(`mcsm_host_disk_total_bytes{${diskLabels}} ${disk.totalBytes}`);
      lines.push(`mcsm_host_disk_free_bytes{${diskLabels}} ${disk.freeBytes}`);
      lines.push(`mcsm_host_disk_usage_percent{${diskLabels}} ${disk.usagePercent}`);
    }

    return lines.join("\n") + "\n";
  }

  private escapeLabel(value: string) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  }
}

const defaultMonitorService =
  process.env.MCSM_MONITOR_SKIP_DEFAULT_BOOT === "1"
    ? (undefined as unknown as MonitorService)
    : new MonitorService();

export default defaultMonitorService;
