// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import Router from "@koa/router";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import { getUserUuid } from "../../service/passport_service";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";
import { isHaveInstanceByUuid } from "../../service/permission_service";
import { $t } from "../../i18n";

const router = new Router({ prefix: "/protected_instance" });

// Routing permission verification middleware
router.use(async (ctx, next) => {
  const instanceUuid = String(ctx.query.uuid);
  const serviceUuid = String(ctx.query.remote_uuid);
  const userUuid = getUserUuid(ctx);
  if (isHaveInstanceByUuid(userUuid, serviceUuid, instanceUuid)) {
    await next();
  } else {
    ctx.status = 403;
    ctx.body = $t("permission.forbiddenInstance");
  }
});

// Update limited instance information (normal users)
router.put(
  "/low_permission",
  permission({ level: 1 }),
  validator({ query: { uuid: String, remote_uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const config = ctx.request.body;
      // User data filter
      const believableConfig = {
        ie: String(config.ie),
        oe: String(config.oe),
        stopCommand: String(config.stopCommand)
      };
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
