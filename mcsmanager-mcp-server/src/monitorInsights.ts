import type {
  McsmMonitorNodeOverview,
  McsmMonitorOverviewResponse,
  McsmMonitorServerWithDaemon
} from "./types.js";

export interface AbnormalInstanceOptions {
  minTps: number;
  maxProcessCpuPercent: number;
  maxProcessMemoryPercent: number;
  includeStopped: boolean;
}

export interface AbnormalInstance {
  server: McsmMonitorServerWithDaemon;
  reasons: string[];
}

export interface AbnormalNode {
  node: McsmMonitorNodeOverview;
  reasons: string[];
}

export const DEFAULT_ABNORMAL_INSTANCE_OPTIONS: AbnormalInstanceOptions = {
  minTps: 18,
  maxProcessCpuPercent: 80,
  maxProcessMemoryPercent: 85,
  includeStopped: false
};

export function getAbnormalInstances(
  overview: McsmMonitorOverviewResponse,
  options: Partial<AbnormalInstanceOptions> = {}
): AbnormalInstance[] {
  const thresholds = normalizeAbnormalInstanceOptions(options);

  return overview.servers
    .map((server) => ({
      server,
      reasons: getInstanceAbnormalReasons(server, thresholds)
    }))
    .filter((item) => item.reasons.length > 0);
}

export function getAbnormalNodes(overview: McsmMonitorOverviewResponse): AbnormalNode[] {
  return overview.nodes
    .map((node) => ({
      node,
      reasons: getNodeAbnormalReasons(node)
    }))
    .filter((item) => item.reasons.length > 0);
}

export function normalizeAbnormalInstanceOptions(
  options: Partial<AbnormalInstanceOptions> = {}
): AbnormalInstanceOptions {
  return {
    minTps: normalizeThreshold(options.minTps, DEFAULT_ABNORMAL_INSTANCE_OPTIONS.minTps),
    maxProcessCpuPercent: normalizeThreshold(
      options.maxProcessCpuPercent,
      DEFAULT_ABNORMAL_INSTANCE_OPTIONS.maxProcessCpuPercent
    ),
    maxProcessMemoryPercent: normalizeThreshold(
      options.maxProcessMemoryPercent,
      DEFAULT_ABNORMAL_INSTANCE_OPTIONS.maxProcessMemoryPercent
    ),
    includeStopped: options.includeStopped ?? DEFAULT_ABNORMAL_INSTANCE_OPTIONS.includeStopped
  };
}

function getInstanceAbnormalReasons(
  server: McsmMonitorServerWithDaemon,
  options: AbnormalInstanceOptions
): string[] {
  const reasons: string[] = [];

  if (!server.daemonAvailable) {
    reasons.push("所属节点离线");
    return reasons;
  }

  if (!server.processRunning) {
    if (options.includeStopped) reasons.push("实例未运行");
    return reasons;
  }

  if (!server.plugin.online) reasons.push("进程运行但插件离线");
  if (server.plugin.mainThreadBlocked) reasons.push("主线程疑似卡顿");

  const tps = server.plugin.tps?.oneMin;
  if (server.plugin.online && Number.isFinite(tps) && tps > 0 && tps < options.minTps) {
    reasons.push(`TPS ${formatNumber(tps)} 低于 ${formatNumber(options.minTps)}`);
  }

  const cpuPercent = server.process.cpuPercent;
  if (
    cpuPercent != null &&
    Number.isFinite(cpuPercent) &&
    cpuPercent >= options.maxProcessCpuPercent
  ) {
    reasons.push(`进程 CPU ${formatNumber(cpuPercent)}% 偏高`);
  }

  const memoryPercent = server.process.memoryPercent;
  if (
    memoryPercent != null &&
    Number.isFinite(memoryPercent) &&
    memoryPercent >= options.maxProcessMemoryPercent
  ) {
    reasons.push(`进程内存 ${formatNumber(memoryPercent)}% 偏高`);
  }

  return reasons;
}

function getNodeAbnormalReasons(node: McsmMonitorNodeOverview): string[] {
  const reasons: string[] = [];
  if (!node.available) {
    reasons.push("节点离线");
    return reasons;
  }

  const host = node.host;
  if (!host) {
    reasons.push("缺少宿主机资源快照");
    return reasons;
  }

  if (host.cpuPercent >= 90) reasons.push(`宿主机 CPU ${formatNumber(host.cpuPercent)}% 偏高`);
  if (host.memPercent >= 90) reasons.push(`宿主机内存 ${formatNumber(host.memPercent)}% 偏高`);
  if ((host.primaryDisk?.usagePercent ?? 0) >= 90) {
    reasons.push(`主磁盘使用率 ${formatNumber(host.primaryDisk?.usagePercent ?? 0)}% 偏高`);
  }

  return reasons;
}

function normalizeThreshold(value: number | undefined, fallback: number): number {
  if (value == null || !Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

function formatNumber(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}
