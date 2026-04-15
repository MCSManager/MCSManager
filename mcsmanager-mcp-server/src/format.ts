import type {
  ConfirmationRecord,
  InstanceAction,
  McsmMonitorDiskSnapshot,
  McsmMonitorNodeOverview,
  McsmMonitorOverviewResponse,
  McsmMonitorServerWithDaemon
} from "./types.js";
import {
  type AbnormalInstance,
  type AbnormalInstanceOptions,
  getAbnormalInstances,
  getAbnormalNodes,
  normalizeAbnormalInstanceOptions
} from "./monitorInsights.js";

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

export function formatHealthReport(overview: McsmMonitorOverviewResponse): string {
  const abnormalNodes = getAbnormalNodes(overview);
  const abnormalInstances = getAbnormalInstances(overview);
  const abnormalLines = [
    ...abnormalNodes.map(
      ({ node, reasons }) => `- 节点 ${nodeDisplayName(node)}：${reasons.join("，")}`
    ),
    ...abnormalInstances.map(
      ({ server, reasons }) =>
        `- 实例 ${server.instanceName} / ${nodeDisplayNameFromServer(server)}：${reasons.join("，")}`
    )
  ];

  return [
    "MCSManager 健康报告",
    `生成时间：${new Date(overview.generatedAt).toISOString()}`,
    `总览：节点 ${overview.summary.nodesOnline}/${overview.summary.nodesTotal} 在线，实例 ${overview.summary.serversRunning}/${overview.summary.serversTotal} 运行中，插件 ${overview.summary.pluginOnline}/${overview.summary.serversTotal} 在线`,
    "",
    "节点资源：",
    ...overview.nodes.map(formatNodeHealthLine),
    "",
    "实例状态：",
    ...overview.servers.map(formatInstanceLine),
    "",
    "异常摘要：",
    ...(abnormalLines.length > 0 ? abnormalLines : ["- 暂无明显异常"])
  ].join("\n");
}

export function formatAbnormalInstances(
  abnormalInstances: AbnormalInstance[],
  options: Partial<AbnormalInstanceOptions> = {}
): string {
  const thresholds = normalizeAbnormalInstanceOptions(options);
  if (abnormalInstances.length === 0) {
    return [
      "MCSManager 异常实例列表",
      `规则：运行实例 TPS 低于 ${formatNumber(thresholds.minTps)}、插件离线、主线程卡顿、进程 CPU/内存过高、节点离线会被列出。`,
      "当前没有匹配的异常实例。"
    ].join("\n");
  }

  return [
    "MCSManager 异常实例列表",
    `规则：运行实例 TPS 低于 ${formatNumber(thresholds.minTps)}、插件离线、主线程卡顿、进程 CPU/内存过高、节点离线会被列出。`,
    ...abnormalInstances.map(
      ({ server, reasons }) => `${formatInstanceLine(server)} | 原因 ${reasons.join("，")}`
    )
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

function hasLiveMetrics(
  server: Pick<McsmMonitorServerWithDaemon, "processRunning" | "plugin">
): boolean {
  return server.processRunning && server.plugin.online;
}

function formatServerTps(
  server: Pick<McsmMonitorServerWithDaemon, "processRunning" | "plugin">
): string {
  if (!hasLiveMetrics(server)) return "--";
  const tps = server.plugin.tps;
  return `1m ${formatNumber(tps.oneMin)} / 5m ${formatNumber(tps.fiveMin)} / 15m ${formatNumber(
    tps.fifteenMin
  )}`;
}

function formatServerPlayers(
  server: Pick<McsmMonitorServerWithDaemon, "processRunning" | "plugin">
): string {
  if (!hasLiveMetrics(server)) return "--";
  return `${server.plugin.onlinePlayers}/${server.plugin.maxPlayers}`;
}

export function formatInstanceStatus(server: McsmMonitorServerWithDaemon): string {
  const plugin = server.plugin;
  const process = server.process;
  return [
    `实例：${server.instanceName}`,
    `UUID：${server.instanceId}`,
    `节点：${nodeDisplayNameFromServer(server)} (${server.daemonIp}:${server.daemonPort})`,
    `节点状态：${server.daemonAvailable ? "在线" : "离线"}`,
    `实例状态：${server.statusText}，进程${server.processRunning ? "运行中" : "未运行"}`,
    `TPS：${formatServerTps(server)}`,
    `人数：${formatServerPlayers(server)}`,
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

export function formatCommandSent(
  server: McsmMonitorServerWithDaemon,
  command: string,
  allowedCommands: string[]
): string {
  return [
    "已发送白名单控制台命令。",
    `实例：${server.instanceName}`,
    `UUID：${server.instanceId}`,
    `节点：${nodeDisplayNameFromServer(server)} (${server.daemonIp}:${server.daemonPort})`,
    `命令：${command}`,
    `白名单：${allowedCommands.join(", ")}`,
    `执行时间：${new Date().toISOString()}`,
    "说明：MCSManager command API 只负责发送命令，不同步返回控制台输出；输出请在终端或后续状态查询中查看。"
  ].join("\n");
}

export function formatInstanceLine(server: McsmMonitorServerWithDaemon): string {
  const plugin = server.plugin;
  return `- ${server.instanceName} | UUID ${server.instanceId} | 节点 ${nodeDisplayNameFromServer(server)} | 状态 ${server.statusText} | TPS ${formatServerTps(server)} | 人数 ${formatServerPlayers(server)} | 插件 ${plugin.online ? "在线" : "离线"} | CPU ${formatOptionalPercent(server.process.cpuPercent)} | 内存 ${formatBytes(server.process.memoryBytes)}`;
}

export function formatCurrentInstanceLine(server: McsmMonitorServerWithDaemon): string {
  return formatInstanceLine(server);
}

export function formatCurrentInstanceStatus(server: McsmMonitorServerWithDaemon): string {
  return formatInstanceStatus(server);
}

export function formatCurrentInstances(servers: McsmMonitorServerWithDaemon[]): string {
  return formatInstances(servers);
}

export function formatCurrentCandidates(candidates: McsmMonitorServerWithDaemon[]): string {
  return formatCandidates(candidates);
}

export function formatCurrentHealthReport(overview: McsmMonitorOverviewResponse): string {
  return formatHealthReport(overview);
}

export function formatCurrentAbnormalInstances(
  abnormalInstances: AbnormalInstance[],
  options: Partial<AbnormalInstanceOptions> = {}
): string {
  return formatAbnormalInstances(abnormalInstances, options);
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

function formatNodeHealthLine(node: McsmMonitorNodeOverview): string {
  const host = node.host;
  if (!node.available) {
    return `- ${nodeDisplayName(node)} (${node.daemonIp}:${node.daemonPort}) | 离线 | 实例 ${node.servers.length}`;
  }
  return [
    `- ${nodeDisplayName(node)} (${node.daemonIp}:${node.daemonPort})`,
    "在线",
    `CPU ${host ? formatPercent(host.cpuPercent) : "--"}`,
    `内存 ${host ? `${formatPercent(host.memPercent)}，${formatBytes(host.freemem)} 可用` : "--"}`,
    `磁盘 ${formatDisk(host?.primaryDisk)}`,
    `实例 ${node.servers.length}`
  ].join(" | ");
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
  const abnormalNodes = getAbnormalNodes(overview);
  const abnormalInstances = getAbnormalInstances(overview);

  if (abnormalNodes.length > 0) abnormal.push(`${abnormalNodes.length} 个节点异常`);
  if (abnormalInstances.length > 0) abnormal.push(`${abnormalInstances.length} 个实例异常`);

  return abnormal;
}
