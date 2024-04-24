import { $t } from "../i18n";
import { routerApp } from "../service/router";
import * as protocol from "../service/protocol";
import { globalConfiguration } from "../entity/config";
import logger from "../service/log";
import RouterContext from "../entity/ctx";
import { IGNORE } from "../const";
import { LOGIN_BY_TOP_LEVEL, loginSuccessful } from "../service/mission_passport";

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
  if (
    ctx.session.key === globalConfiguration.config.key &&
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
  if (data === globalConfiguration.config.key) {
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
