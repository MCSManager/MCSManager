import Router from "@koa/router";
import { ROLE } from "../entity/user";
import { $t } from "../i18n";
import { speedLimit } from "../middleware/limit";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { operationLogger } from "../service/operation_logger";
import { getUserPermission, getUserUuid } from "../service/passport_service";
import { timeUuid } from "../service/password";
import { isHaveInstanceByUuid, isTopPermissionByUuid } from "../service/permission_service";
import RemoteRequest from "../service/remote_command";
import RemoteServiceSubsystem from "../service/remote_service";
import { systemConfig } from "../setting";

const router = new Router({ prefix: "/files" });

router.use(async (ctx, next) => {
  const instanceUuid = String(ctx.query.uuid);
  const daemonId = String(ctx.query.daemonId);
  const userUuid = getUserUuid(ctx);
  if (systemConfig?.canFileManager === false && getUserPermission(ctx) < 10) {
    ctx.status = 403;
    ctx.body = new Error($t("TXT_CODE_router.file.off"));
    return;
  }
  if (isHaveInstanceByUuid(userUuid, daemonId, instanceUuid)) {
    await next();
  } else {
    ctx.status = 403;
    ctx.body = $t("TXT_CODE_permission.forbiddenInstance");
  }
});

router.get(
  "/status",
  speedLimit(0.1),
  permission({ level: ROLE.USER, speedLimit: false }),
  validator({
    query: { daemonId: String, uuid: String }
  }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("file/status", {
        instanceUuid
      });
      if (!isTopPermissionByUuid(getUserUuid(ctx))) delete result.disk;
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.get(
  "/list",
  speedLimit(0.1),
  permission({ level: ROLE.USER, speedLimit: false }),
  validator({
    query: { daemonId: String, uuid: String, target: String, page: Number, page_size: Number }
  }),
  async (ctx) => {
    try {
      const target = String(ctx.query.target);
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const page = Math.max(0, Number(ctx.query.page) || 0);
      const pageSize = Math.min(100, Math.max(1, Number(ctx.query.page_size) || 10));
      const fileName = String(ctx.query.file_name);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("file/list", {
        instanceUuid,
        target,
        pageSize,
        page,
        fileName
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.put(
  "/chmod",
  permission({ level: ROLE.USER }),
  speedLimit(3),
  validator({
    query: { daemonId: String, uuid: String },
    body: { target: String, chmod: Number, deep: Boolean }
  }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const target = String(ctx.request.body.target);
      const chmod = Number(ctx.request.body.chmod);
      const deep = Number(ctx.request.body.deep);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("file/chmod", {
        target,
        instanceUuid,
        chmod,
        deep
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/touch",
  permission({ level: ROLE.USER }),
  speedLimit(3),
  validator({ query: { daemonId: String, uuid: String }, body: { target: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const target = String(ctx.request.body.target);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("file/touch", {
        target,
        instanceUuid
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/mkdir",
  permission({ level: ROLE.USER }),
  speedLimit(3),
  validator({ query: { daemonId: String, uuid: String }, body: { target: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const target = String(ctx.request.body.target);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("file/mkdir", {
        target,
        instanceUuid
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.put(
  "/",
  speedLimit(1),
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String }, body: { target: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const target = String(ctx.request.body.target);
      const text = ctx.request.body.text;
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request(
        "file/edit",
        {
          instanceUuid,
          target,
          text
        },
        100000
      );
      operationLogger.log("instance_file_update", {
        operator_ip: ctx.ip,
        operator_name: ctx.session?.["userName"],
        instance_id: instanceUuid,
        daemon_id: daemonId,
        file: target
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/copy",
  permission({ level: ROLE.USER }),
  speedLimit(3),
  validator({ query: { daemonId: String, uuid: String }, body: { targets: Array } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const targets = ctx.request.body.targets as [];
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("file/copy", {
        instanceUuid,
        targets
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/download_from_url",
  permission({ level: ROLE.USER }),
  speedLimit(3),
  validator({
    query: { uuid: String, daemonId: String },
    body: { url: String, file_name: String }
  }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const url = String(ctx.request.body.url);
      const fileName = String(ctx.request.body.file_name);

      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      if (!remoteService) throw new Error($t("TXT_CODE_dd559000") + ` Daemon ID: ${daemonId}`);

      const downloadId = timeUuid();
      ctx.body = downloadId;

      operationLogger.log("instance_file_download_from_url", {
        operator_ip: ctx.ip,
        operator_name: ctx.session?.["userName"],
        instance_id: instanceUuid,
        daemon_id: daemonId,
        url: url,
        fileName: fileName
      });

      await new RemoteRequest(remoteService).request("file/download_from_url", {
        url,
        fileName,
        instanceUuid
      });
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.put(
  "/move",
  speedLimit(3),
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String }, body: { targets: Array } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const targets = ctx.request.body.targets as [];
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("file/move", {
        instanceUuid,
        targets
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.delete(
  "/",
  speedLimit(3),
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String }, body: { targets: Object } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = ctx.query.uuid;
      const targets = ctx.request.body.targets;
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("file/delete", {
        instanceUuid,
        targets
      });
      operationLogger.log("instance_file_delete", {
        operator_ip: ctx.ip,
        operator_name: ctx.session?.["userName"],
        instance_id: String(instanceUuid),
        daemon_id: daemonId,
        file: targets
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/compress",
  speedLimit(3),
  permission({ level: ROLE.USER }),
  validator({
    query: { daemonId: String, uuid: String },
    body: { source: String, targets: Object, type: Number, code: String }
  }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const source = String(ctx.request.body.source);
      const targets = ctx.request.body.targets;
      const type = Number(ctx.request.body.type);
      const code = String(ctx.request.body.code);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const res = await new RemoteRequest(remoteService).request(
        "file/compress",
        {
          instanceUuid,
          targets,
          source,
          type,
          code
        },
        0
      );
      ctx.body = res;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.all(
  "/download",
  permission({ level: ROLE.USER }),
  speedLimit(3),
  validator({ query: { uuid: String, daemonId: String, file_name: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const fileName = String(ctx.query.file_name);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      if (!remoteService) throw new Error($t("TXT_CODE_dd559000") + ` Daemon ID: ${daemonId}`);
      const addr = remoteService.config.fullAddr;
      const remoteMappings = remoteService.config.getConvertedRemoteMappings();
      const password = timeUuid();
      await new RemoteRequest(remoteService).request("passport/register", {
        name: "download",
        password: password,
        parameter: {
          fileName,
          instanceUuid
        }
      });
      operationLogger.log("instance_file_download", {
        operator_ip: ctx.ip,
        operator_name: ctx.session?.["userName"],
        instance_id: instanceUuid,
        daemon_id: daemonId,
        file: fileName
      });
      ctx.body = {
        password,
        addr,
        remoteMappings
      };
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.all(
  "/upload",
  permission({ level: ROLE.USER }),
  validator({ query: { uuid: String, daemonId: String, upload_dir: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const uploadDir = String(ctx.query.upload_dir);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      if (!remoteService) throw new Error($t("TXT_CODE_dd559000") + ` Daemon ID: ${daemonId}`);
      const addr = remoteService.config.fullAddr;
      const remoteMappings = remoteService.config.getConvertedRemoteMappings();
      const password = timeUuid();
      await new RemoteRequest(remoteService).request("passport/register", {
        name: "upload",
        password: password,
        parameter: {
          uploadDir,
          instanceUuid
        }
      });
      operationLogger.log("instance_file_upload", {
        operator_ip: ctx.ip,
        operator_name: ctx.session?.["userName"],
        instance_id: instanceUuid,
        daemon_id: daemonId
      });
      ctx.body = {
        password,
        addr,
        remoteMappings
      };
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
