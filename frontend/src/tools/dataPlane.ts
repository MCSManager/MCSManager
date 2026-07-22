import { useAppStateStore } from "@/stores/useAppStateStore";
import {
  mapDaemonAddress,
  parseForwardAddress,
  type RemoteMappingEntry
} from "@/tools/protocol";

export type DataPlaneMode = "proxy" | "direct";

export type DataPlaneMission = {
  password: string;
  addr?: string;
  prefix?: string;
  remoteMappings?: RemoteMappingEntry[];
  dataPlaneMode?: DataPlaneMode;
  proxy?: {
    daemonId: string;
    httpBase: string;
    wsPath: string;
  };
};

export function getDataPlaneMode(): DataPlaneMode {
  const { state } = useAppStateStore();
  return state.settings?.dataPlaneMode === "direct" ? "direct" : "proxy";
}

export function isDataPlaneProxyMode(): boolean {
  return getDataPlaneMode() === "proxy";
}

/**
 * Resolve HTTP base URL for daemon file upload/download.
 * Proxy mode: same-origin panel path. Direct mode: daemon public address.
 */
export function resolveDaemonHttpBase(
  mission: DataPlaneMission,
  daemonId: string
): string {
  const mode = mission.dataPlaneMode ?? getDataPlaneMode();
  if (mode === "proxy") {
    const base =
      mission.proxy?.httpBase || `/api/daemon_proxy/${daemonId}`;
    // Relative paths work with axios (prefixes ".") and window.open same-origin
    if (base.startsWith("http://") || base.startsWith("https://")) return base;
    return `${window.location.origin}${base.startsWith("/") ? base : `/${base}`}`;
  }

  let addr = mission.addr || "";
  if (mission.remoteMappings) {
    const mapped = mapDaemonAddress(mission.remoteMappings);
    if (mapped) {
      addr = mapped.addr + (mapped.prefix || "");
    }
  }
  return parseForwardAddress(addr, "http");
}

/**
 * Resolve Socket.IO connection options for terminal stream.
 */
export function resolveDaemonSocketOptions(
  mission: DataPlaneMission,
  daemonId: string
): { url: string; path: string } {
  const mode = mission.dataPlaneMode ?? getDataPlaneMode();
  if (mode === "proxy") {
    const wsPath =
      mission.proxy?.wsPath || `/socket.io-daemon/${daemonId}`;
    return {
      url: window.location.origin,
      path: wsPath
    };
  }

  let addr = mission.addr || "";
  let prefix = mission.prefix || "";
  if (mission.remoteMappings) {
    const mapped = mapDaemonAddress(mission.remoteMappings);
    if (mapped) {
      addr = mapped.addr;
      prefix = mapped.prefix;
    }
  }
  return {
    url: parseForwardAddress(addr, "ws"),
    path: (prefix || "").replace(/\/$/, "") + "/socket.io"
  };
}
