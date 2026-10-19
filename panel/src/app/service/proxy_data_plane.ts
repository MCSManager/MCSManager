import http from "http";
import https from "https";
import { pipeline } from "stream";
import { logger } from "./log";
import { timeUuid } from "./password";
import RemoteRequest from "./remote_command";
import RemoteServiceSubsystem from "./remote_service";
import type RemoteService from "../entity/remote_service";
import { systemConfig } from "../setting";
import { verifyProxyToken } from "./gateway_token";

// --------------------------------------------------------------------------
// ProxyDataPlane — reverse-proxies the daemon's HTTP data-plane surface
// (download / upload / upload-new / upload-piece) through the panel when
// `systemConfig.dataPlane === DataPlaneMode.Proxy`. The panel holds a daemon
// mission passport internally as the URL `:key` and presents its own
// panel-signed token to the browser. No daemon address is ever exposed to the
// browser.
//
// Zero buffering: request and response bodies are streamed with
// `stream.pipeline`, `ctx.respond` is set `false` synchronously in `handle()`
// so Koa never auto-writes a default response while we await the daemon, and
// every response (error or streamed) is written directly to `ctx.res`.
// --------------------------------------------------------------------------

// Routes the panel exposes in proxy mode (the daemon's HTTP surface, minus the
// panel prefix). The panel gate strips the panel prefix before matching.
const ROUTE_PATTERNS: { method: string; pattern: RegExp }[] = [
  { method: "GET", pattern: /^\/download\/[^/]+\/[^/]+$/ }, // /download/:token/:name
  { method: "POST", pattern: /^\/upload-new\/[^/]+$/ }, // /upload-new/:token | /upload-new/:id?stop
  { method: "POST", pattern: /^\/upload-piece\/[^/]+$/ }, // /upload-piece/:id
  { method: "POST", pattern: /^\/upload\/[^/]+$/ } // /upload/:token (legacy)
];

interface UploadMapping {
  daemonId: string;
  instanceUuid: string;
  uploadDir: string;
  daemonPass: string;
}

// Maps a daemon upload writer id back to the daemon that owns it, so
// /upload-piece and /upload-new?stop know where to forward. Hard-capped so a
// crashed upload cannot grow the map forever (the daemon-side writer has its
// own TTL cleanup regardless).
const uploadIdMap = new Map<string, UploadMapping>();
let uploadSweepTimer: NodeJS.Timeout | null = null;

function ensureUploadSweeper() {
  if (uploadSweepTimer) return;
  uploadSweepTimer = setInterval(() => {
    if (uploadIdMap.size > 500) uploadIdMap.clear();
  }, 5 * 60 * 1000);
  if (uploadSweepTimer && typeof uploadSweepTimer.unref === "function") uploadSweepTimer.unref();
}

/** Strip the panel prefix from a path if one is configured. */
function stripPrefix(p: string): string {
  const prefix = systemConfig?.prefix ?? "";
  if (prefix && p.startsWith(prefix)) {
    p = p.slice(prefix.length);
    if (!p.startsWith("/")) p = "/" + p;
  }
  return p;
}

/** Build the daemon HTTP base URL: scheme://ip:port + canonicalPrefix. */
function daemonBase(remoteService: RemoteService): string {
  const scheme = systemConfig?.ssl ? "https" : "http";
  return `${scheme}://${remoteService.config.addr}${remoteService.config.canonicalPrefix}`;
}

function httpClient(): typeof http | typeof https {
  return systemConfig?.ssl ? https : http;
}

/** Daemon RESPONSE headers copied through to the browser. */
const COPY_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-disposition",
  "accept-ranges",
  "content-range",
  "last-modified",
  "etag"
];

/**
 * Browser REQUEST headers copied through to the daemon. CRITICAL for the
 * upload routes: without `content-type` (multipart/form-data; boundary=...) and
 * `content-length`, the daemon's koa-body/formidable cannot frame/parse the
 * uploaded chunk and resets the connection ("socket hang up"). We pipe
 * `ctx.req` byte-for-byte, so the browser's `content-length` matches the bytes
 * we forward.
 */
