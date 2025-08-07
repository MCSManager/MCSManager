import { Context } from "koa";
import { $t } from "../i18n";
import { keyValueStore } from "../service/Kv_store";
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
    const isExist = keyValueStore.get<boolean>(speedCheckKey);

    if (isExist) {
      ctx.status = 500;
      ctx.body = errMsg || $t("操作过于频繁，请慢一点操作");
      return;
    }

    keyValueStore.set(speedCheckKey, true, seconds);
    return await next();
  };
}
