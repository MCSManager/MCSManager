import http from "http";
import https from "https";
import type { Context, Middleware, Next } from "koa";
import type { Socket as NetSocket } from "net";
import type { Duplex } from "stream";
import { URL } from "url";
import { getUserFromCtx } from "./passport_service";
import RemoteServiceSubsystem from "./remote_service";
import { logger } from "./log";
import { systemConfig } from "../setting";
import {
  DAEMON_HTTP_PROXY_PREFIX,
  DAEMON_SOCKET_PROXY_PATH_PREFIX,
  filterRequestHeaders,
  getDaemonHttpOrigin,
  getDaemonSocketIoPath,
  parseDaemonSocketProxyPath,
  pickHttpModule
} from "./daemon_proxy_utils";

function stripPanelPrefix(url: string): string {
  const prefix = systemConfig?.prefix;
  if (!prefix) return url;
  try {
    const u = new URL(url, "http://localhost");
    if (u.pathname.startsWith(prefix)) {
      let path = u.pathname.slice(prefix.length);
      if (!path.startsWith("/")) path = "/" + path;
      return path + u.search;
    }
  } catch {
    if (url.startsWith(prefix)) {
      let rest = url.slice(prefix.length);
      if (!rest.startsWith("/")) rest = "/" + rest;
      return rest;
    }
  }
  return url;
}

/**
 * Socket.IO / Engine.IO requests use path = /socket.io-daemon/:daemonId
 * and must be rewritten to the daemon's {prefix}/socket.io path.
 *
 * Handles both:
 *  - HTTP long-polling (via shouldHandleHttp)
 *  - WebSocket upgrade (via attachUpgradeHandler)
 */

function rewriteSocketIoPath(url: string, daemonSocketPath: string): { path: string; search: string } {
  // Incoming: /socket.io-daemon/:daemonId/?EIO=4&transport=...
  //         or /socket.io-daemon/:daemonId?EIO=4...
  const u = new URL(url, "http://localhost");
  const parsed = parseDaemonSocketProxyPath(u.pathname);
  if (!parsed) {
    return { path: u.pathname, search: u.search };
  }
  // Engine.IO may append / or nothing after the custom path
  // socket.io-client with path: "/socket.io-daemon/xxx" requests:
  //   /socket.io-daemon/xxx/?EIO=4&transport=polling
  const suffix = u.pathname.slice(
    `${DAEMON_SOCKET_PROXY_PATH_PREFIX}/${parsed.daemonId}`.length
  );
  // suffix is typically "/" or ""
  const upstreamPath = daemonSocketPath + (suffix || "/");
  return { path: upstreamPath, search: u.search };
}

export function isDaemonSocketProxyUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url, "http://localhost");
    return u.pathname.startsWith(DAEMON_SOCKET_PROXY_PATH_PREFIX + "/");
  } catch {
    return url.startsWith(DAEMON_SOCKET_PROXY_PATH_PREFIX + "/");
  }
}

export function isDaemonHttpProxyUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url, "http://localhost");
    return u.pathname.startsWith(DAEMON_HTTP_PROXY_PREFIX + "/");
  } catch {
    return url.startsWith(DAEMON_HTTP_PROXY_PREFIX + "/");
  }
}

/**
 * Koa middleware: stream Engine.IO long-polling HTTP through the panel.
 * WebSocket upgrades are handled separately via attachDaemonSocketUpgrade.
 */
