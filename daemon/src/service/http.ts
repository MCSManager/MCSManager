import Koa from "koa";
import koaBody from "koa-body";

// Load the HTTP service route
import koaRouter from "../routers/http_router";

export function initKoa() {
  // Initialize the Koa framework
  const koaApp = new Koa();
  koaApp.use(
    koaBody({
      multipart: true,
      formidable: {
        maxFileSize: 1024 * 1024 * 1024 * 1000
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
