import { createHash } from "crypto";
import { systemInfo, toNumber, toText } from "mcsmanager-common";
import Instance from "../entity/instance/instance";
import { globalConfiguration } from "../entity/config";
import processMonitor, { IProcessRuntimeSnapshot } from "./process_monitor";
import { getLinuxDiskSnapshots, selectPrimaryDiskForPaths } from "./host_metrics";
import InstanceSubsystem from "./system_instance";

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

class MonitorService {
  private readonly pluginStateMap = new Map<string, IPluginHeartbeatState>();
  private readonly processSnapshotMap = new Map<string, IProcessRuntimeSnapshot>();
  private readonly historyMap = new Map<string, RingQueue<IMcsmMonitorHistoryPoint>>();
  private readonly HEARTBEAT_TIMEOUT = 1000 * 30;
  private readonly HISTORY_SIZE = 180;
  private readonly DISK_CACHE_TTL = 1000 * 5;
  private diskCacheAt = 0;
  private diskCache: IMcsmMonitorDiskSnapshot[] = [];

  constructor() {
    setInterval(() => this.sampleInstances(), 1000 * 5);
  }

  private sampleInstances() {
    const now = Date.now();
    for (const instance of InstanceSubsystem.getInstances()) {
      const processSnapshot = processMonitor.sample(instance.process?.pid);
      this.processSnapshotMap.set(instance.instanceUuid, processSnapshot);

      if (processSnapshot.cpuPercent != null) instance.info.cpuUsage = processSnapshot.cpuPercent;
      if (processSnapshot.memoryPercent != null)
        instance.info.memoryUsagePercent = processSnapshot.memoryPercent;
      if (processSnapshot.memoryBytes != null) instance.info.memoryUsage = processSnapshot.memoryBytes;

      const pluginState = this.pluginStateMap.get(instance.instanceUuid);
      this.ensureHistory(instance.instanceUuid).push({
        timestamp: now,
        tps: pluginState?.tps.oneMin ?? 0,
        onlinePlayers: pluginState?.onlinePlayers ?? instance.info.currentPlayers ?? 0,
        procCpu: processSnapshot.cpuPercent ?? 0,
        procMemPercent: processSnapshot.memoryPercent ?? 0
      });
    }
  }

  private ensureHistory(serverId: string) {
    if (!this.historyMap.has(serverId)) {
      this.historyMap.set(serverId, new RingQueue<IMcsmMonitorHistoryPoint>(this.HISTORY_SIZE));
    }
    return this.historyMap.get(serverId)!;
  }

  private getInstancePath(instance: Instance) {
    try {
      return instance.absoluteCwdPath();
    } catch (error) {
      return "";
    }
  }

  private getDiskSnapshots(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.diskCacheAt > 0 && now - this.diskCacheAt < this.DISK_CACHE_TTL) {
      return this.diskCache;
    }

    this.diskCache = getLinuxDiskSnapshots();
    this.diskCacheAt = now;
    return this.diskCache;
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
      case Instance.STATUS_RUNNING:
        return "running";
      case Instance.STATUS_STARTING:
        return "starting";
      case Instance.STATUS_STOPPING:
        return "stopping";
      case Instance.STATUS_BUSY:
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

    const instance = InstanceSubsystem.getInstance(serverId);
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
      acceptedAt: Date.now(),
      pluginOnline: true
    };
  }

  private buildPluginSnapshot(instance: Instance): IMcsmMonitorPluginSnapshot {
    const pluginState = this.pluginStateMap.get(instance.instanceUuid);
    const heartbeatAgeMs = pluginState ? Date.now() - pluginState.lastSeen : undefined;
    const online = Boolean(pluginState && heartbeatAgeMs != null && heartbeatAgeMs <= this.HEARTBEAT_TIMEOUT);
    return {
      online,
      lastSeen: pluginState?.lastSeen,
      heartbeatAgeMs,
      pluginVersion: pluginState?.pluginVersion,
      serverVersion: pluginState?.serverVersion || instance.info.version || "",
      motd: pluginState?.motd || "",
      worlds: pluginState?.worlds || [],
      mainThreadBlocked: pluginState?.mainThreadBlocked ?? false,
      tps: pluginState?.tps || {
        oneMin: 0,
        fiveMin: 0,
        fifteenMin: 0
      },
      onlinePlayers: pluginState?.onlinePlayers ?? instance.info.currentPlayers ?? 0,
      maxPlayers: pluginState?.maxPlayers ?? instance.info.maxPlayers ?? 0
    };
  }

  private buildProcessSnapshot(instance: Instance): IMcsmMonitorProcessSnapshot {
    const processSnapshot =
      this.processSnapshotMap.get(instance.instanceUuid) ?? processMonitor.sample(instance.process?.pid);
    return {
      pid: processSnapshot.pid,
      cpuPercent: processSnapshot.cpuPercent,
      memoryBytes: processSnapshot.memoryBytes,
      memoryPercent: processSnapshot.memoryPercent
    };
  }

  public buildServerSnapshot(instance: Instance): IMcsmMonitorServerSnapshot {
    const instancePath = this.getInstancePath(instance);
    const hostPrimaryDisk = selectPrimaryDiskForPaths(this.getDiskSnapshots(), [instancePath]);

    return {
      serverId: instance.instanceUuid,
      instanceId: instance.instanceUuid,
      instanceName: instance.config.nickname,
      daemonTime: Date.now(),
      status: instance.status(),
      statusText: this.getStatusText(instance.status()),
      processRunning: instance.status() === Instance.STATUS_RUNNING,
      process: this.buildProcessSnapshot(instance),
      plugin: this.buildPluginSnapshot(instance),
      hostPrimaryDisk,
      history: this.ensureHistory(instance.instanceUuid).toArray()
    };
  }

  public getAgentOverview() {
    const instancePaths = InstanceSubsystem.getInstances().map((instance) => this.getInstancePath(instance));
    const servers = InstanceSubsystem.getInstances().map((instance) => this.buildServerSnapshot(instance));
    return {
      generatedAt: Date.now(),
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

export default new MonitorService();
