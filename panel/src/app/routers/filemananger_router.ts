import Router from "@koa/router";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import RemoteServiceSubsystem from "../service/remote_service";
import RemoteRequest from "../service/remote_command";
import { timeUuid } from "../service/password";
import { getUserPermission, getUserUuid } from "../service/passport_service";
import { isHaveInstanceByUuid, isTopPermissionByUuid } from "../service/permission_service";
import { systemConfig } from "../setting";
import { $t } from "../i18n";
import { ROLE } from "../entity/user";
import { removeTrail } from "common";

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
  permission({ level: ROLE.USER, speedLimit: false }),
  validator({
    query: { daemonId: String, uuid: String, target: String, page: Number, page_size: Number }
  }),
  async (ctx) => {
    try {
      const target = String(ctx.query.target);
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const page = Number(ctx.query.page);
      const pageSize = Number(ctx.query.page_size);
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
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/copy",
  permission({ level: ROLE.USER }),
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

router.put(
  "/move",
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
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/compress",
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
  validator({ query: { uuid: String, daemonId: String, file_name: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const fileName = String(ctx.query.file_name);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const addr = `${remoteService?.config.ip}:${remoteService?.config.port}${
        remoteService?.config.prefix ? removeTrail(remoteService.config.prefix, "/") : ""
      }`;
      const password = timeUuid();
      await new RemoteRequest(remoteService).request("passport/register", {
        name: "download",
        password: password,
        parameter: {
          fileName,
          instanceUuid
        }
      });
      ctx.body = {
        password,
        addr
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
      const addr = `${remoteService?.config.ip}:${remoteService?.config.port}${
        remoteService?.config.prefix ? removeTrail(remoteService.config.prefix, "/") : ""
      }`;
      const password = timeUuid();
      await new RemoteRequest(remoteService).request("passport/register", {
        name: "upload",
        password: password,
        parameter: {
          uploadDir,
          instanceUuid
        }
      });
      ctx.body = {
        password,
        addr
      };
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
