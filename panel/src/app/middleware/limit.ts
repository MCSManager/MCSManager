import { Context } from "koa";
import { $t } from "../i18n";
import { singletonMemoryRedis } from "../service/mini_redis";
import userSystem from "../service/user_service";

const SPEED_LIMIT_KEY = "SpeedLimit";

export function speedLimit(seconds: number, errMsg?: string) {
  return async (ctx: Context, next: Function) => {
    const requestPath = ctx.URL.pathname;
    const user = userSystem.getInstance(ctx.session?.["uuid"]);

    if (!user) {
      throw new Error($t("TXT_CODE_permission.forbidden"));
    }

    const speedCheckKey = `${SPEED_LIMIT_KEY}:${user.uuid}:${requestPath}`;
    const isExist = singletonMemoryRedis.get<boolean>(speedCheckKey);

    if (isExist) {
      ctx.status = 500;
      ctx.body =
        errMsg ||
        $t("此操作冷却中，约 {{seconds}} 秒后可继续操作！", {
          seconds: singletonMemoryRedis.ttl(speedCheckKey)
        });
      return;
    }

    singletonMemoryRedis.set(speedCheckKey, true, seconds);
    return await next();
  };
}
