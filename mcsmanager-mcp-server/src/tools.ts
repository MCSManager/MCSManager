import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ConfirmationStore } from "./confirmationStore.js";
import {
  formatCurrentAbnormalInstances,
  formatCurrentCandidates,
  formatCurrentHealthReport,
  formatCurrentInstanceStatus,
  formatCurrentInstances,
  formatCommandSent,
  formatConfirmedAction,
  formatNodes,
  formatOverview,
  formatPreparedAction,
  nodeDisplayName,
  toolText
} from "./format.js";
import { resolveInstance } from "./instanceResolver.js";
import { McsmClient } from "./mcsmClient.js";
import { getAbnormalInstances, type AbnormalInstanceOptions } from "./monitorInsights.js";
import type {
  AppConfig,
  InstanceAction,
  McsmMonitorOverviewResponse,
  McsmMonitorServerWithDaemon
} from "./types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "mcsm_get_overview",
    description: "查看 MCSManager 节点和 Minecraft 实例的当前总览、在线数量和异常摘要。",
    inputSchema: { type: "object", additionalProperties: false, properties: {} }
  },
  {
    name: "mcsm_get_health_report",
    description: "生成适合 AstrBot 群聊回复的完整健康报告，包含节点资源、实例 TPS/人数/插件状态和异常摘要。",
    inputSchema: { type: "object", additionalProperties: false, properties: {} }
  },
  {
    name: "mcsm_get_abnormal_instances",
    description: "只列出异常实例，例如节点离线、进程运行但插件离线、TPS 偏低、主线程卡顿、进程 CPU/内存偏高。",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        minTps: {
          type: "number",
          description: "可选。TPS 低于该值时视为异常，默认 18。"
        },
        maxProcessCpuPercent: {
          type: "number",
          description: "可选。实例进程 CPU 百分比达到该值时视为异常，默认 80。"
        },
        maxProcessMemoryPercent: {
          type: "number",
          description: "可选。实例进程内存百分比达到该值时视为异常，默认 85。"
        },
        includeStopped: {
          type: "boolean",
          description: "可选。是否把已停止实例也列为异常，默认 false。"
        }
      }
    }
  },
  {
    name: "mcsm_list_nodes",
    description: "列出 MCSManager 所有远程节点的在线状态、CPU、内存、磁盘和实例数量。",
    inputSchema: { type: "object", additionalProperties: false, properties: {} }
  },
  {
    name: "mcsm_list_instances",
    description: "列出 Minecraft 实例，可按实例名称、节点名称或状态筛选。",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        nodeName: {
          type: "string",
          description: "可选。按节点备注、prefix、IP 或 daemonId 模糊筛选。"
        },
        instanceName: {
          type: "string",
          description: "可选。按实例名称或 UUID 模糊筛选。"
        },
        status: {
          type: "string",
          enum: ["running", "stopped", "plugin_online", "plugin_offline", "node_offline"],
          description: "可选。实例状态筛选。"
        }
      }
    }
  },
  {
    name: "mcsm_get_instance_status",
    description: "查看单个 Minecraft 实例的完整状态。名称匹配多个实例时只返回候选，不执行操作。",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        instanceName: { type: "string", description: "实例名称。没有 instanceUuid 时使用。" },
        instanceUuid: { type: "string", description: "实例 UUID，优先精确匹配。" }
      }
    }
  },
  {
    name: "mcsm_prepare_instance_action",
    description: "为实例 start/stop/restart 生成确认码。此工具不会实际执行操作。",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["action"],
      properties: {
        instanceName: { type: "string", description: "实例名称。没有 instanceUuid 时使用。" },
        instanceUuid: { type: "string", description: "实例 UUID，优先精确匹配。" },
        action: {
          type: "string",
          enum: ["start", "stop", "restart"],
          description: "准备执行的操作。"
        }
      }
    }
  },
  {
    name: "mcsm_confirm_instance_action",
    description: "输入确认码后执行已准备好的 start/stop/restart 操作。",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["confirmationCode"],
      properties: {
        confirmationCode: {
          type: "string",
          description: "mcsm_prepare_instance_action 返回的确认码。"
        }
      }
    }
  },
  {
    name: "mcsm_send_allowed_command",
    description: "向指定实例发送白名单控制台命令。只允许 MCSM_ALLOWED_INSTANCE_COMMANDS 中配置的命令名，例如 list,tps,say。",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["command"],
      properties: {
        instanceName: { type: "string", description: "实例名称。没有 instanceUuid 时使用。" },
        instanceUuid: { type: "string", description: "实例 UUID，优先精确匹配。" },
        command: {
          type: "string",
          description: "要发送的控制台命令。禁止换行；命令名必须在 MCSM_ALLOWED_INSTANCE_COMMANDS 白名单内。"
        }
      }
    }
  }
];

