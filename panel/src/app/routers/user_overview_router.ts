import Router from "@koa/router";
import Koa from "koa";
import { diffConfig } from "../common/config_diff";
import { ICompleteUser } from "../entity/entity_interface";
import { ROLE } from "../entity/user";
import { $t } from "../i18n";
import permission from "../middleware/permission";
import { getOperationLoggerOperator, operationLogger } from "../service/operation_logger";
import userSystem from "../service/user_service";

const router = new Router({ prefix: "/auth" });

// [Top-level Permission]
router.put("/", permission({ level: ROLE.ADMIN }), async (ctx: Koa.ParameterizedContext) => {
  const { uuid, config } = ctx.request.body;
  const { passWord } = config;
  if (passWord && !userSystem.validatePassword(passWord))
    throw new Error($t("TXT_CODE_router.user.passwordCheck"));
  try {
    // If the administrator resets the user's password, 2FA is automatically turned off.
    if (passWord) {
      config.secret = "";
      config.open2FA = false;
    }

    const snapshotUserConfig = (userUuid: string) => {
      const user = userSystem.getInstance(userUuid);
      if (!user) return null;
      const copy = JSON.parse(JSON.stringify(user));
      delete copy.passWord;
      delete copy.passWordType;
      delete copy.salt;
      delete copy.secret;
      delete copy.apiKey;
      return copy;
    };

    const userBefore = snapshotUserConfig(uuid);
    await userSystem.edit(uuid, config);
    const userAfter = snapshotUserConfig(uuid);

    const diff = diffConfig(userBefore, userAfter);
    if (diff || passWord) {
      operationLogger.log(
        "user_config_change",
        {
          ...getOperationLoggerOperator(ctx),
          target_user_name: userBefore?.userName,
          password_reset: passWord ? true : undefined,
          config_before: diff?.before,
          config_after: diff?.after
        },
        "warning"
      );
    }
    ctx.body = true;
  } catch (error: any) {
    ctx.throw(500, error.message);
  }
});

// [Top-level Permission]
router.get(
  "/overview",
  permission({ level: ROLE.ADMIN }),
  async (ctx: Koa.ParameterizedContext) => {
    const users: Array<ICompleteUser> = [];
    userSystem.objects.forEach((user) => {
      users.push({
        uuid: user.uuid,
        userName: user.userName,
        permission: user.permission,
        instances: user.instances,
        loginTime: user.loginTime,
        registerTime: user.loginTime
      });
    });
    ctx.body = users;
  }
);

export default router;
