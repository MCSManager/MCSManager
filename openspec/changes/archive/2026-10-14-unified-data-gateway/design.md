# Design

## Context

Today the browser reaches the daemon's data plane directly. For file download/upload and terminal, the panel issues three browser-facing APIs (`stream_channel`, `files/download`, `files/upload`) that return the daemon's `addr`/`prefix`/`password`; the frontend connects to the daemon with no panel in the path (see `frontend/src/tools/protocol.ts` `parseForwardAddress`/`mapDaemonAddress`, where `parseForwardAddress` rewrites `127.0.0.1` → `window.location.hostname`). This addr-driven decoupling already exists: the frontend reads those three fields verbatim and needs zero connection-logic change when the panel swaps the values it returns. The panel's existing `socket_service.ts` already builds a socket.io `Server` but is currently dead code. The daemon authenticates each data request only by a "mission passport" (registered by the panel over the existing control channel), not by the apiKey.

## Goals / Non-Goals

**Goals:**

- Daemon not exposed to browsers; only the panel port is public.
- Panel streams file/terminal data with end-to-end Node stream backpressure (no relay buffering).
- Default `direct` mode with hot-swap rollback; one-click flip, no restart.
- Zero frontend connection-logic change, via the existing addr-driven protocol.
- Daemon unchanged.

**Non-Goals (this change):**

- Daemon raw-octet-stream upload endpoint (design Phase 4) — deferred follow-up.
- Daemon loopback bind (design Phase 5) — deferred follow-up.
- Daemon CORS tightening — deferred follow-up.
- Per-node data-plane config (MVP is global; design notes per-node later).

## Decisions

**D1: Two modes via `SystemConfig.dataPlane` (`"direct"` default, `"proxy"`), hot-reload on PUT `/overview/setting`.** The existing per-field mutation + `saveSystemConfig` already round-trips the whole config on GET, so the new field round-trips with no restart. A frontend security-tab dropdown sets it. Rejected: per-node config now (MVP global; per-node is a later extension over the same switch).

**D2: Panel = transparent wire-compatible reverse proxy over the DAEMON'S existing HTTP/socket.io wire surface (same paths, same events).** The frontend and the existing addr-driven test helpers then connect with zero change — only the `addr`/`prefix`/`password` returned by `stream_channel`/`files/download`/`files/upload` change with the mode. Rejected: new panel-native proxy paths (would force frontend branching, breaking the addr-driven contract).

**D3: Upload = transparent byte passthrough of the existing multipart/chunked protocol through `stream.pipeline(ctx.req, daemonReq)` and `stream.pipeline(daemonRes, ctx.res)`; the panel never buffers the file.** Per-chunk multipart parsing stays on the daemon (existing behavior, ~2 MiB/piece for the chunked path). Rejected: panel re-emitting multipart (buffers the whole file) and the design's raw-octet-stream protocol split (Phase 4, deferred to keep wire parity).

**D4: Terminal = a panel socket.io SERVER (repurpose the dead `SocketService.setUpSocketIO`, attach to the panel's httpServer) speaking the daemon's exact event contract** (`stream/auth`, `stream/detail`, `stream/input`, `stream/write`, `stream/resize`, `instance/stdout`, `instance/stopped`, `instance/opened`, `instance/failure`), bridged to a per-`(daemonId, instanceUuid)` reused panel→daemon socket.io CLIENT (separate from the control socket), with stdout fan-out to every subscribed browser socket and ref-counted lifecycle (last browser disconnect ⇒ close the daemon stream client ⇒ daemon `stopForward`). Rejected: raw WebSocket server (would break the frontend's socket.io-client and the addr-driven contract).

**D5: Browser-held credential = panel-signed HMAC token.** Symmetric secret `SystemConfig.gatewaySecret` (generated once, persisted like the daemon's key, never shared), payload `{daemonId, instanceUuid, op, target, nonce, exp}`, short exp, single-use nonce store with a TTL sweeper; the stream token is connection-level one-time (consumed on first `stream/auth`, invalidated on disconnect). The daemon's real `addr`, its internal mission passport, and its apiKey are NEVER sent to the browser. Rejected: external/JWT-asymmetric keys (no key distribution needed; the panel self-signs and self-verifies).

**D6: The panel authenticates to the daemon's UNCHANGED surface by obtaining a daemon "mission passport" internally over the existing `RemoteRequest(...).request("passport/register", {name, password, parameter})` control-channel RPC**, then using that passport as the daemon URL `:key` (download/upload) or the `stream/auth` password (terminal). The daemon HTTP does not check the apiKey, only the mission passport — so zero daemon auth change. Rejected: new daemon HTTP auth (would require daemon changes).

**D7: A single Koa app middleware registered BEFORE koa-body dispatches proxy routes**, pattern-matching `ctx.path`; when `dataPlane==="proxy"` and the path is a proxy data route, it runs `ProxyDataPlane` and returns WITHOUT calling `next()` — so koa-body never consumes `ctx.req` and the raw stream survives for `stream.pipeline`. Terminal socket.io is handled by engine.io on the httpServer before Koa, so it needs no koa-body skip. Rejected: koa-body `disableBodyParser` flag (couples to koa-body internals).

**D8: In proxy mode the three panel APIs return `addr = ctx.request.host`** (the panel's address as the browser sees it; `parseForwardAddress` maps `127.0.0.1`→`window.location.hostname` so the browser reconnects to its own panel origin) and `prefix = ""` (panel socket.io at `/socket.io`), with `remoteMappings` omitted/empty. The panel knows each daemon's HTTP addr via `RemoteServiceSubsystem.getInstance(daemonId).config.fullAddr` for internal forwarding. Rejected: returning a hardcoded panel host.

## Risks / Trade-offs

- [koa-body ordering] → The middleware is registered before koa-body and returns without `next()`; parallel `pipeline` errors MUST destroy both ends to avoid socket hang.
- [terminal multi-observer stdout consistency] → Fan-out MUST preserve order; a panel crash makes subscribers reconnect via a fresh `stream_channel`, which is acceptable.
- [panel single point of failure] → Noted; multi-panel federation is a later design, out of scope here.
- [`gatewaySecret` rotation invalidates in-flight tokens] → Acceptable; rotation is an explicit admin action with that semantics.
- [cross-public-net daemon bandwidth ~2×] → Same as any reverse proxy; same-host/intranet daemons see no amplification.

## Migration Plan

No data migration. Default `direct` keeps existing behavior byte-identical. Rollback is a single setting flip (panel hot-reload on PUT `/overview/setting`, no restart). Existing direct-mode flows continue to work unchanged.
