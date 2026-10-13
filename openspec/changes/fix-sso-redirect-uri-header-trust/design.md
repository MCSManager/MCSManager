# Design

## Context

`redirect_uri` is the endpoint the IdP delivers the OAuth authorization code to. In MCSManager the panel both (a) builds the IdP authorization URL and (b) performs the server-side token exchange; the two must use the identical `redirect_uri`, and that value must be one the administrator registered at the IdP. Deriving it from request headers turns a client input into a security boundary.

## Goals / Non-Goals

- Goal: `redirect_uri` can only ever be a server-trusted value; request headers cannot influence it unless explicitly allowlisted.
- Goal: the authorize-time and callback-time values cannot diverge.
- Non-goal: changing the IdP's own `redirect_uri` validation policy; the panel fix removes the panel-side enabling factor.

## Decisions

### 1. Trust model for `getCallbackUrl()`

Resolution order:

1. `systemConfig.ssoCallbackUrl` (explicit admin config) — returned unconditionally.
2. `reverseProxyMode === true` AND the forwarded host is in `ssoAllowedRedirectHosts` — use `X-Forwarded-Proto` + `X-Forwarded-Host`. This is the only path where a header may influence the value.
3. Otherwise derive from `ssl` / `httpIp` / `httpPort` (never from `Host` / `X-Forwarded-*`).

`X-Forwarded-Host` (not `Host`) is used in step 2 because behind a reverse proxy it is the intended header; direct `Host` is never trusted. An empty allowlist means "trust no forwarded header".

### 2. Pin the value in the session

`/authorize` computes the `redirect_uri` once and stores it in `ctx.session["ssoRedirectUri"]`; `/callback` reads it back and uses it for the token exchange (OIDC: rebuild the URL from the pinned base + this request's query; OAuth2: pass it directly to the token exchange). The value is deleted from the session during callback cleanup. A missing pinned value is treated as an invalid SSO session.

This removes the previous second `getCallbackUrl(ctx)` call at callback time, which was the point where a mid-flow forged header could redirect the token exchange.

### 3. Configuration validation

- `ssoCallbackUrl`: if non-empty, must be absolute http(s), contain no query/fragment, and have a path ending in `/api/auth/sso/callback`.
- `ssoAllowedRedirectHosts`: comma-separated, each entry validated as a bare `host[:port]` by round-tripping through `new URL("http://" + entry)` and requiring `u.host === entry`, path `/`, and no credentials/query/fragment. Stored lowercased.

### 4. Testability

The security behavior is verified end-to-end in the real-process integration suite `common/test/integration/suites/security_sso_redirect.test.ts` (OAuth2 mode, which enables without a live IdP). The callback-stage pinning is proven with a local HTTP stand-in for the token/userinfo endpoints so the exact `redirect_uri` in the token POST can be captured.

## Risks / Trade-offs

- Reverse-proxy deployments with an empty `ssoCallbackUrl` and no allowlist will derive `http(s)://<httpIp|localhost>:<port>` instead of the public forwarded host. This is the intended secure default; operators set `ssoCallbackUrl` or `ssoAllowedRedirectHosts`. Mitigation: the settings UI now guides this, and the callback description was updated.
- The IdP must still enforce exact `redirect_uri` matching; the panel fix removes the panel-side enabling factor only.
