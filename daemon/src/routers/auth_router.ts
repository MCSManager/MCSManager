import { $t } from "../i18n";
import { routerApp } from "../service/router";
import * as protocol from "../service/protocol";
import { globalConfiguration } from "../entity/config";
import logger from "../service/log";
import RouterContext from "../entity/ctx";
import { IGNORE } from "../const";

// latest verification time
const AUTH_TIMEOUT = 6000;
// authentication type identifier
const TOP_LEVEL = "TOP_LEVEL";

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
    ctx.session.type === TOP_LEVEL &&
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
  return protocol.error(ctx, "error", IGNORE);
});

// log output middleware
// routerApp.use((event, ctx, data, next) => {
// try {
// const socket = ctx.socket;
// logger.info(`Received ${event} command from ${socket.id}(${socket.handshake.address}).`);
// logger.info(` - data: ${JSON.stringify(data)}.`);
// } catch (err) {
// logger.error("Logging error:", err);
// } finally {
// next();
// }
// });

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

// This function must be executed after successful login
function loginSuccessful(ctx: RouterContext, data: string) {
  ctx.session.key = data;
  ctx.session.login = true;
  ctx.session.id = ctx.socket.id;
  ctx.session.type = TOP_LEVEL;
  return ctx.session;
}
