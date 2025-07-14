import Router from "@koa/router";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import RemoteServiceSubsystem from "../service/remote_service";
import RemoteRequest from "../service/remote_command";
import { ROLE } from "../entity/user";
import { operationLogger } from "../service/operation_logger";

const router = new Router({ prefix: "/service" });

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
    const page = Number(ctx.query.page);
    const pageSize = Number(ctx.query.page_size);
    const instanceName = ctx.query.instance_name;
    const status = ctx.query.status;
    const tag = String(ctx.query.tag);
    const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
    let tagList: string[] = [];
    try {
      tagList = JSON.parse(tag);
    } catch (error) {
      // ignore
    }
    const result = await new RemoteRequest(remoteService).request("instance/select", {
      page,
      pageSize,
      condition: {
        instanceName,
        status,
        tag: tagList.length > 0 ? tagList : null
      }
    });
    ctx.body = result;
  }
);

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
    const parameter = ctx.request.body;
    if (!RemoteServiceSubsystem.services.has(uuid)) throw new Error("Instance does not exist");
    await RemoteServiceSubsystem.edit(uuid, {
      port: parameter.port,
      ip: parameter.ip,
      prefix: parameter.prefix ?? "",
      apiKey: parameter.apiKey,
      remarks: parameter.remarks
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
