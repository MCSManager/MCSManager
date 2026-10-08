# user-authentication Specification

## Purpose

Defines how the panel verifies user identity and authorizes API requests: password login with optional TOTP second factor, cookie sessions, bearer API keys, SSO federation, and abuse protection (login IP bans and request rate limits). These contracts are the gate in front of every protected panel endpoint.

## Requirements

### Requirement: Password Login
The system SHALL authenticate a login request by user name and password, and SHALL return a session token on success. When the matched account has 2FA enabled, the system SHALL verify the TOTP code before the password and SHALL answer with a "need 2FA" challenge when no code was supplied. When password login is disabled by SSO-only configuration, the endpoint SHALL refuse password login entirely.

#### Scenario: Successful login issues a token
- **WHEN** a valid user name and password are submitted
- **THEN** the system establishes a session and returns the session token

#### Scenario: Wrong password fails
- **WHEN** a valid user name is submitted with an incorrect password
- **THEN** the login is rejected, no session is created, and the failure counts toward the IP failure record

#### Scenario: Two-factor challenge is issued
- **WHEN** a login request for a 2FA-enabled account omits the TOTP code
- **THEN** the system answers with the need-2FA challenge and does not establish a session

#### Scenario: Two-factor code precedes password check
- **WHEN** a login request for a 2FA-enabled account carries an invalid TOTP code
- **THEN** the login is rejected regardless of password correctness

#### Scenario: Already authenticated request is idempotent
- **WHEN** a login request arrives on an already authenticated session
- **THEN** the system reports the existing login state without creating a new session

### Requirement: First-Run Installation
The system SHALL expose an installation endpoint that creates the first administrator account and logs it in, and SHALL accept that endpoint only while no user account exists. The created account SHALL receive the administrator permission level.

#### Scenario: First user becomes administrator
- **WHEN** the installation endpoint is called while no user exists with a valid user name and password
- **THEN** the system creates the account with permission level 10 and establishes a session

#### Scenario: Installation is refused once users exist
- **WHEN** the installation endpoint is called after at least one user exists
- **THEN** the request is rejected and no account is created

### Requirement: Session Request Authentication
The system SHALL authenticate protected requests by session cookie plus a request token parameter matching the session token, and SHALL additionally require the Ajax request header for token-checked endpoints. An API key presented in the request MAY substitute for the entire session, token, and Ajax requirement. Each level-checked request SHALL re-read the account's stored permission level and SHALL reject the request when that level is below the endpoint requirement.

#### Scenario: Missing or mismatched token is rejected
- **WHEN** a token-checked request omits the token parameter or supplies a value that differs from the session token
- **THEN** the request is rejected as a token verification failure

#### Scenario: Missing Ajax header is rejected
- **WHEN** a token-checked request omits the Ajax request header
- **THEN** the request is rejected as an Ajax verification failure

#### Scenario: Insufficient level is rejected
- **WHEN** an authenticated user below the endpoint's required permission level requests it
- **THEN** the request is rejected as a verification failure

### Requirement: Session Lifetime and Invalidation
The panel SHALL issue sessions as signed, HTTP-only cookies with a 24-hour lifetime whose cookie name and signing key are generated per process boot, so that a panel restart invalidates all outstanding sessions. Logout SHALL clear the session, a forced logout for banned accounts SHALL clear the session, and a successful self password change SHALL clear the caller's session.

#### Scenario: Restart invalidates sessions
- **WHEN** the panel process restarts and a client replays a previously issued session cookie
- **THEN** the request is unauthenticated

#### Scenario: Logout clears the session
- **WHEN** a logged-in user calls the logout endpoint
- **THEN** the session fields are cleared and subsequent protected requests are rejected

### Requirement: API Key Authentication
The system SHALL accept a per-user API key supplied via request header or query parameter as a full substitute for session, token, and Ajax checks, authorizing purely on the account's permission level; per-instance ownership gates SHALL still apply. API key use SHALL require the global switch enabled, and in admin-only mode SHALL be limited to administrators. Keys SHALL be charset-validated before lookup, and unknown or malformed keys SHALL be rejected.

#### Scenario: Valid key authorizes without a session
- **WHEN** a request carries a valid API key and no session cookie, token, or Ajax header
- **THEN** the request is authorized at that user's permission level

#### Scenario: Disabled switch revokes all keys
- **WHEN** the global API key switch is turned off and a request presents a previously valid key
- **THEN** the request is rejected and no key-based access is possible

#### Scenario: Admin-only mode blocks regular users
- **WHEN** the API key switch is in admin-only mode and a regular user presents their key
- **THEN** the request is rejected

#### Scenario: Malformed key is rejected
- **WHEN** a request presents a key containing characters outside the allowed charset
- **THEN** the request is rejected without any account lookup side effects

### Requirement: API Key Lifecycle
The system SHALL let an authenticated user generate, rotate, or clear their own API key through the self-service endpoint. Enabling SHALL be subject to the global API key switch (and in admin-only mode restricted to administrators) and SHALL mint a fresh random key returned once; disabling SHALL clear the stored key regardless of the switch state (current behavior).

#### Scenario: Enabling mints a fresh key
- **WHEN** a user enables their API key
- **THEN** a new random key is stored and returned in the response, superseding any previous key

#### Scenario: Disabling clears the key
- **WHEN** a user disables their API key
- **THEN** the stored key is cleared and subsequent key-authenticated requests fail

### Requirement: Two-Factor Binding and Confirmation
The system SHALL support TOTP-based two-factor authentication (6 digits, 30-second step) with a configurable drift tolerance in steps. Binding SHALL generate and store a new TOTP secret with 2FA still disabled and return a QR code encoding the secret; confirming enablement SHALL require a currently valid TOTP code. Disabling SHALL only require an authenticated session — no TOTP code is verified (current behavior). Re-binding SHALL reset the enforcement flag to disabled.

