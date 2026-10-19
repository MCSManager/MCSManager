import { requestPanel } from "./http";
import { world } from "./world";

// Panel data-plane mode helpers. The panel's PUT /overview/setting route accepts
// a Partial<SystemConfig> — mirroring the bootstrap's `PUT {allowUsePreset:true}`
// call (lib/bootstrap.ts). GET /overview/setting returns the full systemConfig
// object; after requestPanel's unwrap, r.data is that config, so r.data.dataPlane
// is the current mode.
//
// "direct": the browser hits the daemon directly for upload/download and
//   socket.io terminal I/O — the passport/channel endpoints return the daemon
//   addr.
// "proxy" (fresh-install default): the browser hits the panel, which
//   reverse-proxies the daemon's HTTP data plane (ProxyDataPlane) and bridges
//   socket.io terminal I/O (TerminalBridge) — the endpoints return the panel
//   addr. An upgrade (config file already present) keeps the pre-existing mode.
//
// The `?? "proxy"` fallback below matches the fresh-install default; a response
// that omits `dataPlane` should not happen on a booted panel but keeps the
// helper total.

export async function setDataPlane(mode: "direct" | "proxy") {
  return requestPanel({
    method: "PUT",
    path: "/overview/setting",
    key: world.key,
    body: { dataPlane: mode },
    timeout: 8000
  });
}

export async function getDataPlane(): Promise<string> {
  const r = await requestPanel({
    method: "GET",
    path: "/overview/setting",
    key: world.key,
    timeout: 8000
  });
  return String(r?.data?.dataPlane ?? "proxy");
}
