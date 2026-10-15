# Proposal

## Why

The daemon's HTTP/Socket.io data-plane port (:24444) must be publicly reachable for file upload/download and terminal IO, and it is the project's biggest attack surface. The browser connects directly to the daemon using a one-time "mission passport" ticket the panel registered; the ticket is a pure-random `timeUuid()` with no signature, audience, or replay protection, the download token travels naked in the URL path, the daemon's CORS is unconditional `*`, and the terminal ticket is reusable for 1 hour. Operationally every daemon needs a public IP/port, so NAT'd daemons cannot be adopted. The goal is to make ONLY the panel port public; proxy the three data channels through the panel with end-to-end Node stream backpressure (no relay buffering); keep the panel→daemon connection direction; and default to the existing direct mode with one-click rollback.

## What Changes

- A global `SystemConfig.dataPlane` switch is added: `"direct"` (default, identical to today) or `"proxy"`.
- In proxy mode the panel becomes a transparent, wire-compatible reverse proxy for the daemon's data-plane surface, over the daemon's UNCHANGED HTTP/Socket.io wire protocol:
  - file download (`GET /download/:token/:name`),
  - chunked upload (`/upload-new/:token`, `/upload-piece/:id`, `/upload-new/:id?stop`),
  - legacy single-file upload (`POST /upload/:token`), and
  - terminal (a panel socket.io server speaking the daemon's `stream/*` + `instance/stdout|stopped|opened` protocol, bridged to a per-(daemonId,instance) reused panel→daemon socket.io client with stdout fan-out and ref-counted lifecycle).
- Browser-held credentials become panel-signed HMAC tokens (symmetric secret, short exp, single-use nonce; stream token connection-level one-time). The panel obtains daemon "mission passports" internally over its existing Socket.io control channel and forwards them to the daemon's UNCHANGED surface, so the daemon is NOT modified in this change.
- Upload is a transparent byte-level passthrough of the existing multipart/chunked wire protocol via `stream.pipeline` (panel adds zero buffering); a future daemon-side raw-octet-stream endpoint is an explicit non-goal.

## Capabilities

### New Capabilities

- `data-plane-gateway`: A panel-controlled data-plane mode switch and transparent, wire-compatible reverse proxy for the daemon's file-download, file-upload, and terminal data channels, with panel-signed browser credentials and end-to-end stream backpressure.

### Modified Capabilities

(none — `instance-lifecycle`, `user-auth`, and `node-protocol` are unchanged; the daemon is not modified)

## Impact

- panel — new `gateway_token`, `proxy_data_plane`, `terminal_bridge` services; repurpose dead `socket_service.ts`; new `proxy_router`; `app.ts` wires an early proxy-route gate + the socket.io server; edits to `entity/setting.ts` (SystemConfig), `routers/settings_router.ts`, `routers/filemananger_router.ts` (`/download`, `/upload`), `routers/instance_admin_router.ts` (`/upload`), `routers/instance_operate_router.ts` (`/stream_channel`).
- frontend — `types/index.ts` (Settings), `widgets/Settings.vue` (security-tab dropdown), i18n keys in `languages/en_US.json` and `languages/zh_CN.json`.
- tests — new `common/test/integration/suites/dataplane.test.ts` + a `setDataPlane` helper + a `run.mjs` SUITES entry.
- daemon — unchanged. No data migration; default `direct` keeps existing behavior identical; rollback = flip the setting (panel hot-reload, no restart).
