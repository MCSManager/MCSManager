import { createHash } from "crypto";
import { timingSafeEqual } from "node:crypto";
import { IGNORE } from "../const";
import { globalConfiguration } from "../entity/config";
import { $t } from "../i18n";
import logger from "../service/log";
import { LOGIN_BY_TOP_LEVEL, loginSuccessful } from "../service/mission_passport";
import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";

// latest verification time
const AUTH_TIMEOUT = 6000;

// Top-level authority authentication middleware (this is the first place for any authority authentication middleware)
routerApp.use(async (event, ctx, _, next) => {
  const socket = ctx.socket;
  // release all data flow controllers
  if (event.startsWith("stream")) return next();
  // Except for the auth controller, which is publicly accessible, other business controllers must be authorized before they can be accessed
  if (event === "auth") return await next();
  if (!ctx.session) throw new Error("Session does not exist in authentication middleware.");

  const date = new Date();
  const safe_token = "橙汁喵喵 香香软软 可可爱爱 不要超我" + "-" + globalConfiguration.config.key + "-" + date.getFullYear() + "/" + date.getMonth() + "/" + date.getDay() + "/" + date.getHours() + "/" + date.getMinutes();

  const hash = createHash('sha256');
  hash.update(safe_token);
  const safe_token_hash = hash.digest('hex');

  if (
    Uint8Array.from(ctx.session.key as string).length == Uint8Array.from(safe_token_hash).length &&
    timingSafeEqual(Uint8Array.from(ctx.session.key as string), Uint8Array.from(safe_token_hash)) &&
    ctx.session.type === LOGIN_BY_TOP_LEVEL &&
    ctx.session.login &&
    ctx.session.id
  ) {
    return await next();
  }
  logger.warn(
    $t("TXT_CODE_auth_router.notAccess", {
      id: socket.id,
      address: socket.handshake.address,
      event: event
    })
  );
  return protocol.error(ctx, "error", IGNORE, {
    disablePrint: true
  });
});

// authentication controller
routerApp.on("auth", (ctx, data) => {
  try {
    const date = new Date();
    const safe_token = "橙汁喵喵 香香软软 可可爱爱 不要超我" + "-" + globalConfiguration.config.key + "-" + date.getFullYear() + "/" + date.getMonth() + "/" + date.getDay() + "/" + date.getHours() + "/" + date.getMinutes();

    const hash = createHash('sha256');
    hash.update(safe_token);
    const safe_token_hash = hash.digest('hex');

    if (
      Uint8Array.from(data as string).length == Uint8Array.from(safe_token_hash).length &&
      timingSafeEqual(Uint8Array.from(data as string), Uint8Array.from(safe_token_hash))
    ) {
      // The authentication is passed, and the registered session is a trusted session
      logger.info(
        $t("TXT_CODE_auth_router.access", {
          id: ctx.socket.id,
          address: ctx.socket.handshake.address
        })
      );
      loginSuccessful(ctx, data);
      protocol.msg(ctx, "auth", true);
    } else {
      protocol.msg(ctx, "auth", false);
    }
  } catch (e) {
    protocol.msg(ctx, "auth", false);
  }
});

// Connected event for timeout authentication close
routerApp.on("connection", (ctx) => {
  const session = ctx.session;
  setTimeout(() => {
    if (!session.login) {
      ctx.socket.disconnect();
      logger.info(
        $t("TXT_CODE_auth_router.disconnect", {
          id: ctx.socket.id,
          address: ctx.socket.handshake.address
        })
      );
    }
  }, AUTH_TIMEOUT);
});
