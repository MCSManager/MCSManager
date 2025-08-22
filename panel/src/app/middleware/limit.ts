import { Context } from "koa";
import { ROLE } from "../entity/user";
import { $t } from "../i18n";
import { singletonMemoryRedis } from "../service/mini_redis";
import { getUserFromCtx } from "../service/passport_service";

const SPEED_LIMIT_KEY = "SpeedLimit";

export function speedLimit(seconds: number, errMsg?: string) {
  return async (ctx: Context, next: Function) => {
    const requestPath = ctx.URL.pathname;
    const user = getUserFromCtx(ctx);

    if (!user) throw new Error($t("TXT_CODE_permission.forbidden"));

    if (user.permission === ROLE.ADMIN) {
      return await next();
    }

    const speedCheckKey = `${SPEED_LIMIT_KEY}:${user.uuid}:${requestPath}`;
    const isExist = singletonMemoryRedis.get<boolean>(speedCheckKey);

    if (isExist) {
      ctx.status = 500;
      ctx.body =
        errMsg ||
        $t("TXT_CODE_c093bec9", {
          seconds: singletonMemoryRedis.ttl(speedCheckKey)
        });
      return;
    }

    singletonMemoryRedis.set(speedCheckKey, true, seconds);
    return await next();
  };
}