const COPY_REQUEST_HEADERS = ["content-type", "content-length"];

function forwardRequestHeaders(ctx: any): http.OutgoingHttpHeaders {
  const out: http.OutgoingHttpHeaders = {};
  for (const h of COPY_REQUEST_HEADERS) {
    const v = ctx.req?.headers?.[h];
    if (v !== undefined && v !== "") out[h] = v;
  }
  return out;
}

/**
 * Write a JSON error/sync response directly to `ctx.res`. Proxy routes set
 * `ctx.respond = false`, so Koa never auto-writes; we emit the
 * `{ status, data, time }` envelope the panel/daemon wire shape uses.
 */
function sendJson(ctx: any, status: number, data: unknown): void {
  if (ctx.res.headersSent) {
    try {
      ctx.res.destroy();
    } catch {
      /* noop */
    }
    return;
  }
  ctx.res.statusCode = status;
  ctx.res.setHeader("content-type", "application/json; charset=utf-8");
  ctx.res.end(JSON.stringify({ status, data, time: Date.now() }));
}

/** Stream the daemon response to `ctx.res` (banner headers + backpressure). */
function pipeResponse(
  ctx: any,
  daemonReq: http.ClientRequest,
  daemonRes: http.IncomingMessage
): void {
  if (!ctx.res.headersSent) {
    ctx.res.statusCode = daemonRes.statusCode ?? 200;
    for (const h of COPY_RESPONSE_HEADERS) {
      const v = daemonRes.headers[h];
      if (v !== undefined) ctx.res.setHeader(h, v);
    }
  }
  pipeline(daemonRes, ctx.res, (err) => {
    if (err && (err as any).code !== "ERR_STREAM_PREMATURE_CLOSE")
      logger.warn("proxy pipe daemon→browser error:", (err as Error)?.message ?? err);
  });
  daemonRes.on("error", (err) => ctx.res.destroy(err));
}

/** Stream the browser request body to the daemon request. */
function pipeRequest(ctx: any, daemonReq: http.ClientRequest): void {
  pipeline(ctx.req, daemonReq, (err) => {
    if (err && (err as any).code !== "ERR_STREAM_PREMATURE_CLOSE")
      logger.warn("proxy pipe browser→daemon error:", (err as Error)?.message ?? err);
  });
  // Tear the daemon request down ONLY on a real browser abort. `ctx.req`
  // "close" also fires on normal completion (e.g. the empty body of a GET, or
  // right after a small POST body is read), which would destroy an in-flight
  // daemonReq and cause "socket hang up" before the daemon can respond.
  ctx.req.on("aborted", () => {
    try {
      daemonReq.destroy();
    } catch {
      /* noop */
    }
  });
}

class ProxyDataPlaneImpl {
  /** Called from the early Koa gate: is this a proxy-data-plane request? */
  matchRequest(method: string, path: string): boolean {
    const p = stripPrefix(path);
    for (const route of ROUTE_PATTERNS) {
      if (route.method === method && route.pattern.test(p)) return true;
    }
    return false;
  }

  async handle(ctx: any): Promise<void> {
    // CRITICAL: claim the response synchronously so Koa does NOT auto-write a
    // default 404 while we wait for the daemon. Every response below (error or
    // streamed) is written manually to ctx.res.
    ctx.respond = false;
    const p = stripPrefix(ctx.path);
    try {
      if (ctx.method === "GET" && /^\/download\/[^/]+\/[^/]+$/.test(p))
        return await this.handleDownload(ctx, p);
      if (ctx.method === "POST" && /^\/upload-new\/[^/]+$/.test(p))
        return await this.handleUploadNew(ctx, p);
      if (ctx.method === "POST" && /^\/upload-piece\/[^/]+$/.test(p))
        return await this.handleUploadPiece(ctx, p);
      if (ctx.method === "POST" && /^\/upload\/[^/]+$/.test(p))
        return await this.handleUploadLegacy(ctx, p);
      return sendJson(ctx, 404, "Not found");
    } catch (err) {
      logger.error("ProxyDataPlane handle error:", err);
      return sendJson(ctx, 500, "Proxy error");
    }
  }

