import type { Context, Middleware, Next } from "koa";
import RemoteServiceSubsystem from "./remote_service";
import { getUserFromCtx } from "./passport_service";
import { logger } from "./log";
import {
  buildUpstreamUrl,
  DAEMON_HTTP_PROXY_PREFIX,
  filterRequestHeaders,
  filterResponseHeaders,
  parseDaemonProxyPath,
  pickHttpModule
} from "./daemon_proxy_utils";

function isAuthenticated(ctx: Context): boolean {
  const user = getUserFromCtx(ctx as any);
  return !!(user && typeof user.permission === "number" && user.permission >= 1);
}

function sendPlain(ctx: Context, status: number, message: string) {
  ctx.status = status;
  ctx.type = "text/plain";
  ctx.body = message;
}

/**
 * Streaming reverse proxy: Browser → Panel → Daemon HTTP.
 * Must run after session middleware and before koa-body so upload bodies are not buffered.
 */
export const daemonHttpProxyMiddleware: Middleware = async (ctx: Context, next: Next) => {
  const pathname = ctx.path || ctx.URL.pathname;
  if (!pathname.startsWith(DAEMON_HTTP_PROXY_PREFIX)) {
    return await next();
  }

  // CORS preflight for same-site tools; still require auth for real methods
  if (ctx.method === "OPTIONS") {
    ctx.status = 204;
    ctx.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    ctx.set("Access-Control-Allow-Headers", "Content-Type, X-Requested-With, Cookie");
    return;
  }

  if (!isAuthenticated(ctx)) {
    return sendPlain(ctx, 403, "Access denied: login required");
  }

  const parsed = parseDaemonProxyPath(pathname);
  if (!parsed) {
    return sendPlain(ctx, 400, "Invalid daemon proxy path");
  }

  const remote = RemoteServiceSubsystem.getInstance(parsed.daemonId);
  if (!remote) {
    return sendPlain(ctx, 404, `Daemon not found: ${parsed.daemonId}`);
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = buildUpstreamUrl(remote, parsed.restPath, ctx.search || "");
  } catch (err: any) {
    logger.warn(`[daemon-proxy] bad upstream URL for ${parsed.daemonId}: ${err?.message}`);
    return sendPlain(ctx, 502, "Bad daemon address");
  }

  // Stream the raw Node request/response; do not use Koa body serialization
  ctx.respond = false;
  const req = ctx.req;
  const res = ctx.res;

  const headers = filterRequestHeaders(req.headers);
  headers["host"] = upstreamUrl.host;

  const lib = pickHttpModule(upstreamUrl);
  const proxyReq = lib.request(
    {
      protocol: upstreamUrl.protocol,
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port,
      path: upstreamUrl.pathname + upstreamUrl.search,
      method: req.method,
      headers,
      rejectUnauthorized: false,
      timeout: 0
    },
    (proxyRes) => {
      const outHeaders = filterResponseHeaders(proxyRes.headers);
      res.writeHead(proxyRes.statusCode || 502, outHeaders as any);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("timeout", () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      res.writeHead(504, { "Content-Type": "text/plain" });
      res.end("Daemon proxy timeout");
    } else {
      res.destroy();
    }
  });

  proxyReq.on("error", (err) => {
    logger.warn(
      `[daemon-proxy] upstream error daemon=${parsed.daemonId} path=${parsed.restPath}: ${err.message}`
    );
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Bad gateway: cannot reach daemon");
    } else {
      res.destroy();
    }
  });

  req.on("aborted", () => {
    proxyReq.destroy();
  });

  res.on("close", () => {
    proxyReq.destroy();
  });

  req.pipe(proxyReq);
};
