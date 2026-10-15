import { URL } from "node:url";

// --------------------------------------------------------------------------
// Resolve the browser's real access address for proxy-mode data-plane APIs.
//
// In proxy mode the panel hands the browser back an `addr` for upload/download
// and a socket.io base for the terminal, and the browser must connect SAME-
// ORIGIN (prod) or via the frontend dev proxy (dev) so the panel stays the only
// thing the browser reaches. Returning the panel's own address breaks the dev
// case: the frontend dev server runs on another port (e.g. :5173) and proxies
// `/api` to the panel (:23333) with `changeOrigin: true`, so `ctx.request.host`
// on the panel is `localhost:23333`, the browser tries to reach that directly,
// and the cross-origin upload is blocked by CORS.
//
// The browser truthfully reports its own address in the `Referer`/`Origin`
// request headers (set to the page it is actually on), which a proxy hop
// rewrites the `Host` header but does NOT rewrite. So we read the browser's
// `host[:port]` from Referer/Origin first, then X-Forwarded-Host, then Host.
// --------------------------------------------------------------------------

export function browserFacingAddr(ctx: any): string {
  const headers = (ctx.req && ctx.req.headers) || {};
  const hdr = (k: string): string => {
    const v = headers[k];
    if (Array.isArray(v)) return String(v[0] ?? "");
    return v == null ? "" : String(v);
  };
  for (const key of ["referer", "origin"]) {
    const v = hdr(key);
    if (v) {
      try {
        const host = new URL(v).host; // "localhost:5173" or "example.com"
        if (host) return host;
      } catch {
        /* malformed — keep trying */
      }
    }
  }
  const xfh = hdr("x-forwarded-host");
  if (xfh) return xfh.split(",")[0].trim();
  // ctx.request.host already honors reverseProxyMode (X-Forwarded-Host).
  return ctx.request.host || "";
}

export default { browserFacingAddr };