  // ----- GET /download/:token/:name --------------------------------------
  private async handleDownload(ctx: any, p: string): Promise<void> {
    const parts = p.split("/").slice(2); // ["token", "name..."]
    const token = parts[0];
    const name = parts.slice(1).join("/"); // file name may itself contain "/"
    if (!token || !name) return sendJson(ctx, 400, "Bad request");

    const binding = verifyProxyToken(token, "download");
    if (!binding) return sendJson(ctx, 403, "Access denied");

    const remoteService = RemoteServiceSubsystem.getInstance(binding.daemonId);
    if (!remoteService) return sendJson(ctx, 502, "Daemon not found");

    // Fresh daemon download passport per request → retries still work.
    const daemonPass = timeUuid();
    await new RemoteRequest(remoteService).request("passport/register", {
      name: "download",
      password: daemonPass,
      parameter: { fileName: binding.target, instanceUuid: binding.instanceUuid }
    });

    const base = daemonBase(remoteService);
    const url = `${base}/download/${encodeURIComponent(daemonPass)}/${encodeURIComponent(name)}`;
    const reqHeaders: http.OutgoingHttpHeaders = {};
    const range = ctx.req.headers["range"];
    if (range) reqHeaders["range"] = range;

    const daemonReq = httpClient().request(url, { method: "GET", headers: reqHeaders }, (daemonRes) => {
      pipeResponse(ctx, daemonReq, daemonRes);
    });
    daemonReq.on("error", (err) => {
      logger.error("proxy download daemon error:", err.message);
      sendJson(ctx, 502, "Daemon error");
    });
    daemonReq.end(); // GET — no request body
  }

  // ----- POST /upload-new/:token  (init OR /upload-new/:id?stop) ----------
  private async handleUploadNew(ctx: any, p: string): Promise<void> {
    const key = p.split("/").slice(2).join("/"); // everything after /upload-new/

    // Stop form: /upload-new/:id?stop=true — key is the daemon writer id.
    if (ctx.query.stop) {
      const mapping = uploadIdMap.get(key);
      if (!mapping) return sendJson(ctx, 403, "Access denied: No task found");
      const remoteService = RemoteServiceSubsystem.getInstance(mapping.daemonId);
      if (!remoteService) return sendJson(ctx, 502, "Daemon not found");
      const base = daemonBase(remoteService);
      const daemonReq = httpClient().request(
        `${base}/upload-new/${encodeURIComponent(key)}?stop=true`,
        { method: "POST", headers: forwardRequestHeaders(ctx) },
        (daemonRes: http.IncomingMessage) => {
          pipeResponse(ctx, daemonReq, daemonRes);
          daemonRes.on("end", () => uploadIdMap.delete(key));
          daemonRes.on("error", () => uploadIdMap.delete(key));
        }
      );
      daemonReq.on("error", (err) => {
        logger.error("proxy upload-stop daemon error:", err.message);
        sendJson(ctx, 502, "Daemon error");
      });
      pipeRequest(ctx, daemonReq);
      return;
    }

    // Init form: /upload-new/:token — verify the panel token, register a daemon
    // upload passport, forward, and capture the daemon's writer id for piece routing.
    const binding = verifyProxyToken(key, "upload");
    if (!binding) return sendJson(ctx, 403, "Access denied");

    const remoteService = RemoteServiceSubsystem.getInstance(binding.daemonId);
    if (!remoteService) return sendJson(ctx, 502, "Daemon not found");

    const daemonPass = timeUuid();
    await new RemoteRequest(remoteService).request("passport/register", {
      name: "upload",
      password: daemonPass,
      parameter: { uploadDir: binding.target, instanceUuid: binding.instanceUuid }
    });

    ensureUploadSweeper();

    const base = daemonBase(remoteService);
    const url = `${base}/upload-new/${encodeURIComponent(daemonPass)}${ctx.search}`;
    const daemonReq = httpClient().request(
      url,
      { method: "POST", headers: forwardRequestHeaders(ctx) },
      (daemonRes: http.IncomingMessage) => {
        // Collect the (small) init JSON so we can extract the daemon writer id.
        const chunks: Buffer[] = [];
        daemonRes.on("data", (chunk: Buffer) => chunks.push(chunk));
        daemonRes.on("end", () => {
          const bodyBuf = Buffer.concat(chunks);
          // Register the writer id BEFORE replying so the browser cannot race a
          // /upload-piece back that we have not mapped yet.
          try {
            const parsed = JSON.parse(bodyBuf.toString());
            const writerId = parsed?.data?.id;
            if (writerId) {
              uploadIdMap.set(writerId, {
                daemonId: binding.daemonId,
                instanceUuid: binding.instanceUuid,
                uploadDir: binding.target,
                daemonPass
              });
            }
          } catch {
            // Daemon returned an error body; that's fine — forward it verbatim.
          }
          if (!ctx.res.headersSent) {
            ctx.res.statusCode = daemonRes.statusCode ?? 200;
            for (const h of COPY_RESPONSE_HEADERS) {
              const v = daemonRes.headers[h];
              if (v !== undefined) ctx.res.setHeader(h, v);
            }
            ctx.res.end(bodyBuf);
          }
        });
        daemonRes.on("error", (err) => {
          if (!ctx.res.headersSent) sendJson(ctx, 502, "Daemon error");
          else ctx.res.destroy(err);
        });
      }
    );
    daemonReq.on("error", (err) => {
      logger.error("proxy upload-init daemon error:", err.message);
      sendJson(ctx, 502, "Daemon error");
    });
    pipeRequest(ctx, daemonReq);
  }