export const daemonSocketIoHttpProxyMiddleware: Middleware = async (
  ctx: Context,
  next: Next
) => {
  const pathname = ctx.path || ctx.URL.pathname;
  if (!pathname.startsWith(DAEMON_SOCKET_PROXY_PATH_PREFIX + "/")) {
    return await next();
  }

  if (ctx.method === "OPTIONS") {
    ctx.status = 204;
    return;
  }

  const user = getUserFromCtx(ctx as any);
  if (!(user && typeof user.permission === "number" && user.permission >= 1)) {
    ctx.status = 403;
    ctx.body = "Access denied: login required";
    return;
  }

  const parsed = parseDaemonSocketProxyPath(pathname);
  if (!parsed) {
    ctx.status = 400;
    ctx.body = "Invalid socket proxy path";
    return;
  }

  const remote = RemoteServiceSubsystem.getInstance(parsed.daemonId);
  if (!remote) {
    ctx.status = 404;
    ctx.body = "Daemon not found";
    return;
  }

  const daemonSocketPath = getDaemonSocketIoPath(remote);
  // ctx.url is already prefix-stripped by panel middleware when applicable
  const rewritten = rewriteSocketIoPath(ctx.url, daemonSocketPath);
  const base = getDaemonHttpOrigin(remote);
  const upstreamUrl = new URL(base);
  const fullPath = rewritten.path + rewritten.search;

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
      path: fullPath,
      method: req.method,
      headers,
      rejectUnauthorized: false
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers as any);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (err) => {
    logger.warn(`[daemon-socket-proxy] HTTP error daemon=${parsed.daemonId}: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end("Bad gateway");
    }
  });

  req.pipe(proxyReq);
};

/**
 * Attach WebSocket upgrade proxy for Socket.IO.
 * Call once with the panel HTTP(S) server after createServer.
 */
export function attachDaemonSocketUpgrade(server: http.Server | https.Server) {
  server.on("upgrade", (req, socket: Duplex, head: Buffer) => {
    const rawUrl = stripPanelPrefix(req.url || "");
    if (!isDaemonSocketProxyUrl(rawUrl)) {
      // Let other handlers (if any) process; if none, socket stays open until timeout
      return;
    }

    // Cookie-based session is not easily available here without re-running session.
    // We rely on: (1) same-origin only, (2) stream passport on daemon after connect.
    // Still require a session cookie presence as a soft gate.
    const cookie = req.headers.cookie || "";
    if (!cookie) {
      socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }

    let pathname = "";
    try {
      pathname = new URL(rawUrl, "http://localhost").pathname;
    } catch {
      socket.destroy();
      return;
    }

    const parsed = parseDaemonSocketProxyPath(pathname);
    if (!parsed) {
      socket.destroy();
      return;
    }

    const remote = RemoteServiceSubsystem.getInstance(parsed.daemonId);
    if (!remote) {
      socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }

    const daemonSocketPath = getDaemonSocketIoPath(remote);
    const rewritten = rewriteSocketIoPath(rawUrl, daemonSocketPath);
    const base = getDaemonHttpOrigin(remote);
    const upstreamUrl = new URL(base);

    const headers = filterRequestHeaders(req.headers);
    headers["host"] = upstreamUrl.host;
    // Ensure upgrade headers are present
    if (req.headers.upgrade) headers["upgrade"] = req.headers.upgrade;
    if (req.headers.connection) headers["connection"] = req.headers.connection;
    if (req.headers["sec-websocket-key"])
      headers["sec-websocket-key"] = req.headers["sec-websocket-key"];
    if (req.headers["sec-websocket-version"])
      headers["sec-websocket-version"] = req.headers["sec-websocket-version"];
    if (req.headers["sec-websocket-extensions"])
      headers["sec-websocket-extensions"] = req.headers["sec-websocket-extensions"];
    if (req.headers["sec-websocket-protocol"])
      headers["sec-websocket-protocol"] = req.headers["sec-websocket-protocol"];

    const lib = pickHttpModule(upstreamUrl);
    const proxyReq = lib.request({
      protocol: upstreamUrl.protocol,
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port,
      path: rewritten.path + rewritten.search,
      method: "GET",
      headers,
      rejectUnauthorized: false
    });

    proxyReq.on("upgrade", (proxyRes, proxySocket: NetSocket, proxyHead: Buffer) => {
      const responseHeaders = Object.entries(proxyRes.headers)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("\r\n");

      socket.write(
        `HTTP/1.1 101 Switching Protocols\r\n${responseHeaders}\r\n\r\n`
      );
      if (proxyHead && proxyHead.length) socket.write(proxyHead);
      if (head && head.length) proxySocket.write(head);

      proxySocket.pipe(socket);
      socket.pipe(proxySocket);

      const cleanup = () => {
        proxySocket.destroy();
        socket.destroy();
      };
      proxySocket.on("error", cleanup);
      socket.on("error", cleanup);
      proxySocket.on("close", () => socket.destroy());
      socket.on("close", () => proxySocket.destroy());
    });

    proxyReq.on("error", (err) => {
      logger.warn(
        `[daemon-socket-proxy] upgrade error daemon=${parsed.daemonId}: ${err.message}`
      );
      socket.destroy();
    });

    proxyReq.end();
  });
}