#### Scenario: Binding does not enable enforcement
- **WHEN** a user binds two-factor authentication
- **THEN** a new secret is stored, the response carries a QR code, and 2FA enforcement remains disabled until confirmed

#### Scenario: Enabling requires a valid code
- **WHEN** a user confirms 2FA enablement with a valid current TOTP code
- **THEN** 2FA enforcement is enabled for the account

#### Scenario: Wrong code never enables 2FA
- **WHEN** a user confirms 2FA enablement with an invalid TOTP code
- **THEN** the request fails and 2FA enforcement remains unchanged

#### Scenario: Disabling needs only a session
- **WHEN** a logged-in user confirms 2FA disablement
- **THEN** the enforcement flag is cleared without any TOTP verification (a held session can downgrade the account to password-only — current behavior)

### Requirement: Two-Factor Login Integration
When an account has 2FA enforcement enabled and a stored secret, login and SSO password-binding flows SHALL require a valid TOTP code and SHALL answer with the need-2FA challenge when the code is absent.

#### Scenario: Login succeeds only with a valid code
- **WHEN** a 2FA-enabled account submits correct credentials and a valid TOTP code
- **THEN** the session is established

#### Scenario: Challenge covers SSO binding
- **WHEN** an SSO binding request for a 2FA-enabled account omits the TOTP code
- **THEN** the bind endpoint answers with the need-2FA challenge

### Requirement: SSO Login
The system SHALL support federated login via OIDC or OAuth2 with PKCE, storing state, nonce, and code verifier in the session with a bounded time-to-live, validating the state on callback (nonce is additionally checked for OIDC), and deriving the external subject identifier. A callback whose subject is already bound to an account SHALL log that account in; an unbound subject SHALL enter the binding flow. When SSO is enabled and SSO-only mode is configured, password login SHALL be disabled.

#### Scenario: Bound subject logs in
- **WHEN** an SSO callback validates and its subject is already bound to an account
- **THEN** that account is logged in and a session token is issued

#### Scenario: Unbound subject enters binding
- **WHEN** an SSO callback validates and its subject is not bound to any account
- **THEN** the session enters the pending-bind state and no account is logged in

#### Scenario: Stale or forged callback data is rejected
- **WHEN** an SSO callback presents state that does not match the session or exceeds the time-to-live
- **THEN** the login is rejected

### Requirement: SSO Account Binding and Unbinding
The system SHALL let a pending SSO subject bind to an existing account by username and password (plus TOTP code when that account enforces 2FA), or bind to the currently logged-in account without a password, and SHALL refuse binding when the subject or the account is already bound. Only administrators SHALL be able to unbind SSO from an account. Changing identity-critical SSO configuration SHALL unbind all SSO-bound accounts.

#### Scenario: Credential bind succeeds
- **WHEN** a pending SSO subject is bound with correct credentials for an unbound account
- **THEN** the account is marked SSO-bound with the subject recorded and the user is logged in

#### Scenario: Double binding is refused
- **WHEN** a binding request targets a subject or an account that is already bound
- **THEN** the request is rejected and existing bindings are unchanged

#### Scenario: Identity config change unbinds everyone
- **WHEN** an administrator changes SSO identity-critical settings (type, issuer, user info URL, or user id field)
- **THEN** all SSO subject bindings are cleared

### Requirement: Login Failure IP Ban
The system SHALL track login failures per remote address in a sliding window and SHALL refuse further login attempts from an address once its failure count exceeds the maximum (10 failures within a 10-minute window; the 12th request is refused) for a ban duration of 10 minutes. A successful login SHALL reset the address's failure record, and the IP check switch SHALL disable the refusal while retaining failure counting.

#### Scenario: Repeated failures trigger the ban
- **WHEN** an address accumulates failures beyond the maximum inside the window and attempts another login with correct credentials
- **THEN** the login is refused until the ban expires

#### Scenario: Success resets the counter
- **WHEN** a login succeeds from an address with accumulated failures
- **THEN** the failure record for that address is cleared

#### Scenario: Counting covers every login request
- **WHEN** login requests arrive that do not reach credential verification (challenges, already-logged-in hits)
- **THEN** they still increment the failure counter (current behavior)

### Requirement: Request Rate Limiting
The system SHALL limit each session to 8 requests per second on routes gated below the administrator level and SHALL reject over-limit requests with a rate error; routes gated at administrator level and routes that opt out SHALL be exempt (the exemption is decided by the route's required level, not the caller's). A separate per-user, per-path cooldown limiter SHALL additionally apply to non-administrators on selected routes.

#### Scenario: Over-limit request is rejected
- **WHEN** a session issues requests above the allowed rate on a non-administrator route
- **THEN** excess requests are rejected with a rate limit error and later requests succeed after the rate recovers

#### Scenario: Administrator-level routes skip the rate check
- **WHEN** any session requests a route gated at administrator level
- **THEN** the per-session rate check is not applied

### Requirement: Integration Test Mode Bypass
The panel MAY be started with an explicit unsafe integration test flag that bypasses the permission middleware for requests carrying the matching key. This bypass MUST only be enabled for automated testing, MUST be off by default, and MUST NOT be reachable through any configuration file or API. Per-instance ownership gates inside route handlers SHALL still apply (the test key resolves to no user and therefore passes no ownership check).

#### Scenario: Absent flag grants no bypass
- **WHEN** the panel runs without the unsafe integration test flag and a request presents the test key
- **THEN** the request is authorized through the normal authentication rules

#### Scenario: Ownership gates survive the bypass
- **WHEN** a request carrying the test key reaches an instance-scoped route
- **THEN** the per-instance ownership check still rejects it
