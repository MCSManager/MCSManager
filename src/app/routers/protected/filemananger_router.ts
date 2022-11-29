// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import Router from "@koa/router";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";
import { timeUuid } from "../../service/password";
import { getUserPermission, getUserUuid } from "../../service/passport_service";
import { isHaveInstanceByUuid } from "../../service/permission_service";
import { systemConfig } from "../../setting";
import { $t } from "../../i18n";
const router = new Router({ prefix: "/files" });

router.use(async (ctx, next) => {
  const instanceUuid = String(ctx.query.uuid);
  const serviceUuid = String(ctx.query.remote_uuid);
  const userUuid = getUserUuid(ctx);
  if (systemConfig.canFileManager === false && getUserPermission(ctx) < 10) {
    ctx.status = 403;
    ctx.body = new Error($t("router.file.off"));
    return;
  }
  if (isHaveInstanceByUuid(userUuid, serviceUuid, instanceUuid)) {
    await next();
  } else {
    ctx.status = 403;
    ctx.body = $t("permission.forbiddenInstance");
  }
});

router.get(
  "/status",
  permission({ level: 1, speedLimit: false }),
  validator({
    query: { remote_uuid: String, uuid: String }
  }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("file/status", {
        instanceUuid
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.get(
  "/list",
  permission({ level: 1, speedLimit: false }),
  validator({
    query: { remote_uuid: String, uuid: String, target: String, page: Number, page_size: Number }
  }),
  async (ctx) => {
    try {
      const target = String(ctx.query.target);
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const page = Number(ctx.query.page);
      const pageSize = Number(ctx.query.page_size);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("file/list", {
        instanceUuid,
        target,
        pageSize,
        page
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/touch",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String }, body: { target: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const target = String(ctx.request.body.target);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String }, body: { target: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const target = String(ctx.request.body.target);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String }, body: { target: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const target = String(ctx.request.body.target);
      const text = ctx.request.body.text;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("file/edit", {
        instanceUuid,
        target,
        text
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/copy",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String }, body: { targets: Array } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const targets = ctx.request.body.targets as [];
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String }, body: { targets: Array } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const targets = ctx.request.body.targets as [];
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String }, body: { targets: Object } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = ctx.query.uuid;
      const targets = ctx.request.body.targets;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({
    query: { remote_uuid: String, uuid: String },
    body: { source: String, targets: Object, type: Number, code: String }
  }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const source = String(ctx.request.body.source);
      const targets = ctx.request.body.targets;
      const type = Number(ctx.request.body.type);
      const code = String(ctx.request.body.code);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      await new RemoteRequest(remoteService).request("file/compress", {
        instanceUuid,
        targets,
        source,
        type,
        code
      });
      ctx.body = true;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.all(
  "/download",
  permission({ level: 1 }),
  validator({ query: { uuid: String, remote_uuid: String, file_name: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const fileName = String(ctx.query.file_name);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const addr = `${remoteService.config.ip}:${remoteService.config.port}`;
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
  permission({ level: 1 }),
  validator({ query: { uuid: String, remote_uuid: String, upload_dir: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const uploadDir = String(ctx.query.upload_dir);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const addr = `${remoteService.config.ip}:${remoteService.config.port}`;
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
