# Proposal

## Why

The panel's SSO implementation derived the OAuth/OIDC `redirect_uri` from client-controlled request headers (`X-Forwarded-Proto`, `X-Forwarded-Host`, `Host`) with no allowlist, and used that same header-derived value both to build the IdP authorization URL (`/api/auth/sso/authorize`) and to perform the server-side token exchange (`/api/auth/sso/callback`). Both endpoints are public. An unauthenticated attacker could therefore make the panel advertise a `redirect_uri` on a host they control, causing the IdP to deliver the authorization code to the attacker, and then complete the login in their own session — an authorization-code-interception / account-takeover chain for any IdP that does not enforce exact `redirect_uri` matching.

## What Changes

- The `redirect_uri` is resolved from server-side trusted configuration only: an explicitly configured `ssoCallbackUrl` wins; a forwarded host is honored only when reverse-proxy mode is enabled AND the host is on a new `ssoAllowedRedirectHosts` allowlist; otherwise the value is derived from server config (`ssl` / `httpIp` / `httpPort`). `Host` and `X-Forwarded-*` are never trusted without an explicit allowlist.
- The `redirect_uri` is resolved once at `/authorize`, pinned in the session (`ssoRedirectUri`), and reused verbatim for the token exchange at `/callback`, so the two stages can never disagree.
- SSO settings validation is tightened: `ssoCallbackUrl` must be an absolute http(s) URL with no query/fragment whose path ends in `/api/auth/sso/callback`; the new `ssoAllowedRedirectHosts` is validated as a list of bare `host[:port]` entries.
- The SSO settings UI exposes the new `Allowed Redirect Hosts` field and the callback-URL description reflects the server-derived behavior.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `user-authentication`: the SSO flow's `redirect_uri` trust model and SSO configuration validation rules change.

## Impact

- `panel/src/app/service/sso_service.ts`: `getCallbackUrl()` trust model; `buildAuthorizationUrl()` and `handleOAuth2Callback()` take an explicit `redirect_uri` parameter.
- `panel/src/app/routers/sso_router.ts`: pin `ssoRedirectUri` at authorize, reuse at callback.
- `panel/src/app/entity/setting.ts`: new `ssoAllowedRedirectHosts` field.
- `panel/src/app/routers/settings_router.ts`: callback-URL and allowlist validation.
- `frontend/src/widgets/Settings.vue` + `languages/{en_US,zh_CN}.json`: new settings field and updated description.
- New integration suite `common/test/integration/suites/security_sso_redirect.test.ts` (+ `run.mjs` registration).
- Behavior change: deployments behind a reverse proxy with an empty `ssoCallbackUrl` must now either set `ssoCallbackUrl` or configure `ssoAllowedRedirectHosts`; otherwise the derived value falls back to the server's own address.
