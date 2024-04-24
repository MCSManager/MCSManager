import Koa from "koa";
import koaBody from "koa-body-patch";
import koaRouter from "../routers/http_router";
import logger from "./log";
import { globalConfiguration } from "../entity/config";
import { removeTrail } from "common";

export function initKoa() {
  const koaApp = new Koa();
  const config = globalConfiguration.config;
  koaApp.use(
    koaBody({
      multipart: true,
      formidable: {
        maxFieldsSize: Number.MAX_SAFE_INTEGER,
        maxFileSize: Number.MAX_SAFE_INTEGER,
        maxFiles: 1
      },
      onError(err, ctx) {
        logger.error("koaBody Lib Error:", err);
      }
    })
  );
  // Load Koa top-level middleware
  koaApp.use(async (ctx, next) => {
    await next();
    // Because all HTTP requests can only be used by creating a task passport on the panel side, cross-domain requests are allowed, and security can also be guaranteed
    ctx.response.set("Access-Control-Allow-Origin", "*");
    ctx.response.set("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    ctx.response.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Cookie, Accept-Encoding, User-Agent, Host, Referer, " +
        "X-Requested-With, Accept, Accept-Language, Cache-Control, Connection"
    );
    ctx.response.set("X-Power-by", "MCSManager");
  });

  if (config.prefix != "") {
    const prefix = config.prefix;
    koaApp.use(async (ctx, next) => {
      if (ctx.url.startsWith(prefix)) {
        const orig = ctx.url;
        ctx.url = ctx.url.slice(prefix.length);
        if (!ctx.url.startsWith("/")) {
          ctx.url = "/" + ctx.url;
        }
        await next();
        ctx.url = orig;
      } else {
        ctx.redirect(removeTrail(prefix, "/") + ctx.url);
      }
    });
  }
  koaApp.use(koaRouter.routes()).use(koaRouter.allowedMethods());
  return koaApp;
}
