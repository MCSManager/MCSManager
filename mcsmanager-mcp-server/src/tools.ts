import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ConfirmationStore } from "./confirmationStore.js";
import {
  formatCandidates,
  formatConfirmedAction,
  formatInstances,
  formatInstanceStatus,
  formatNodes,
  formatOverview,
  formatPreparedAction,
  nodeDisplayName,
  toolText
} from "./format.js";
import { resolveInstance } from "./instanceResolver.js";
import { McsmClient } from "./mcsmClient.js";
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
  }
];

export class McsmToolHandlers {
  private readonly client: Pick<McsmClient, "getMonitorOverview" | "performInstanceAction">;
  private readonly confirmationStore: ConfirmationStore;

  constructor(
    config: AppConfig,
    client: Pick<McsmClient, "getMonitorOverview" | "performInstanceAction"> = new McsmClient(config)
  ) {
    this.client = client;
    this.confirmationStore = new ConfirmationStore(config.confirmationTtlMs);
  }

  async callTool(name: string, args: unknown) {
    try {
      switch (name) {
        case "mcsm_get_overview":
          return toolText(formatOverview(await this.client.getMonitorOverview()));
        case "mcsm_list_nodes":
          return toolText(formatNodes((await this.client.getMonitorOverview()).nodes));
        case "mcsm_list_instances":
          return toolText(formatInstances(filterInstances(await this.client.getMonitorOverview(), args)));
        case "mcsm_get_instance_status":
          return toolText(await this.getInstanceStatus(args));
        case "mcsm_prepare_instance_action":
          return toolText(await this.prepareInstanceAction(args));
        case "mcsm_confirm_instance_action":
          return toolText(await this.confirmInstanceAction(args));
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

  private async getInstanceStatus(args: unknown): Promise<string> {
    const overview = await this.client.getMonitorOverview();
    const result = resolveInstance(overview, readInstanceQuery(args));
    if (result.type === "found") return formatInstanceStatus(result.instance);
    if (result.type === "ambiguous") return formatCandidates(result.candidates);
    return "未找到匹配实例。请使用实例名称或 UUID 查询。";
  }

  private async prepareInstanceAction(args: unknown): Promise<string> {
    const input = readPrepareActionArgs(args);
    const overview = await this.client.getMonitorOverview();
    const result = resolveInstance(overview, input);
    if (result.type === "ambiguous") return formatCandidates(result.candidates);
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

function isInstanceAction(value: string): value is InstanceAction {
  return value === "start" || value === "stop" || value === "restart";
}
