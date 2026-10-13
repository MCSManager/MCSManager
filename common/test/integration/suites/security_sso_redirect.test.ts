import { describe, it, expect, beforeAll, afterAll } from "vitest";
import axios from "axios";
import http from "node:http";
import { world, setSetting } from "../lib";

// ============================================================================
// SECURITY SUITE — SSO / OIDC / OAuth2 redirect_uri header-trust
// ============================================================================
//
// WHY THIS FILE EXISTS (the whole design chain, read this first)
// ---------------------------------------------------------------
// MCSManager's SSO flow (panel/src/app/routers/sso_router.ts) is a standard
// OAuth 2.0 authorization-code + PKCE flow:
//
//   1. Browser GETs  /api/auth/sso/authorize
//        - the panel generates `state`, `nonce`, `codeVerifier`
//        - stores them in the CALLER'S session
//        - builds the IdP authorization URL (with `redirect_uri`) and 302s the
//          browser to the IdP
//   2. The IdP authenticates the user and redirects the browser back to the
//      panel's `redirect_uri` with `?code=...&state=...`
//   3. Browser GETs  /api/auth/sso/callback?code=...&state=...
//        - the panel checks `state` against the session
//        - performs a SERVER-SIDE token exchange, sending the SAME
//          `redirect_uri` it used in step 1 (the IdP rejects a mismatch)
//        - if the resulting `sub` is already bound to a panel account it calls
//          loginSuccess() -> the session becomes that account
//
// THREAT MODEL (the bug this suite guards against)
// ------------------------------------------------
// `redirect_uri` is a security boundary: the IdP delivers the authorization
// CODE to it. If an attacker can steer `redirect_uri` to a host they control,
// the code lands on their server ("authorization code interception"), and
// because the attacker initiated /authorize themselves they own the matching
// `state`/PKCE verifier in their own session. They then replay /callback with
// that session and the stolen code, and the panel logs them in as the victim's
// SSO-bound account (e.g. an administrator).
//
// The pre-fix `getCallbackUrl()` (panel/src/app/service/sso_service.ts) derived
// the redirect_uri from CLIENT-CONTROLLED request headers:
//     X-Forwarded-Proto / X-Forwarded-Host / Host   (no allowlist)
// and used the SAME header-derived value in BOTH stage 1 and stage 3. An
// unauthenticated attacker only had to add `X-Forwarded-Host: evil.example` to
// /api/auth/sso/authorize to make the panel advertise an attacker redirect_uri.
//
// THE INVARIANT ENFORCED AFTER THE FIX (what these tests pin)
// -----------------------------------------------------------
//   (I1) redirect_uri comes ONLY from server-side trusted config:
//          a) explicit `ssoCallbackUrl` always wins; and, absent that,
//          b) `X-Forwarded-Host` is trusted ONLY when reverse-proxy mode is
//             enabled AND the host is on the `ssoAllowedRedirectHosts` allowlist;
//          c) otherwise it is derived from server config (ssl/httpIp/httpPort),
//             NEVER from Host/X-Forwarded-*.
//   (I2) the redirect_uri is resolved ONCE at /authorize, pinned in the session
//        (`ssoRedirectUri`), and REUSED at /callback for the token exchange, so
//        the two stages can never be made to disagree.
//
// TEST MATRIX (mapping to I1/I2)
// ------------------------------
//   #1 setup .................. enable SSO in OAuth2 mode (ssoCallbackUrl="")
//   #2 I1(c) forged header, proxy OFF ....... header ignored (RED-able)
//   #3 I1(b) proxy ON, host NOT allowlisted . header ignored
//   #4 I1(b) proxy ON, host allowlisted ..... trusted host IS used
//   #5 I1(a) explicit ssoCallbackUrl ........ headers ignored entirely
//   #6 I2    two-stage pinning .............. /callback token exchange carries
//                                             the /authorize-time redirect_uri,
//                                             not a freshly forged one
//
// NOTES
//   - Real daemon + panel booted by globalSetup; all calls are real HTTP.
//   - /authorize and /callback are PUBLIC (permission token:false, level:null),
//     so no login/API key is needed to exercise the vulnerable surface.
//   - Test #6 runs a tiny local IdP stand-in (token + userinfo endpoints) so we
//     can capture the exact `redirect_uri` the panel sends in the token POST.
// ============================================================================

const SSO_AUTHORIZE_URL = "https://idp.example/authorize";

