# Spec Delta

## Purpose

Defines how the panel can proxy the daemon's data-plane channels (file download, file upload, terminal) behind a single public panel port, with panel-signed browser credentials and end-to-end stream backpressure, while defaulting to the existing direct daemon-to-browser data plane.

## ADDED Requirements

### Requirement: Data-plane mode switch

The panel SHALL expose a `SystemConfig.dataPlane` field with values `"direct"` (default) and `"proxy"`. Switching the field at runtime SHALL take effect without a process restart. In `"direct"` mode the browser-facing data-plane APIs SHALL return the daemon's address, identical to the pre-change product.

#### Scenario: Default direct behaves as today

- **WHEN** `dataPlane` is unset or `"direct"`
- **THEN** the browser reaches the daemon directly via the address returned by `stream_channel`/`files/download`/`files/upload`, identical to the pre-change product

#### Scenario: Switching to proxy takes effect at runtime

- **WHEN** an admin sets `dataPlane` to `"proxy"` via PUT `/overview/setting`
- **THEN** subsequent data-plane API calls return the panel's own address, without a panel restart

### Requirement: Address-driven client connection

The three browser-facing data-plane APIs (`stream_channel`, `files/download`, `files/upload`) SHALL return `addr`, `prefix`, and `password` fields the frontend consumes verbatim via `parseForwardAddress`. In `"direct"` mode the `addr` SHALL be the daemon's address; in `"proxy"` mode the `addr` SHALL be the panel's own address (as the browser sees it) and `prefix` SHALL be `""`. The frontend SHALL connect with no connection-logic change in either mode.

#### Scenario: Direct mode returns the daemon addr

- **WHEN** `dataPlane==="direct"`
- **THEN** the three APIs return the daemon's `addr`/`prefix`/`password` as today

#### Scenario: Proxy mode returns the panel addr

- **WHEN** `dataPlane==="proxy"`
- **THEN** the three APIs return `addr = ctx.request.host` and `prefix = ""`, and the browser reconnects to the panel origin

### Requirement: Proxied file download streaming

In `"proxy"` mode a `GET /download/:token/:name` request SHALL be reverse-proxied to the daemon's `GET /download/:key/:name`, with the request and response streams piped end-to-end via `stream.pipeline`. The response body SHALL be byte-identical to a direct download.

#### Scenario: Download via panel is byte-identical

- **WHEN** a browser downloads a file through the panel in `"proxy"` mode
- **THEN** the received bytes equal the bytes the daemon would have returned directly, and backpressure is preserved end-to-end

### Requirement: Proxied file upload streaming passthrough

In `"proxy"` mode upload requests (`POST /upload/:token`, `POST /upload-new/:token`, `POST /upload-piece/:id`, `POST /upload-new/:id?stop`) SHALL be reverse-proxied to the daemon's unchanged upload surface with `ctx.req` piped to the daemon request via `stream.pipeline`. The panel SHALL NOT buffer the whole file. The reassembled file on the daemon SHALL be byte-identical to a direct upload.

#### Scenario: Chunked upload via panel reassembles byte-identically

- **WHEN** a browser performs a chunked upload through the panel in `"proxy"` mode
- **THEN** the daemon reassembles a file byte-identical to the direct upload, across all chunks

#### Scenario: Legacy single-shot upload via panel succeeds

- **WHEN** a browser performs a legacy single-file upload (`POST /upload/:token`) through the panel in `"proxy"` mode
- **THEN** the upload succeeds and the stored file matches the direct upload

#### Scenario: Panel does not buffer the whole file

- **WHEN** a large file is uploaded through the panel
- **THEN** the panel pipes the request stream to the daemon without holding the full file in memory

### Requirement: Proxied terminal socket.io bridge

In `"proxy"` mode the panel SHALL run a socket.io server speaking the daemon's exact event contract, bridged to a per-`(daemonId, instanceUuid)` reused panel→daemon socket.io client. stdin and resize SHALL forward to the daemon; stdout/`stopped`/`opened`/`failure` SHALL fan out to every subscribed browser socket. When the last browser observer of an instance disconnects, the panel SHALL close the panel→daemon stream connection (triggering the daemon `stopForward`).

#### Scenario: stdin→daemon→stdout round-trips through the panel

- **WHEN** a browser sends stdin on the proxied terminal in `"proxy"` mode
- **THEN** the stdin reaches the daemon and the resulting stdout is relayed back to the browser

#### Scenario: Multiple observers share one panel→daemon connection

- **WHEN** two browsers subscribe to the same instance terminal in `"proxy"` mode
- **THEN** both receive the same stdout broadcast over a single panel→daemon stream connection

#### Scenario: Last observer disconnect closes the daemon stream

- **WHEN** the last subscribed browser disconnects from a proxied instance terminal
- **THEN** the panel closes the panel→daemon stream connection and the daemon stops forwarding

### Requirement: Panel-signed proxy tokens

Browser-facing credentials in `"proxy"` mode SHALL be panel-signed HMAC tokens with payload `{daemonId, instanceUuid, op, target, nonce, exp}` signed by `SystemConfig.gatewaySecret`. A token SHALL be rejected if its signature is invalid, it is expired, its nonce has already been used, or its `op` does not match the request. The stream token SHALL be connection-level one-time (consumed on first `stream/auth`, invalidated on disconnect). The daemon's real address and its internal mission passport SHALL NEVER appear in any browser-facing response.

#### Scenario: Bad/expired/reused/op-mismatched token rejected

- **WHEN** a browser presents a token with a bad signature, an expired `exp`, an already-used nonce, or a wrong `op`
- **THEN** the request is rejected before any data is forwarded

#### Scenario: Daemon secrets never reach the browser

- **WHEN** any browser-facing data-plane response is inspected in `"proxy"` mode
- **THEN** it contains no daemon address, no daemon mission passport, and no daemon apiKey

### Requirement: Direct-mode non-regression

With `dataPlane==="direct"`, all upload, download, and terminal flows SHALL be byte-identical and behavior-identical to the pre-change product. The daemon SHALL remain unchanged and the panel data-plane endpoints SHALL behave as before.

#### Scenario: Direct mode is byte-identical to pre-change

- **WHEN** `dataPlane==="direct"` and upload, download, and terminal are exercised
- **THEN** every flow is byte-identical and behavior-identical to the pre-change product
