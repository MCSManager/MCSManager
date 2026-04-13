import type {
  ConfirmationRecord,
  InstanceAction,
  McsmMonitorDiskSnapshot,
  McsmMonitorNodeOverview,
  McsmMonitorOverviewResponse,
  McsmMonitorServerWithDaemon
} from "./types.js";

export function toolText(text: string) {
  return {
    content: [{ type: "text" as const, text }]
  };
}

export function formatOverview(overview: McsmMonitorOverviewResponse): string {
  const abnormal = buildAbnormalSummary(overview);
  return [
    "MCSManager 当前总览",
    `节点：${overview.summary.nodesOnline}/${overview.summary.nodesTotal} 在线`,
    `实例：${overview.summary.serversRunning}/${overview.summary.serversTotal} 运行中`,
    `插件：${overview.summary.pluginOnline}/${overview.summary.serversTotal} 在线`,
    abnormal.length > 0 ? `异常：${abnormal.join("；")}` : "异常：暂无明显异常"
  ].join("\n");
}

export function formatNodes(nodes: McsmMonitorNodeOverview[]): string {
  if (nodes.length === 0) return "当前没有已接入的 MCSManager 节点。";

  return [
    "MCSManager 节点列表",
    ...nodes.map((node) => {
      const host = node.host;
      const disk = formatDisk(host?.primaryDisk);
      const mem = host ? `${formatPercent(host.memPercent)}，${formatBytes(host.freemem)} 可用` : "--";
      const cpu = host ? formatPercent(host.cpuPercent) : "--";
      return [
        `- ${nodeDisplayName(node)} (${node.daemonIp}:${node.daemonPort})`,
        `状态：${node.available ? "在线" : "离线"}`,
        `CPU：${cpu}`,
        `内存：${mem}`,
        `磁盘：${disk}`,
        `实例：${node.servers.length}`
      ].join(" | ");
    })
  ].join("\n");
}

export function formatInstances(servers: McsmMonitorServerWithDaemon[]): string {
  if (servers.length === 0) return "没有匹配的实例。";
  return ["MCSManager 实例列表", ...servers.map((server) => formatInstanceLine(server))].join("\n");
}

export function formatInstanceStatus(server: McsmMonitorServerWithDaemon): string {
  const plugin = server.plugin;
  const process = server.process;
  const tps = plugin.tps;
  return [
    `实例：${server.instanceName}`,
    `UUID：${server.instanceId}`,
    `节点：${nodeDisplayNameFromServer(server)} (${server.daemonIp}:${server.daemonPort})`,
    `节点状态：${server.daemonAvailable ? "在线" : "离线"}`,
    `实例状态：${server.statusText}，进程${server.processRunning ? "运行中" : "未运行"}`,
    `TPS：1m ${formatNumber(tps.oneMin)} / 5m ${formatNumber(tps.fiveMin)} / 15m ${formatNumber(tps.fifteenMin)}`,
    `人数：${plugin.onlinePlayers}/${plugin.maxPlayers}`,
    `插件：${plugin.online ? "在线" : "离线"}${plugin.mainThreadBlocked ? "，主线程疑似卡顿" : ""}`,
    `进程：CPU ${formatOptionalPercent(process.cpuPercent)}，内存 ${formatBytes(process.memoryBytes)}`,
    `磁盘：${formatDisk(server.hostPrimaryDisk)}`,
    `版本：${plugin.serverVersion || "--"}`,
    `MOTD：${plugin.motd || "--"}`
  ].join("\n");
}

export function formatCandidates(candidates: McsmMonitorServerWithDaemon[]): string {
  return ["匹配到多个实例，请使用 UUID 精确指定：", ...candidates.map(formatInstanceLine)].join("\n");
}

export function formatPreparedAction(record: ConfirmationRecord): string {
  return [
    `已生成 ${formatAction(record.action)} 确认码，不会自动执行。`,
    `实例：${record.instanceName}`,
    `UUID：${record.instanceUuid}`,
    `确认码：${record.code}`,
    `过期时间：${new Date(record.expiresAt).toISOString()}`,
    "确认后才会执行操作。"
  ].join("\n");
}

export function formatConfirmedAction(record: ConfirmationRecord): string {
  return [
    `已执行 ${formatAction(record.action)}。`,
    `实例：${record.instanceName}`,
    `UUID：${record.instanceUuid}`,
    `节点：${record.daemonId}`,
    `执行时间：${new Date().toISOString()}`
  ].join("\n");
}

export function formatInstanceLine(server: McsmMonitorServerWithDaemon): string {
  const plugin = server.plugin;
  return `- ${server.instanceName} | UUID ${server.instanceId} | 节点 ${nodeDisplayNameFromServer(server)} | 状态 ${server.statusText} | TPS ${formatNumber(plugin.tps.oneMin)} | 人数 ${plugin.onlinePlayers}/${plugin.maxPlayers} | 插件 ${plugin.online ? "在线" : "离线"} | CPU ${formatOptionalPercent(server.process.cpuPercent)} | 内存 ${formatBytes(server.process.memoryBytes)}`;
}

export function nodeDisplayName(node: McsmMonitorNodeOverview): string {
  return node.daemonRemarks || node.daemonPrefix || node.daemonId;
}

export function nodeDisplayNameFromServer(server: McsmMonitorServerWithDaemon): string {
  return server.daemonRemarks || server.daemonPrefix || server.daemonId;
}

export function formatAction(action: InstanceAction): string {
  switch (action) {
    case "start":
      return "启动";
    case "stop":
      return "停止";
    case "restart":
      return "重启";
  }
}

export function formatBytes(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "--";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let size = Math.max(0, value);
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDisk(disk: McsmMonitorDiskSnapshot | undefined): string {
  if (!disk) return "--";
  return `${disk.mount} ${formatPercent(disk.usagePercent)} 已用，${formatBytes(disk.freeBytes)} 可用`;
}

function formatPercent(value: number): string {
  return `${formatNumber(value)}%`;
}

function formatOptionalPercent(value: number | undefined): string {
  return value == null ? "--" : formatPercent(value);
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function buildAbnormalSummary(overview: McsmMonitorOverviewResponse): string[] {
  const abnormal: string[] = [];
  const offlineNodes = overview.nodes.filter((node) => !node.available);
  const pluginOffline = overview.servers.filter((server) => !server.plugin.online);
  const blocked = overview.servers.filter((server) => server.plugin.mainThreadBlocked);
  const lowTps = overview.servers.filter(
    (server) => server.plugin.online && server.plugin.tps.oneMin > 0 && server.plugin.tps.oneMin < 18
  );
  const highDiskNodes = overview.nodes.filter(
    (node) => (node.host?.primaryDisk?.usagePercent ?? 0) >= 90
  );

  if (offlineNodes.length > 0) abnormal.push(`${offlineNodes.length} 个节点离线`);
  if (pluginOffline.length > 0) abnormal.push(`${pluginOffline.length} 个实例插件离线`);
  if (blocked.length > 0) abnormal.push(`${blocked.length} 个实例主线程疑似卡顿`);
  if (lowTps.length > 0) abnormal.push(`${lowTps.length} 个实例 TPS 低于 18`);
  if (highDiskNodes.length > 0) abnormal.push(`${highDiskNodes.length} 个节点磁盘使用率超过 90%`);

  return abnormal;
}