  // ----- POST /upload-piece/:id ------------------------------------------
  private async handleUploadPiece(ctx: any, p: string): Promise<void> {
    const id = p.split("/").slice(2).join("/");
    const mapping = uploadIdMap.get(id);
    if (!mapping) return sendJson(ctx, 403, "Access denied: No task found");
    const remoteService = RemoteServiceSubsystem.getInstance(mapping.daemonId);
    if (!remoteService) return sendJson(ctx, 502, "Daemon not found");
    const base = daemonBase(remoteService);
    // Forward query (offset). The multipart chunk passes through verbatim.
    const url = `${base}/upload-piece/${encodeURIComponent(id)}${ctx.search}`;
    const daemonReq = httpClient().request(
      url,
      { method: "POST", headers: forwardRequestHeaders(ctx) },
      (daemonRes: http.IncomingMessage) => {
        pipeResponse(ctx, daemonReq, daemonRes);
      }
    );
    daemonReq.on("error", (err) => {
      logger.error("proxy upload-piece daemon error:", err.message);
      sendJson(ctx, 502, "Daemon error");
    });
    pipeRequest(ctx, daemonReq);
  }

  // ----- POST /upload/:token (legacy single-shot) -----------------------
  private async handleUploadLegacy(ctx: any, p: string): Promise<void> {
    const token = p.split("/").slice(2).join("/");
    const binding = verifyProxyToken(token, "upload");
    if (!binding) return sendJson(ctx, 403, "Access denied");
    const remoteService = RemoteServiceSubsystem.getInstance(binding.daemonId);
    if (!remoteService) return sendJson(ctx, 502, "Daemon not found");

    const daemonPass = timeUuid();
    await new RemoteRequest(remoteService).request("passport/register", {
      name: "upload",
      password: daemonPass,
      parameter: { uploadDir: binding.target, instanceUuid: binding.instanceUuid }
    });

    const base = daemonBase(remoteService);
    const url = `${base}/upload/${encodeURIComponent(daemonPass)}${ctx.search}`;
    const daemonReq = httpClient().request(
      url,
      { method: "POST", headers: forwardRequestHeaders(ctx) },
      (daemonRes: http.IncomingMessage) => {
        pipeResponse(ctx, daemonReq, daemonRes);
      }
    );
    daemonReq.on("error", (err) => {
      logger.error("proxy upload-legacy daemon error:", err.message);
      sendJson(ctx, 502, "Daemon error");
    });
    pipeRequest(ctx, daemonReq);
  }
}

// Singleton.
const ProxyDataPlane = new ProxyDataPlaneImpl();
export { ProxyDataPlane };
export default ProxyDataPlane;
