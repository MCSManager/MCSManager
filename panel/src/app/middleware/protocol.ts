import Koa from "koa";
import { Stream } from "stream";
import VisualDataSubsystem from "../service/visual_data";
import { systemConfig } from "../setting";
import { getVersion } from "../version";

// Define standard response data format middleware
export async function middleware(
  ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext, any>,
  next: Function
): Promise<void> {
  // Increase the number of interface requests
  if (ctx.url.startsWith("/api/")) {
    VisualDataSubsystem.addRequestCount();
  }

  // Compatible with version 9.X API parameters
  if (ctx.query?.remote_uuid) ctx.query.daemonId = ctx.query.remote_uuid;
  if (ctx.query?.daemon_id) ctx.query.daemonId = ctx.query.daemon_id;

  // Pass the next middleware, any errors and return data will be processed according to the response protocol
  try {
    await next();
  } catch (error: any) {
    ctx.body = error;
  }

  if (systemConfig?.crossDomain) {
    ctx.response.set("Access-Control-Allow-Origin", "*");
    ctx.response.set("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
    ctx.response.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Content-Length, Authorization, Accept, X-Requested-With"
    );
  }
  ctx.response.set("X-Powered-By", "MCSManager");
  ctx.response.set("X-Version", getVersion());

  // Serialize and display when sending Error class
  if (ctx.body instanceof Error) {
    const error = ctx.body as Error;
    ctx.status = 500;
    ctx.body = JSON.stringify({
      status: ctx.status,
      data: error.message,
      time: new Date().getTime()
    });
    return;
  }

  // release all data streams
  if (ctx.body instanceof Stream) {
    return;
  }

  // 404 error code
  if (ctx.status == 404) {
    ctx.status = 404;
    ctx.body = JSON.stringify({
      status: ctx.status,
      data: "[404] Not Found",
      time: new Date().getTime()
    });
    return;
  }

  // When the response text is a string, use normal formatting
  if (typeof ctx.body == "string") {
    const status = ctx.status;
    const data = ctx.body;
    ctx.body = JSON.stringify({
      status,
      data,
      time: new Date().getTime()
    });
    return;
  }

  // When the return result is empty, display processing failed
  if (ctx.body === null || ctx.body === false || ctx.body === undefined) {
    ctx.status = 500;
    ctx.body = JSON.stringify({
      status: 500,
      data: ctx.body || null,
      time: new Date().getTime()
    });
    return;
  }

  // normal data
  if (ctx.status == 200) {
    ctx.body = JSON.stringify({
      status: ctx.status,
      data: ctx.body,
      time: new Date().getTime()
    });
    return;
  }
}