// GET /api/auth/sso/authorize with arbitrary headers. Returns the raw 302
// Location (which embeds the IdP URL, its `redirect_uri` and `state`) plus the
// session cookie the panel set for this flow.
async function authorize(headers: Record<string, string>) {
  const res = await axios.get(`${world.panelUrl}/api/auth/sso/authorize`, {
    headers,
    maxRedirects: 0,
    validateStatus: () => true,
    timeout: 30000
  });
  const setCookie: string[] = res.headers["set-cookie"] || [];
  return {
    status: res.status,
    location: String(res.headers.location || ""),
    cookie: setCookie.map((c) => c.split(";")[0]).join("; ")
  };
}

// The `redirect_uri` query parameter of the IdP authorization URL the panel
// returned (this is exactly what the IdP will send the code to).
function redirectUriOf(location: string): string {
  return String(new URL(location).searchParams.get("redirect_uri") || "");
}

function hostOf(url: string): string {
  return new URL(url).host;
}

describe("security: SSO redirect_uri must never be derived from untrusted headers", () => {
  it("setup: enable SSO in OAuth2 mode with an EMPTY ssoCallbackUrl (the default vulnerable config)", async () => {
    // OAuth2 mode (not OIDC) is used because enabling it needs no live network
    // call (OIDC enable runs a live issuer discovery). All URLs are dummies.
    await setSetting({
      ssoEnabled: true,
      ssoType: "oauth2",
      ssoAuthorizeUrl: SSO_AUTHORIZE_URL,
      ssoTokenUrl: "https://idp.example/token",
      ssoUserinfoUrl: "https://idp.example/userinfo",
      ssoClientId: "sso-int-client",
      ssoClientSecret: "sso-int-secret",
      ssoCallbackUrl: "",
      ssoAllowedRedirectHosts: "",
      reverseProxyMode: false
    });
  });

  // (I1c) reverse proxy OFF: a forged X-Forwarded-Host must be ignored and the
  // redirect_uri derived from server config (http://localhost:<port>).
  it("forged X-Forwarded-Host with reverse-proxy OFF is ignored (redirect_uri is server-derived)", async () => {
    await setSetting({ reverseProxyMode: false, ssoAllowedRedirectHosts: "" });

    const r = await authorize({
      "X-Forwarded-Host": "evil.example",
      "X-Forwarded-Proto": "https"
    });

    expect(r.status, `expected a 302 to the IdP, got ${r.status}`).toBe(302);
    expect(r.location, "must still redirect to the configured IdP authorize URL").toContain(
      "idp.example/authorize"
    );

    const ru = redirectUriOf(r.location);
    expect(ru, "redirect_uri must be present").toBeTruthy();
    // THE SECURITY ASSERTION: the attacker host must not appear.
    expect(hostOf(ru)).not.toBe("evil.example");
    expect(new URL(ru).hostname, "fallback derives from server config, not the header").toBe(
      "localhost"
    );
  });

  // (I1b) reverse proxy ON but the forwarded host is NOT on the allowlist:
  // still ignored. Enabling proxy mode alone must not re-open the hole.
  it("forged X-Forwarded-Host with reverse-proxy ON but NOT allowlisted is still ignored", async () => {
    await setSetting({ reverseProxyMode: true, ssoAllowedRedirectHosts: "" });

    const r = await authorize({
      "X-Forwarded-Host": "evil.example",
      "X-Forwarded-Proto": "https"
    });
    const ru = redirectUriOf(r.location);

    expect(r.status).toBe(302);
    expect(hostOf(ru), "empty allowlist = trust no forwarded header").not.toBe("evil.example");
    expect(new URL(ru).hostname).toBe("localhost");
  });

  // (I1b) reverse proxy ON and the host IS allowlisted: this is the ONLY case
  // where a forwarded host may influence redirect_uri (legit reverse-proxy use).
  it("reverse-proxy ON + allowlisted host: the forwarded host IS trusted (legit path)", async () => {
    await setSetting({
      reverseProxyMode: true,
      ssoAllowedRedirectHosts: "panel.example.com"
    });

    const ok = await authorize({
      "X-Forwarded-Host": "panel.example.com",
      "X-Forwarded-Proto": "https"
    });
    expect(hostOf(redirectUriOf(ok.location)), "allowlisted host is used").toBe(
      "panel.example.com"
    );

    // A different, non-allowlisted host in the same config is still rejected.
    const bad = await authorize({
      "X-Forwarded-Host": "other.example.com",
      "X-Forwarded-Proto": "https"
    });
    expect(hostOf(redirectUriOf(bad.location)), "non-allowlisted host is rejected").not.toBe(
      "other.example.com"
    );
  });

  // (I1a) explicit ssoCallbackUrl wins unconditionally and headers are ignored.
  it("explicit ssoCallbackUrl wins: signed request headers cannot change redirect_uri", async () => {
    const fixed = "https://registered.example/api/auth/sso/callback";
    await setSetting({ ssoCallbackUrl: fixed, reverseProxyMode: true, ssoAllowedRedirectHosts: "panel.example.com" });

    const r = await authorize({
      "X-Forwarded-Host": "evil.example",
      "X-Forwarded-Proto": "https"
    });
    expect(redirectUriOf(r.location), "configured callback always wins").toBe(fixed);
  });
});

