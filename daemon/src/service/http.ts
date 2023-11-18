import Koa from "koa";
import koaBody from "koa-body";
import koaRouter from "../routers/http_router";
import logger from "./log";

export function initKoa() {
  const koaApp = new Koa();
  koaApp.use(
    koaBody({
      multipart: true,
      formidable: {
        maxFieldsSize: Number.MAX_VALUE,
        maxFileSize: Number.MAX_VALUE
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
  koaApp.use(koaRouter.routes()).use(koaRouter.allowedMethods());
  return koaApp;
}