export class McsmToolHandlers {
  private readonly client: Pick<
    McsmClient,
    "getMonitorOverview" | "performInstanceAction" | "performInstanceCommand"
  >;
  private readonly confirmationStore: ConfirmationStore;
  private readonly allowedInstanceCommands: string[];

  constructor(
    config: AppConfig,
    client?: Pick<
      McsmClient,
      "getMonitorOverview" | "performInstanceAction" | "performInstanceCommand"
    >
  ) {
    this.client = client ?? new McsmClient(config);
    this.confirmationStore = new ConfirmationStore(config.confirmationTtlMs);
    this.allowedInstanceCommands = config.allowedInstanceCommands;
  }

  async callTool(name: string, args: unknown) {
    try {
      switch (name) {
        case "mcsm_get_overview":
          return toolText(formatOverview(await this.client.getMonitorOverview()));
        case "mcsm_get_health_report":
          return toolText(formatCurrentHealthReport(await this.client.getMonitorOverview()));
        case "mcsm_get_abnormal_instances":
          return toolText(await this.getAbnormalInstances(args));
        case "mcsm_list_nodes":
          return toolText(formatNodes((await this.client.getMonitorOverview()).nodes));
        case "mcsm_list_instances":
          return toolText(
            formatCurrentInstances(filterInstances(await this.client.getMonitorOverview(), args))
          );
        case "mcsm_get_instance_status":
          return toolText(await this.getInstanceStatus(args));
        case "mcsm_prepare_instance_action":
          return toolText(await this.prepareInstanceAction(args));
        case "mcsm_confirm_instance_action":
          return toolText(await this.confirmInstanceAction(args));
        case "mcsm_send_allowed_command":
          return toolText(await this.sendAllowedCommand(args));
        default:
          return { isError: true, ...toolText(`未知工具：${name}`) };
      }
    } catch (error) {
      return {
        isError: true,
        ...toolText(error instanceof Error ? error.message : String(error))
      };
    }
  }

  private async getAbnormalInstances(args: unknown): Promise<string> {
    const options = readAbnormalInstanceOptions(args);
    const overview = await this.client.getMonitorOverview();
    return formatCurrentAbnormalInstances(getAbnormalInstances(overview, options), options);
  }

  private async getInstanceStatus(args: unknown): Promise<string> {
    const overview = await this.client.getMonitorOverview();
    const result = resolveInstance(overview, readInstanceQuery(args));
    if (result.type === "found") return formatCurrentInstanceStatus(result.instance);
    if (result.type === "ambiguous") return formatCurrentCandidates(result.candidates);
    return "未找到匹配实例。请使用实例名称或 UUID 查询。";
  }

  private async prepareInstanceAction(args: unknown): Promise<string> {
    const input = readPrepareActionArgs(args);
    const overview = await this.client.getMonitorOverview();
    const result = resolveInstance(overview, input);
    if (result.type === "ambiguous") return formatCurrentCandidates(result.candidates);
    if (result.type === "not_found") return "未找到匹配实例，未生成确认码。";

    return formatPreparedAction(this.confirmationStore.prepare(result.instance, input.action));
  }

  private async confirmInstanceAction(args: unknown): Promise<string> {
    const confirmationCode = readString(args, "confirmationCode", true);
    const overview = await this.client.getMonitorOverview();
    const { record, instance } = this.confirmationStore.consume(confirmationCode, overview);
    await this.client.performInstanceAction(instance.daemonId, instance.instanceId, record.action);
    return formatConfirmedAction(record);
  }

  private async sendAllowedCommand(args: unknown): Promise<string> {
    const input = readSendCommandArgs(args);
    const command = validateAllowedCommand(input.command, this.allowedInstanceCommands);
    const overview = await this.client.getMonitorOverview();
    const result = resolveInstance(overview, input);
    if (result.type === "ambiguous") return formatCurrentCandidates(result.candidates);
    if (result.type === "not_found") return "未找到匹配实例，未发送命令。";

    const instance = result.instance;
    if (!instance.daemonAvailable) {
      throw new Error(`节点不可用，不能向实例 ${instance.instanceName} 发送命令。`);
    }
    if (!instance.processRunning) {
      throw new Error(`实例 ${instance.instanceName} 未运行，不能发送控制台命令。`);
    }

    await this.client.performInstanceCommand(instance.daemonId, instance.instanceId, command);
    return formatCommandSent(instance, command, this.allowedInstanceCommands);
  }
}

