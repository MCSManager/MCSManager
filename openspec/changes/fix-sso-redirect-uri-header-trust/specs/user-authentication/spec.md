# Spec Delta

## ADDED Requirements

### Requirement: SSO Redirect URI Source

The system SHALL determine the OAuth/OIDC `redirect_uri` exclusively from server-side trusted configuration: an explicitly configured callback URL wins unconditionally; a forwarded host is honored only when reverse-proxy mode is enabled AND the host matches the configured allowlist; otherwise the value is derived from server configuration. The `redirect_uri` SHALL NOT be derived from client-controlled `Host` or `X-Forwarded-*` headers.

#### Scenario: Forged forwarded host without an allowlist is ignored

- **WHEN** reverse-proxy mode is disabled (or the forwarded host is not on the allowlist) and a client sends a forged `X-Forwarded-Host` to the SSO authorize endpoint
- **THEN** the authorization URL's `redirect_uri` is derived from server configuration and does not contain the forged host

#### Scenario: Allowlisted forwarded host is honored

- **WHEN** reverse-proxy mode is enabled and the forwarded host matches an entry in the allowlist
- **THEN** the authorization URL's `redirect_uri` uses that host

#### Scenario: Explicit callback URL overrides headers

- **WHEN** a callback URL is configured
- **THEN** the authorization URL uses exactly that callback URL regardless of any request headers

### Requirement: SSO Redirect URI Stage Consistency

The `redirect_uri` used for the server-side token exchange SHALL equal the value used in the authorization request. The authorize stage SHALL pin the resolved `redirect_uri` in the session, and the callback stage SHALL reuse that pinned value.

#### Scenario: Callback reuses the authorize-time redirect URI

- **WHEN** the callback stage performs the token exchange after a client sends a different forged forwarded host than at authorize time
- **THEN** the token exchange sends the `redirect_uri` pinned during the authorize stage, not the newly forged value

#### Scenario: Missing pinned redirect URI is rejected

- **WHEN** the callback stage runs without a pinned `redirect_uri` in the session
- **THEN** the flow is rejected as an invalid SSO session

## MODIFIED Requirements

### Requirement: SSO Configuration Update Rules
The system SHALL validate SSO configuration updates (OIDC issuer must use https; OAuth2 and callback URLs must use http(s); icon may use http(s) or a relative path) and SHALL verify the OIDC issuer live when SSO is enabled or OIDC credentials change. The callback URL, when provided, SHALL be an absolute URL without a query string or fragment whose path ends with `/api/auth/sso/callback`. The allowed-redirect-hosts setting, when provided, SHALL be a comma-separated list of bare `host[:port]` entries and SHALL be rejected otherwise. Identity-critical changes SHALL unbind all SSO users: type changes always; the issuer only in OIDC mode; the user-info URL and user-id field only in OAuth2 mode. An empty client-secret value SHALL preserve the stored secret.

#### Scenario: Identity-critical triggers are scoped by SSO type
- **WHEN** an administrator changes the issuer while in OAuth2 mode (or the user-info URL while in OIDC mode)
- **THEN** no accounts are unbound (those triggers only apply in their own mode — current behavior)

#### Scenario: Empty secret round-trip keeps the stored secret
- **WHEN** a settings update carries an empty client-secret value
- **THEN** the previously stored secret remains in effect

#### Scenario: Enabling OIDC verifies the issuer live
- **WHEN** an administrator enables SSO or changes OIDC credentials
- **THEN** the issuer is contacted to verify reachability and the update fails if verification fails

#### Scenario: Malformed callback URL is rejected
- **WHEN** a settings update supplies a callback URL that is relative, carries a query or fragment, or does not end with `/api/auth/sso/callback`
- **THEN** the update is rejected

#### Scenario: Malformed allowed-redirect-host entry is rejected
- **WHEN** a settings update supplies an allowed-redirect-hosts value containing an entry that is not a bare `host[:port]`
- **THEN** the update is rejected
