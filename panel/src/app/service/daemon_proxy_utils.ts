import http from "http";
import https from "https";
import { URL } from "url";
import { removeTrail } from "mcsmanager-common";
import type RemoteService from "../entity/remote_service";
import { systemConfig } from "../setting";

export type DataPlaneMode = "proxy" | "direct";

export const DAEMON_HTTP_PROXY_PREFIX = "/api/daemon_proxy";
export const DAEMON_SOCKET_PROXY_PATH_PREFIX = "/socket.io-daemon";

export function getDataPlaneMode(): DataPlaneMode {
  const mode = systemConfig?.dataPlaneMode;
  if (mode === "direct") return "direct";
  return "proxy";
}

export function isDataPlaneProxyMode(): boolean {
  return getDataPlaneMode() === "proxy";
}

/**
 * Build the daemon HTTP(S) origin + prefix used when the panel talks to a node.
 * Mirrors RemoteService.connect TLS selection: panel SSL upgrades plain targets to HTTPS.
 */
export function getDaemonHttpOrigin(remote: RemoteService): string {
  const config = remote.config;
  let host = config.ip.trim();
  let protocol = "http:";

  if (host.toLowerCase().startsWith("wss://")) {
    protocol = "https:";
    host = host.slice(6);
  } else if (host.toLowerCase().startsWith("ws://")) {
    protocol = "http:";
    host = host.slice(5);
  } else if (host.toLowerCase().startsWith("https://")) {
    protocol = "https:";
    host = host.slice(8);
  } else if (host.toLowerCase().startsWith("http://")) {
    protocol = "http:";
    host = host.slice(7);
  }

  // Strip path fragments if present in the host field
  host = host.split("/")[0];

  if (systemConfig?.ssl && protocol === "http:") {
    protocol = "https:";
  }

  const prefix = config.canonicalPrefix || "";
  return `${protocol}//${host}:${config.port}${prefix}`;
}

export function getDaemonWsOrigin(remote: RemoteService): string {
  return getDaemonHttpOrigin(remote).replace(/^http/, "ws");
}

export function getDaemonSocketIoPath(remote: RemoteService): string {
  const prefix = remote.config.canonicalPrefix || "";
  return removeTrail(prefix, "/") + "/socket.io";
}

/** Response shape for stream/file mission minting endpoints. */
export function buildDataPlaneMissionResponse(
  daemonId: string,
  password: string,
  remote: RemoteService,
  extra: Record<string, unknown> = {}
) {
  if (!isDataPlaneProxyMode()) {
    return {
      password,
      addr: remote.config.addr,
      fullAddr: remote.config.fullAddr,
      prefix: remote.config.prefix,
      remoteMappings: remote.config.getConvertedRemoteMappings(),
      dataPlaneMode: "direct" as const,
      ...extra
    };
  }

  return {
    password,
    // Empty so older clients cannot reach the real node by accident
    addr: "",
    fullAddr: "",
    prefix: "",
    remoteMappings: [],
    dataPlaneMode: "proxy" as const,
    proxy: {
      daemonId,
      httpBase: `${DAEMON_HTTP_PROXY_PREFIX}/${daemonId}`,
      wsPath: `${DAEMON_SOCKET_PROXY_PATH_PREFIX}/${daemonId}`
    },
    ...extra
  };
}

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host"
]);

export function filterRequestHeaders(
  headers: http.IncomingHttpHeaders
): http.OutgoingHttpHeaders {
  const out: http.OutgoingHttpHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value == null) continue;
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}

export function filterResponseHeaders(
  headers: http.IncomingHttpHeaders
): http.OutgoingHttpHeaders {
  const out: http.OutgoingHttpHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value == null) continue;
    const lower = key.toLowerCase();
    if (lower === "connection" || lower === "keep-alive") continue;
    out[key] = value;
  }
  return out;
}

export function parseDaemonProxyPath(
  urlPath: string
): { daemonId: string; restPath: string } | null {
  const prefix = DAEMON_HTTP_PROXY_PREFIX;
  if (!urlPath.startsWith(prefix + "/") && urlPath !== prefix) return null;
  const after = urlPath.slice(prefix.length);
  const m = after.match(/^\/([^/]+)(\/.*)?$/);
  if (!m) return null;
  return {
    daemonId: decodeURIComponent(m[1]),
    restPath: m[2] || "/"
  };
}

/**
 * Parse /socket.io-daemon/:daemonId[/...][?query]
 * Socket.IO client uses path option = /socket.io-daemon/:daemonId so Engine.IO
 * requests look like /socket.io-daemon/:daemonId/?EIO=4&transport=polling
 */
export function parseDaemonSocketProxyPath(
  urlPathname: string
): { daemonId: string } | null {
  const prefix = DAEMON_SOCKET_PROXY_PATH_PREFIX;
  if (!urlPathname.startsWith(prefix + "/")) return null;
  const after = urlPathname.slice(prefix.length + 1);
  const daemonId = decodeURIComponent(after.split("/")[0].split("?")[0]);
  if (!daemonId) return null;
  return { daemonId };
}

export function buildUpstreamUrl(remote: RemoteService, restPath: string, search: string): URL {
  const base = getDaemonHttpOrigin(remote);
  const joined = removeTrail(base, "/") + restPath + (search || "");
  return new URL(joined);
}

export function pickHttpModule(url: URL) {
  return url.protocol === "https:" ? https : http;
}