function filterInstances(
  overview: McsmMonitorOverviewResponse,
  args: unknown
): McsmMonitorServerWithDaemon[] {
  const nodeName = readString(args, "nodeName", false).toLowerCase();
  const instanceName = readString(args, "instanceName", false).toLowerCase();
  const status = readString(args, "status", false);

  return overview.servers.filter((server) => {
    if (nodeName && !matchesNode(server, nodeName)) return false;
    if (instanceName && !matchesInstance(server, instanceName)) return false;
    switch (status) {
      case "":
        return true;
      case "running":
        return server.processRunning;
      case "stopped":
        return !server.processRunning;
      case "plugin_online":
        return server.plugin.online;
      case "plugin_offline":
        return !server.plugin.online;
      case "node_offline":
        return !server.daemonAvailable;
      default:
        throw new Error(`不支持的 status：${status}`);
    }
  });
}

function matchesInstance(server: McsmMonitorServerWithDaemon, instanceName: string): boolean {
  return [server.instanceName, server.instanceId, server.serverId].some((value) =>
    value.toLowerCase().includes(instanceName)
  );
}

function matchesNode(server: McsmMonitorServerWithDaemon, nodeName: string): boolean {
  const values = [
    server.daemonRemarks,
    server.daemonPrefix,
    server.daemonIp,
    server.daemonId,
    nodeDisplayName({
      daemonId: server.daemonId,
      daemonIp: server.daemonIp,
      daemonPort: server.daemonPort,
      daemonPrefix: server.daemonPrefix,
      daemonRemarks: server.daemonRemarks,
      available: server.daemonAvailable,
      servers: []
    })
  ];
  return values.some((value) => value.toLowerCase().includes(nodeName));
}

function readPrepareActionArgs(args: unknown) {
  const action = readString(args, "action", true);
  if (!isInstanceAction(action)) throw new Error(`不支持的 action：${action}`);
  return { ...readInstanceQuery(args), action };
}

function readSendCommandArgs(args: unknown) {
  return {
    ...readInstanceQuery(args),
    command: readString(args, "command", true)
  };
}

function readAbnormalInstanceOptions(args: unknown): Partial<AbnormalInstanceOptions> {
  return {
    minTps: readNumber(args, "minTps"),
    maxProcessCpuPercent: readNumber(args, "maxProcessCpuPercent"),
    maxProcessMemoryPercent: readNumber(args, "maxProcessMemoryPercent"),
    includeStopped: readBoolean(args, "includeStopped")
  };
}

function readInstanceQuery(args: unknown) {
  const instanceName = readString(args, "instanceName", false);
  const instanceUuid = readString(args, "instanceUuid", false);
  if (!instanceName && !instanceUuid) throw new Error("必须提供 instanceName 或 instanceUuid。");
  return { instanceName, instanceUuid };
}

function readString(args: unknown, key: string, required: boolean): string {
  if (!args || typeof args !== "object") {
    if (required) throw new Error(`缺少参数：${key}`);
    return "";
  }

  const value = (args as Record<string, unknown>)[key];
  if (value == null || value === "") {
    if (required) throw new Error(`缺少参数：${key}`);
    return "";
  }
  if (typeof value !== "string") throw new Error(`参数 ${key} 必须是字符串。`);
  return value.trim();
}

function readNumber(args: unknown, key: string): number | undefined {
  if (!args || typeof args !== "object") return undefined;
  const value = (args as Record<string, unknown>)[key];
  if (value == null || value === "") return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`参数 ${key} 必须是数字。`);
  }
  return value;
}

function readBoolean(args: unknown, key: string): boolean | undefined {
  if (!args || typeof args !== "object") return undefined;
  const value = (args as Record<string, unknown>)[key];
  if (value == null || value === "") return undefined;
  if (typeof value !== "boolean") throw new Error(`参数 ${key} 必须是布尔值。`);
  return value;
}

function isInstanceAction(value: string): value is InstanceAction {
  return value === "start" || value === "stop" || value === "restart";
}

function validateAllowedCommand(command: string, allowedCommands: string[]): string {
  const trimmed = command.trim();
  if (!trimmed) throw new Error("命令不能为空。");
  if (trimmed.length > 240) throw new Error("命令过长，最多允许 240 个字符。");
  if (/[\r\n]/.test(trimmed)) throw new Error("命令不能包含换行。");
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(trimmed)) {
    throw new Error("命令不能包含控制字符。");
  }

  const normalizedCommand = trimmed.replace(/^\/+/, "");
  const commandName = normalizeCommandName(normalizedCommand);
  const allowedSet = new Set(allowedCommands.map(normalizeCommandName).filter(Boolean));
  if (allowedSet.size === 0) {
    throw new Error(
      "当前未开放任何控制台命令。请先配置 MCSM_ALLOWED_INSTANCE_COMMANDS，例如 list,tps,say。"
    );
  }
  if (!allowedSet.has(commandName)) {
    throw new Error(`命令 ${commandName} 不在白名单内，当前允许：${allowedCommands.join(", ")}`);
  }

  return normalizedCommand;
}

function normalizeCommandName(command: string): string {
  return command.trim().replace(/^\/+/, "").split(/\s+/)[0]?.toLowerCase() ?? "";
}
