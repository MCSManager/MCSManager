# Tasks

## 1. Config skeleton + settings UI

- [x] 1.1 Add `dataPlane` (`"direct"`|`"proxy"`, default `"direct"`) and `gatewaySecret` (string, lazy) to `SystemConfig` in `panel/src/app/entity/setting.ts`; passthrough in `panel/src/app/routers/settings_router.ts` PUT; round-trip via existing GET `/overview/setting`; verify `cd panel && npm run build` passes
- [x] 1.2 Add `dataPlane` to `Settings` in `frontend/src/types/index.ts`; add a security-tab dropdown in `frontend/src/widgets/Settings.vue` (model on `reverseProxyMode`); add i18n keys to `languages/en_US.json` and `languages/zh_CN.json`; verify `cd frontend && npm run type-check && npm run lint` passes

## 2. Signed proxy-token service

- [x] 2.1 Implement `panel/src/app/service/gateway_token.ts`: HMAC sign/verify with `SystemConfig.gatewaySecret` (lazy-generate + persist if empty), payload `{daemonId, instanceUuid, op:"download"|"upload"|"stream", target, nonce, exp}`, single-use nonce store + TTL sweeper, connection-level one-time for stream; add unit tests for valid/expired/bad-sig/replay/op-mismatch; verify `cd panel && npm run build && cd panel && npm test` passes

## 3. File reverse-proxy

- [x] 3.1 Implement `panel/src/app/service/proxy_data_plane.ts`: obtain a daemon mission passport via `RemoteRequest(...).request("passport/register", {name, password, parameter})`; forward `GET /download/:token/:name`, `POST /upload/:token`, `POST /upload-new/:token`, `POST /upload-piece/:id`, `POST /upload-new/:id?stop`; `stream.pipeline(ctx.req→daemonReq)` and `(daemonRes→ctx)`; pass through status + headers (Content-Length, Content-Disposition); track `:id→{daemonId,instanceUuid}`; verify `cd panel && npm run build` passes
- [x] 3.2 Register the early app.ts proxy-route gate (before koa-body, pattern-match `ctx.path`, return without `next()` when proxy); edit `routers/filemananger_router.ts` (`/download`, `/upload`) and `routers/instance_admin_router.ts` (`/upload`) to return panel addr + signed token when `dataPlane==="proxy"`; verify `cd panel && npm run build` passes

## 4. Terminal bridge

- [x] 4.1 Implement `panel/src/app/service/terminal_bridge.ts`: browser socket.io events per daemon contract; per-`(daemonId,instance)` reused panel→daemon stream socket.io client; obtain daemon `stream_channel` passport; forward stdin/resize both ways; fan-out stdout/stopped/opened/failure; refcount lifecycle; verify `cd panel && npm run build` passes
- [x] 4.2 Repurpose `socket_service.ts`; wire `setUpSocketIO(httpServer)` in `app.ts`; edit `routers/instance_operate_router.ts` `/stream_channel` to return panel addr + `prefix=""` + signed stream token when `dataPlane==="proxy"`; verify `cd panel && npm run build` passes

## 5. Both-mode integration tests

- [x] 5.1 Add `common/test/integration/suites/dataplane.test.ts` + a `setDataPlane(mode)` helper exported from `lib` + a SUITES entry in `run.mjs` (after `streams`); assert direct-mode addr=daemon and proxy-mode addr=panel; run upload (single-shot + chunked), download (byte-identical), and terminal (stdin/stdout/broadcast/stop) in BOTH modes against one booted pair (flip config mid-suite); verify `cd common && npm run test:integration` passes the new suite and existing suites are unaffected

## 6. Cross-module verification

- [x] 6.1 One-pass `common`+`daemon`+`panel`+`frontend` suites + full integration; confirm direct non-regression + proxy functionality; verify all pass

## Workflow follow-up

- After human review and implementation, run the testing gate and archive the change with `/openspec-archive-change`, which syncs the `data-plane-gateway` delta into `openspec/specs/`.
- Verify the archived main spec contains the seven requirements with their scenarios.
