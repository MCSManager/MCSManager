import Router from "@koa/router";
import { ROLE } from "../entity/user";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { operationLogger } from "../service/operation_logger";
import RemoteRequest from "../service/remote_command";
import RemoteServiceSubsystem from "../service/remote_service";

const router = new Router({ prefix: "/service" });
const ALL_REMOTE_NODES_ID = "__all__";

// [Top-level Permission]
// Get the list of remote services
// Contains only service information, not a list of instance information
router.get("/remote_services_list", permission({ level: ROLE.ADMIN }), async (ctx) => {
  const result = new Array();
  for (const iterator of RemoteServiceSubsystem.services.entries()) {
    const remoteService = iterator[1];
    result.push({
      uuid: remoteService.uuid,
      ip: remoteService.config.ip,
      port: remoteService.config.port,
      prefix: remoteService.config.prefix,
      available: remoteService.available,
      remarks: remoteService.config.remarks
    });
  }
  ctx.body = result;
});

// [Top-level Permission]
// Query the daemon for the specified instance
router.get(
  "/remote_service_instances",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String, page: Number, page_size: Number } }),
  async (ctx) => {
    const daemonId = String(ctx.query.daemonId);
    const page = Math.max(1, Number(ctx.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(ctx.query.page_size) || 10));
    const instanceName = ctx.query.instance_name;
    const status = ctx.query.status;
    const tag = String(ctx.query.tag);
    let tagList: string[] = [];
    try {
      tagList = JSON.parse(tag);
    } catch (error) {
      // ignore
    }
    const condition = {
      instanceName,
      status,
      tag: tagList.length > 0 ? tagList : null
    };

    if (!daemonId || daemonId === ALL_REMOTE_NODES_ID) {
      const data: any[] = [];
      const allTags: string[] = [];

      for (const remoteService of RemoteServiceSubsystem.services.values()) {
        try {
          const result = await new RemoteRequest(remoteService).request("instance/select", {
            page: 1,
            pageSize: Number.MAX_SAFE_INTEGER,
            condition
          });
          if (Array.isArray(result?.allTags)) allTags.push(...result.allTags);
          for (const instance of result?.data || []) {
            data.push(withDaemonInfo(instance, remoteService));
          }
        } catch (err) {
          // keep other nodes visible when one daemon is offline
        }
      }

      data.sort(sortInstanceDetail);
      const start = (page - 1) * pageSize;
      ctx.body = {
        page,
        pageSize,
        maxPage: data.length === 0 ? 0 : Math.ceil(data.length / pageSize),
        allTags: uniqueStrings(allTags).slice(0, 60),
        data: data.slice(start, start + pageSize)
      };
      return;
    }

    const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
    const result = await new RemoteRequest(remoteService).request("instance/select", {
      page,
      pageSize,
      condition
    });
    ctx.body = {
      ...result,
      data: Array.isArray(result?.data)
        ? result.data.map((instance: any) => withDaemonInfo(instance, remoteService))
        : []
    };
  }
);

function withDaemonInfo(instance: any, remoteService: any) {
  return {
    ...instance,
    daemonId: remoteService.uuid,
    daemonIp: remoteService.config.ip,
    daemonPort: remoteService.config.port,
    daemonPrefix: remoteService.config.prefix,
    daemonRemarks: remoteService.config.remarks,
    daemonAvailable: remoteService.available
  };
}

function sortInstanceDetail(a: any, b: any) {
  const daemonA = getDaemonSortKey(a);
  const daemonB = getDaemonSortKey(b);
  const daemonCompare = daemonA.localeCompare(daemonB);
  if (daemonCompare !== 0) return daemonCompare;

  const statusA = Number(a?.status ?? 0);
  const statusB = Number(b?.status ?? 0);
  if (statusA !== statusB) return statusB - statusA;
  const nameA = String(a?.config?.nickname ?? "");
  const nameB = String(b?.config?.nickname ?? "");
  return nameA.localeCompare(nameB);
}

function getDaemonSortKey(instance: any) {
  const remarks = String(instance?.daemonRemarks ?? "");
  const ip = String(instance?.daemonIp ?? "");
  const port = String(instance?.daemonPort ?? "");
  const daemonId = String(instance?.daemonId ?? "");
  return `${remarks}\0${ip}:${port}\0${daemonId}`;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => String(value)).filter(Boolean))];
}

