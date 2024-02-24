import Router from "@koa/router";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { getUserUuid } from "../service/passport_service";
import RemoteServiceSubsystem from "../service/remote_service";
import RemoteRequest from "../service/remote_command";
import { isHaveInstanceByUuid } from "../service/permission_service";
import { $t } from "../i18n";
import { ROLE } from "../entity/user";

const router = new Router({ prefix: "/protected_instance" });

// Routing permission verification middleware
router.use(async (ctx, next) => {
  const instanceUuid = String(ctx.query.uuid);
  const daemonId = String(ctx.query.daemonId);
  const userUuid = getUserUuid(ctx);
  if (isHaveInstanceByUuid(userUuid, daemonId, instanceUuid)) {
    await next();
  } else {
    ctx.status = 403;
    ctx.body = $t("TXT_CODE_permission.forbiddenInstance");
  }
});

// Update limited instance information (normal users)
router.put(
  "/low_permission",
  permission({ level: ROLE.USER }),
  validator({ query: { uuid: String, daemonId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const config = ctx.request.body;
      // User data filter
      const believableConfig = {
        ie: String(config.ie),
        oe: String(config.oe),
        stopCommand: String(config.stopCommand)
      };
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      ctx.body = await new RemoteRequest(remoteService).request("instance/update", {
        instanceUuid,
        config: believableConfig
      });
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
