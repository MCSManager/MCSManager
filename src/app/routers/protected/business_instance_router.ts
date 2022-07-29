// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import Koa from "koa";
import Router from "@koa/router";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import { check, login, logout, register, getUserUuid } from "../../service/passport_service";
import userSystem from "../../service/system_user";
import { ICompleteUser } from "../../entity/entity_interface";
import { getToken, isAjax } from "../../service/passport_service";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";
import { isHaveInstanceByUuid } from "../../service/permission_service";
import { $t } from "../../i18n";

const router = new Router({ prefix: "/protected_instance" });

// 路由权限验证中间件
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

// 更新有限实例信息（普通用户）
router.put(
  "/low_permission",
  permission({ level: 1 }),
  validator({ query: { uuid: String, remote_uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const config = ctx.request.body;
      // 用户数据过滤
      const believableConfig = {
        ie: String(config.ie),
        oe: String(config.oe),
        stopCommand: String(config.stopCommand)
      };
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/update", {
        instanceUuid,
        config: believableConfig
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