// [Top-level Permission]
// Get remote server system information
router.get("/remote_services_system", permission({ level: ROLE.ADMIN }), async (ctx) => {
  const result = new Array();
  for (const iterator of RemoteServiceSubsystem.services.entries()) {
    const remoteService = iterator[1];
    let instancesInfo = null;
    try {
      instancesInfo = await new RemoteRequest(remoteService).request("info/overview");
    } catch (err) {
      continue;
    }
    result.push(instancesInfo);
  }
  ctx.body = result;
});

// [Top-level Permission]
// Get remote server instance information (browse too large)
router.get("/remote_services", permission({ level: ROLE.ADMIN }), async (ctx) => {
  const result = new Array();
  for (const iterator of RemoteServiceSubsystem.services.entries()) {
    const remoteService = iterator[1];
    let instancesInfo = [];
    try {
      instancesInfo = await new RemoteRequest(remoteService).request("instance/overview");
    } catch (err) {
      // ignore request errors
    }
    // send remote command if connection is available
    result.push({
      uuid: remoteService.uuid,
      ip: remoteService.config.ip,
      port: remoteService.config.port,
      prefix: remoteService.config.prefix,
      available: remoteService.available,
      remarks: remoteService.config.remarks,
      instances: instancesInfo
    });
  }
  ctx.body = result;
});

// [Top-level Permission]
// add remote service
router.post(
  "/remote_service",
  permission({ level: ROLE.ADMIN }),
  validator({ body: { apiKey: String, port: Number, ip: String, remarks: String } }),
  async (ctx) => {
    const parameter = ctx.request.body;
    // do asynchronous registration
    const instance = await RemoteServiceSubsystem.registerRemoteService({
      apiKey: parameter.apiKey,
      port: parameter.port,
      ip: parameter.ip,
      prefix: parameter.prefix ?? "",
      remarks: parameter.remarks ?? ""
    });

    operationLogger.log("daemon_create", {
      operator_ip: ctx.ip,
      operator_name: ctx.session?.["userName"],
      daemon_id: instance.uuid
    });

    ctx.body = instance.uuid;
  }
);

// [Top-level Permission]
// Modify remote service parameters
router.put(
  "/remote_service",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { uuid: String } }),
  async (ctx) => {
    const uuid = String(ctx.request.query.uuid);
    const parameter = ctx.request.body || {};
    const daemonSetting = parameter?.setting || {};
    const daemon = RemoteServiceSubsystem.getInstance(uuid);

    if (daemonSetting && daemon?.available) {
      await new RemoteRequest(daemon).request("info/setting", {
        ...daemonSetting,
        port: parameter.daemonPort
      });
    }

    if (!RemoteServiceSubsystem.services.has(uuid)) throw new Error("Instance does not exist");

    await RemoteServiceSubsystem.edit(uuid, {
      port: parameter.port,
      ip: parameter.ip,
      prefix: parameter.prefix ?? "",
      apiKey: parameter.apiKey,
      remarks: parameter.remarks,
      remoteMappings: parameter.remoteMappings ?? [],
    });

    operationLogger.log("daemon_config_change", {
      operator_ip: ctx.ip,
      operator_name: ctx.session?.["userName"],
      daemon_id: uuid
    });

    ctx.body = true;
  }
);

// [Top-level Permission]
// delete remote service
router.delete(
  "/remote_service",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { uuid: String } }),
  async (ctx) => {
    const uuid = String(ctx.request.query.uuid);
    if (!RemoteServiceSubsystem.services.has(uuid)) throw new Error("Instance does not exist");
    await RemoteServiceSubsystem.deleteRemoteService(uuid);
    operationLogger.log("daemon_remove", {
      operator_ip: ctx.ip,
      operator_name: ctx.session?.["userName"],
      daemon_id: uuid
    });
    ctx.body = true;
  }
);

// [Top-level Permission]
// connect to remote instance
router.get(
  "/link_remote_service",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { uuid: String } }),
  async (ctx) => {
    const uuid = String(ctx.request.query.uuid);
    if (!RemoteServiceSubsystem.services.has(uuid)) throw new Error("Instance does not exist");
    try {
      RemoteServiceSubsystem.getInstance(uuid)?.connect();
      ctx.body = true;
    } catch (error: any) {
      ctx.body = error;
    }
  }
);

export default router;