// ---------------------------------------------------------------------------
// (I2) Two-stage pinning. This needs an IdP stand-in so we can see the exact
// `redirect_uri` the panel sends in the token POST. We boot a tiny HTTP server
// that plays both the token and userinfo endpoints, then:
//   1. /authorize   with forged host first.attacker.example -> capture `state`
//      and the session cookie; the panel pins the (fixed) redirect_uri.
//   2. /callback    with the SAME session cookie but a DIFFERENT forged host
//      second.attacker.example; the panel must use the PINNED value, so the
//      token POST must carry the /authorize-time redirect_uri, not the new one.
// ---------------------------------------------------------------------------
describe("security: SSO callback pins the authorize-time redirect_uri", () => {
  let server: http.Server;
  let tokenBody = "";

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        if (req.url === "/token") {
          tokenBody = body;
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ access_token: "integration-access-token", token_type: "Bearer" }));
        } else if (req.url === "/userinfo") {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ id: "sso-int-user", sub: "sso-int-user" }));
        } else {
          res.writeHead(404);
          res.end();
        }
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("the token exchange uses the /authorize-time redirect_uri, not a mid-flow forged one", async () => {
    const port = (server.address() as any).port as number;
    await setSetting({
      ssoCallbackUrl: "",
      reverseProxyMode: false,
      ssoAllowedRedirectHosts: "",
      ssoTokenUrl: `http://127.0.0.1:${port}/token`,
      ssoUserinfoUrl: `http://127.0.0.1:${port}/userinfo`
    });

    // Stage 1 — attacker starts the flow with a forged host.
    const auth = await authorize({ "X-Forwarded-Host": "first.attacker.example" });
    expect(auth.status).toBe(302);
    const idp = new URL(auth.location);
    const state = String(idp.searchParams.get("state") || "");
    const pinned = redirectUriOf(auth.location);
    expect(state, "the IdP URL must carry the flow state").toBeTruthy();
    expect(hostOf(pinned), "pinned redirect_uri must not be the attacker host").not.toBe(
      "first.attacker.example"
    );

    // Stage 2 — replay /callback with the SAME session but a DIFFERENT forged host.
    tokenBody = "";
    const cb = await axios.get(`${world.panelUrl}/api/auth/sso/callback`, {
      params: { code: "INTEGRATION_CODE", state },
      headers: { Cookie: auth.cookie, "X-Forwarded-Host": "second.attacker.example" },
      maxRedirects: 0,
      validateStatus: () => true,
      timeout: 30000
    });

    // The handler must have reached the token endpoint (proves it got past the
    // session/state checks and actually performed the exchange).
    expect(tokenBody, "the panel must POST to the token endpoint").toBeTruthy();
    const sentRedirectUri = String(
      new URLSearchParams(tokenBody).get("redirect_uri") || ""
    );
    expect(sentRedirectUri, "token exchange must send a redirect_uri").toBeTruthy();

    // THE SECURITY ASSERTION: the exchange reuses the pinned value and ignores
    // the forged header on this second request.
    expect(hostOf(sentRedirectUri), "callback must reuse the pinned redirect_uri").toBe(
      hostOf(pinned)
    );
    expect(hostOf(sentRedirectUri), "must NOT trust the callback's forged host").not.toBe(
      "second.attacker.example"
    );

    // The callback also lands in the unbound -> bind flow (302 to /#/sso/bind),
    // confirming the exchange + userinfo path completed.
    expect(cb.status, `callback status: ${cb.status}`).toBe(302);
  });
});
