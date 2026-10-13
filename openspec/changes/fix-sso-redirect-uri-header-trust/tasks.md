# Tasks

## 1. Panel: redirect_uri trust model

- [x] 1.1 Rewrite `getCallbackUrl()` in `panel/src/app/service/sso_service.ts` so the value comes only from `ssoCallbackUrl`, or (reverse-proxy mode + `ssoAllowedRedirectHosts` allowlist) `X-Forwarded-Proto`/`X-Forwarded-Host`, or server config — never `Host`/`X-Forwarded-*` without an allowlist; add `ssoAllowedRedirectHosts` to `panel/src/app/entity/setting.ts`; verify `cd panel && npm run build` passes
- [x] 1.2 Change `buildAuthorizationUrl()` and `handleOAuth2Callback()` to take an explicit `redirect_uri` argument; pin `ssoRedirectUri` in the session at `/authorize` and reuse it at `/callback` in `panel/src/app/routers/sso_router.ts`; verify `cd panel && npm run build` passes

## 2. Panel: configuration validation

- [x] 2.1 Tighten `ssoCallbackUrl` validation (absolute http(s), no query/fragment, path ends with `/api/auth/sso/callback`) and validate/store `ssoAllowedRedirectHosts` in `panel/src/app/routers/settings_router.ts`; verify `cd panel && npm run build` and `cd panel && npm test` pass

## 3. Frontend + i18n

- [x] 3.1 Add the `Allowed Redirect Hosts` field to `frontend/src/widgets/Settings.vue` and the new/updated keys to `languages/en_US.json` and `languages/zh_CN.json`; verify `cd frontend && npm run type-check`, `npm test`, and `npm run lint` pass

## 4. Integration regression suite (`common`)

- [x] 4.1 Add `common/test/integration/suites/security_sso_redirect.test.ts` documenting the full design chain in comments and covering: header ignored with proxy off; proxy on without allowlist; proxy on with allowlist (trusted); explicit callback URL wins; callback token exchange reuses the authorize-time `redirect_uri`. Register the suite in `common/test/integration/run.mjs`
- [x] 4.2 Verify RED: with the pre-fix panel build, the suite fails for the expected reason (attacker host appears in `redirect_uri`); then restore the fix and confirm GREEN (`node node_modules/vitest/vitest.mjs run --config test/integration/vitest.config.ts test/integration/suites/security_sso_redirect.test.ts`)

## 5. Cross-module verification

- [x] 5.1 Run the full common integration suite (`cd common && npm run test:integration`) and confirm every suite passes (docker self-skips off-Linux)
- [x] 5.2 Run the module suites affected by the change: `cd common && npm test`, `cd daemon && npm test`, `cd panel && npm test`, `cd frontend && npm test` (all green)

## Workflow follow-up

- After human review, archive the change with `/openspec-archive-change`, which syncs the `user-authentication` delta into `openspec/specs/`.
