import Router from "@koa/router";
import { ROLE } from "../entity/user";
import { $t } from "../i18n";
import { requestConcurrencyLimiter, speedLimit } from "../middleware/limit";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { modManagerService } from "../service/mod_manager_service";
import { getUserPermission, getUserUuid } from "../service/passport_service";
import { isHaveInstanceByUuid } from "../service/permission_service";
import RemoteRequest from "../service/remote_command";
import RemoteServiceSubsystem from "../service/remote_service";
import { systemConfig } from "../setting";
import { checkSafeUrl } from "../utils/url";

const router = new Router({ prefix: "/mod" });

// Permission check middleware
router.use(async (ctx, next) => {
  if (
    ctx.path === "/mod/mc_versions" ||
    ctx.path === "/mod/search" ||
    ctx.path === "/mod/info" ||
    ctx.path === "/mod/batch_info"
  ) {
    return await next();
  }

  const instanceUuid = String(ctx.query.uuid || ctx.request.body?.uuid);
  const daemonId = String(ctx.query.daemonId || ctx.request.body?.daemonId);
  const userUuid = getUserUuid(ctx);

  // Check global file manager setting
  if (systemConfig?.canFileManager === false && getUserPermission(ctx) < 10) {
    ctx.status = 403;
    ctx.body = new Error($t("TXT_CODE_router.file.off"));
    return;
  }

  // Check instance access
  if (instanceUuid && daemonId) {
    if (isHaveInstanceByUuid(userUuid, daemonId, instanceUuid)) {
      await next();
    } else {
      ctx.status = 403;
      ctx.body = $t("TXT_CODE_permission.forbiddenInstance");
    }
  } else {
    await next();
  }
});

router.get("/mc_versions", speedLimit(0.5), permission({ level: ROLE.USER }), async (ctx) => {
  try {
    const result = await modManagerService.getMinecraftVersions();
    ctx.body = result;
  } catch (err) {
    ctx.body = err;
  }
});

router.get(
  "/list",
  speedLimit(0.5),
  permission({ level: ROLE.USER }),
  validator({
    query: { daemonId: String, uuid: String }
  }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const page = Math.max(1, Number(ctx.query.page) || 1);
      const pageSize = Math.min(50, Math.max(1, Number(ctx.query.pageSize) || 50));
      const folder = ctx.query.folder ? String(ctx.query.folder) : undefined;
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("instance/mods/list", {
        instanceUuid,
        page,
        pageSize,
        folder: folder || ""
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.get(
  "/info",
  speedLimit(0.5),
  permission({ level: ROLE.USER }),
  validator({
    query: { hash: String }
  }),

  async (ctx) => {
    try {
      const hash = String(ctx.query.hash);
      const result = await modManagerService.getInfoByHash(hash);
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.get(
  "/search",
  permission({ level: ROLE.USER }),
  requestConcurrencyLimiter("mod_manager:search"),
  async (ctx) => {
    try {
      const query = String(ctx.query.query || "");
      const offset = Number(ctx.query.offset) || 0;
      const limit = Number(ctx.query.limit) || 20;
      const source = String(ctx.query.source || "all");
      const version = String(ctx.query.version || "");
      const type = String(ctx.query.type || "all");
      const loader = String(ctx.query.loader || "all");
      const environment = String(ctx.query.environment || "all");

      if (offset < 0 || offset > 100000) {
        throw new Error("Offset must be between 0 and 100000");
      }
      if (limit < 1 || limit > 50) {
        throw new Error("Limit must be between 1 and 50");
      }

      const result = await modManagerService.searchProjects(query, offset, limit, {
        source,
        version,
        type,
        loader,
        environment
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.get(
  "/versions",
  speedLimit(1),
  permission({ level: ROLE.USER }),
  validator({
    query: { projectId: String, source: String }
  }),
  async (ctx) => {
    try {
      const projectId = String(ctx.query.projectId);
      const source = String(ctx.query.source || "Modrinth");
      const result = await modManagerService.getProjectVersions(projectId, source);
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/download",
  permission({ level: ROLE.USER }),
  speedLimit(5),
  requestConcurrencyLimiter("mod_manager:download"),
  validator({
    body: {
      daemonId: String,
      uuid: String,
      url: String,
      fileName: String,
      projectType: String
    }
  }),
  async (ctx) => {
    try {
      const { daemonId, uuid, url, fileName, projectType, fallbackUrl, extraInfo } =
        ctx.request.body;

      // Validate URL to prevent SSRF attacks
      if (!checkSafeUrl(url)) {
        ctx.status = 400;
        ctx.body = new Error("Invalid or unsafe URL");
        return;
      }

      // Validate fallbackUrl if provided
      if (fallbackUrl && !checkSafeUrl(fallbackUrl)) {
        ctx.status = 400;
        ctx.body = new Error("Invalid or unsafe fallback URL");
        return;
      }

      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("instance/mods/install", {
        instanceUuid: uuid,
        url,
        fileName,
        type: projectType,
        fallbackUrl,
        extraInfo
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/stop_transfer",
  speedLimit(1),
  permission({ level: ROLE.USER }),
  validator({
    body: { daemonId: String, uuid: String, fileName: String, type: String }
  }),
  async (ctx) => {
    try {
      const { daemonId, uuid, fileName, type, uploadId } = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      if (type === "download") {
        const result = await new RemoteRequest(remoteService).request("file/download_stop", {
          instanceUuid: uuid,
          fileName
        });
        ctx.body = result;
      } else {
        // Upload stop is handled by deleting the file or specific upload task
        const result = await new RemoteRequest(remoteService).request("file/delete", {
          instanceUuid: uuid,
          targets: [fileName]
        });
        ctx.body = result;
      }
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.get(
  "/config_files",
  speedLimit(0.5),
  permission({ level: ROLE.USER }),
  validator({
    query: { daemonId: String, uuid: String, modId: String, type: String, fileName: String }
  }),
  async (ctx) => {
    try {
      const { daemonId, uuid, modId, type, fileName } = ctx.query;
      const remoteService = RemoteServiceSubsystem.getInstance(String(daemonId));
      const result = await new RemoteRequest(remoteService).request("instance/mods/config_files", {
        instanceUuid: uuid,
        modId,
        type,
        fileName
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/toggle",
  speedLimit(0.5),
  permission({ level: ROLE.USER }),
  validator({
    body: { daemonId: String, uuid: String, fileName: String }
  }),
  async (ctx) => {
    try {
      const { daemonId, uuid, fileName } = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("instance/mods/toggle", {
        instanceUuid: uuid,
        fileName
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/delete",
  speedLimit(1),
  permission({ level: ROLE.USER }),
  validator({
    body: { daemonId: String, uuid: String, fileName: String }
  }),
  async (ctx) => {
    try {
      const { daemonId, uuid, fileName } = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("instance/mods/delete", {
        instanceUuid: uuid,
        fileName
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.post(
  "/batch_info",
  speedLimit(0.1),
  permission({ level: ROLE.USER }),
  validator({
    body: { hashes: Array }
  }),
  async (ctx) => {
    try {
      const hashes = ctx.request.body.hashes as string[];
      const result = await modManagerService.getInfosByHashes(hashes);
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
