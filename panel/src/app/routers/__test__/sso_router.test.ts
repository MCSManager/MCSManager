import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import {
  mockLog,
  mockOperationLogger,
  mockPassportService,
  mockSetting,
  mockUserSystem
} from "../../../../test/harness/mocks";

// Boundary mocks. Paths mirror the specifiers sso_router itself uses
// (co-located test file -> same relative paths). The REAL permission, validator
// and protocol-envelope middleware run; transitive deps are swapped for the
// shared in-memory factories.
vi.mock("../../setting", () =>
  mockSetting({ language: "en_us", ssoEnabled: false, ssoType: "oidc" })
);

// user_service: extend the shared mockUserSystem with the SSO-specific methods
// the sso_router calls (getUserBySsoSub, bindSso, unbindSso).
vi.mock("../../service/user_service", () => {
  const base = mockUserSystem();
  (base.default as any).getUserBySsoSub = vi.fn(() => null);
  (base.default as any).bindSso = vi.fn(async () => undefined);
  (base.default as any).unbindSso = vi.fn(async () => undefined);
  return base;
});

vi.mock("../../service/passport_service", () => mockPassportService());
vi.mock("../../service/log", () => mockLog());
vi.mock("../../service/operation_logger", () => mockOperationLogger());

// sso_service: inline mock so the router's delegation surface (buildAuthorizationUrl,
// handleOIDCCallback, handleOAuth2Callback, getPublicSsoConfig, getCallbackUrl,
// state/nonce/verifier generators) is fully isolated from the real openid-client /
// fetch dependencies.
vi.mock("../../service/sso_service", () => ({
  buildAuthorizationUrl: vi.fn(async () => "https://idp.example.com/oauth/authorize"),
  generateCodeVerifier: vi.fn(() => "verifier-123"),
  generateNonce: vi.fn(() => "nonce-123"),
  generateState: vi.fn(() => "state-123"),
  getCallbackUrl: vi.fn(() => "http://localhost:23333/api/auth/sso/callback"),
  getPublicSsoConfig: vi.fn(() => ({
    enabled: true,
    onlyMode: false,
    autoRedirect: false,
    providerName: "TestIdP",
    iconUrl: "https://example.com/icon.png"
  })),
  handleOAuth2Callback: vi.fn(async () => ({ sub: "oauth2:user1", claims: {} })),
  handleOIDCCallback: vi.fn(async () => ({ sub: "oidc:user1", claims: {} }))
}));

// permission, entity/user, validator, i18n stay REAL.

import ssoRouter from "../sso_router";
import { createTestApp, registerSession, resetSessions, unwrap } from "../../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../../test/harness/auth";
import {
  buildAuthorizationUrl,
  getPublicSsoConfig,
  handleOAuth2Callback,
  handleOIDCCallback
} from "../../service/sso_service";
import { operationLogger } from "../../service/operation_logger";
import { checkBanIp, loginSuccess } from "../../service/passport_service";
import userSystem from "../../service/user_service";
import { systemConfig } from "../../setting";

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };

const app = createTestApp([ssoRouter]);

// Helper: register a session with arbitrary data and return the headers to
// reference it via the x-test-session-id header the harness reads.
function seedSession(data: Record<string, any> = {}) {
  const session: any = {
    save: vi.fn(),
    maxAge: -1,
    SESSION_REQ_TIMES: [],
    ...data
  };
  const { id } = registerSession(session);
  return { headers: { "x-test-session-id": id }, session };
}

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  vi.mocked(userSystem.getUserBySsoSub).mockReturnValue(null as any);
  vi.mocked(userSystem.getUserByUserName).mockReturnValue(null as any);
  vi.mocked(userSystem.getUserByUuid).mockReturnValue(null as any);
  vi.mocked(userSystem.checkUser).mockImplementation(() => {});
  vi.mocked(userSystem.bindSso).mockClear();
  vi.mocked(userSystem.unbindSso).mockClear();
  vi.mocked(checkBanIp).mockReturnValue(true);
  vi.mocked(checkBanIp).mockClear();
  vi.mocked(loginSuccess).mockReturnValue("tok-from-login");
  vi.mocked(loginSuccess).mockClear();
  vi.mocked(buildAuthorizationUrl).mockClear();
  vi.mocked(buildAuthorizationUrl).mockResolvedValue("https://idp.example.com/oauth/authorize");
  vi.mocked(handleOIDCCallback).mockClear();
  vi.mocked(handleOIDCCallback).mockResolvedValue({ sub: "oidc:user1", claims: {} });
  vi.mocked(handleOAuth2Callback).mockClear();
  vi.mocked(handleOAuth2Callback).mockResolvedValue({ sub: "oauth2:user1", claims: {} });
  vi.mocked(getPublicSsoConfig).mockClear();
  vi.mocked(getPublicSsoConfig).mockReturnValue({
    enabled: true,
    onlyMode: false,
    autoRedirect: false,
    providerName: "TestIdP",
    iconUrl: "https://example.com/icon.png"
  });
  vi.mocked(operationLogger.info).mockClear();
  vi.mocked(operationLogger.log).mockClear();
  (systemConfig as any).ssoEnabled = false;
  (systemConfig as any).ssoType = "oidc";
});

describe("GET /auth/sso/config (public)", () => {
  it("returns the public SSO config shape from getPublicSsoConfig()", async () => {
    const res = await request(app.callback()).get("/api/auth/sso/config");
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(getPublicSsoConfig).toHaveBeenCalled();
    expect(env.data).toEqual({
      enabled: true,
      onlyMode: false,
      autoRedirect: false,
      providerName: "TestIdP",
      iconUrl: "https://example.com/icon.png"
    });
  });
});

describe("GET /auth/sso/authorize (public)", () => {
  it("redirects to the IdP authorization URL (302) and consults checkBanIp", async () => {
    (systemConfig as any).ssoEnabled = true;
    const res = await request(app.callback())
      .get("/api/auth/sso/authorize")
      .redirects(0);
    const env = unwrap(res);
    expect(env.status).toBe(302);
    expect(res.headers.location).toContain("idp.example.com/oauth/authorize");
    expect(checkBanIp).toHaveBeenCalled();
    expect(buildAuthorizationUrl).toHaveBeenCalled();
  });

  it("rejects with 403 ban message when checkBanIp returns false", async () => {
    (systemConfig as any).ssoEnabled = true;
    vi.mocked(checkBanIp).mockReturnValue(false);
    const res = await request(app.callback())
      .get("/api/auth/sso/authorize")
      .redirects(0);
    const env = unwrap(res);
    expect(env.status).toBe(403);
    expect(String(env.data)).toContain("banned");
    expect(buildAuthorizationUrl).not.toHaveBeenCalled();
  });

  it("returns 403 'SSO is not enabled' when ssoEnabled is false", async () => {
    const res = await request(app.callback())
      .get("/api/auth/sso/authorize")
      .redirects(0);
    const env = unwrap(res);
    expect(env.status).toBe(403);
    expect(String(env.data)).toContain("SSO is not enabled");
  });
});

describe("GET /auth/sso/callback (public)", () => {
  it("OIDC success + user NOT bound -> 302 redirect to /#/sso/bind", async () => {
    (systemConfig as any).ssoEnabled = true;
    (systemConfig as any).ssoType = "oidc";
    vi.mocked(userSystem.getUserBySsoSub).mockReturnValue(null);
    const s = seedSession({
      ssoState: "state-123",
      ssoNonce: "nonce-123",
      ssoCodeVerifier: "verifier-123",
      ssoTimestamp: Date.now()
    });
    const res = await request(app.callback())
      .get("/api/auth/sso/callback")
      .set(s.headers)
      .query("code=valid-code&state=state-123")
      .redirects(0);
    const env = unwrap(res);
    expect(env.status).toBe(302);
    expect(res.headers.location).toContain("/#/sso/bind");
    expect(handleOIDCCallback).toHaveBeenCalled();
  });

  it("OIDC success + user IS bound -> loginSuccess + 302 redirect to /#/sso/callback", async () => {
    (systemConfig as any).ssoEnabled = true;
    (systemConfig as any).ssoType = "oidc";
    const boundUser = { uuid: "u1", userName: "alice" };
    vi.mocked(userSystem.getUserBySsoSub).mockReturnValue(boundUser as any);
    const s = seedSession({
      ssoState: "state-123",
      ssoNonce: "nonce-123",
      ssoCodeVerifier: "verifier-123",
      ssoTimestamp: Date.now()
    });
    const res = await request(app.callback())
      .get("/api/auth/sso/callback")
      .set(s.headers)
      .query("code=valid-code&state=state-123")
      .redirects(0);
    const env = unwrap(res);
    expect(env.status).toBe(302);
    expect(res.headers.location).toContain("/#/sso/callback");
    expect(loginSuccess).toHaveBeenCalledWith(expect.anything(), "alice");
    expect(operationLogger.info).toHaveBeenCalledWith(
      "user_login",
      expect.objectContaining({ login_method: "sso", login_result: true })
    );
  });

  it("OAuth2 success -> handleOAuth2Callback + 302 redirect to /#/sso/bind", async () => {
    (systemConfig as any).ssoEnabled = true;
    (systemConfig as any).ssoType = "oauth2";
    vi.mocked(userSystem.getUserBySsoSub).mockReturnValue(null);
    const s = seedSession({
      ssoState: "state-123",
      ssoCodeVerifier: "verifier-123",
      ssoTimestamp: Date.now()
    });
    const res = await request(app.callback())
      .get("/api/auth/sso/callback")
      .set(s.headers)
      .query("code=valid-code&state=state-123")
      .redirects(0);
    const env = unwrap(res);
    expect(env.status).toBe(302);
    expect(res.headers.location).toContain("/#/sso/bind");
    expect(handleOAuth2Callback).toHaveBeenCalled();
    expect(handleOIDCCallback).not.toHaveBeenCalled();
  });

  it("callback failure -> 302 redirect to /#/login with sso_error param", async () => {
    (systemConfig as any).ssoEnabled = true;
    (systemConfig as any).ssoType = "oidc";
    vi.mocked(handleOIDCCallback).mockRejectedValue(new Error("OIDC token exchange failed"));
    const s = seedSession({
      ssoState: "state-123",
      ssoNonce: "nonce-123",
      ssoCodeVerifier: "verifier-123",
      ssoTimestamp: Date.now()
    });
    const res = await request(app.callback())
      .get("/api/auth/sso/callback")
      .set(s.headers)
      .query("code=bad-code&state=state-123")
      .redirects(0);
    const env = unwrap(res);
    expect(env.status).toBe(302);
    expect(res.headers.location).toContain("sso_error");
  });

  it("invalid session (no ssoState) -> 302 redirect to invalid_sso_session", async () => {
    (systemConfig as any).ssoEnabled = true;
    // Session without ssoState / ssoCodeVerifier
    const s = seedSession({});
    const res = await request(app.callback())
      .get("/api/auth/sso/callback")
      .set(s.headers)
      .redirects(0);
    const env = unwrap(res);
    expect(env.status).toBe(302);
    expect(res.headers.location).toContain("invalid_sso_session");
    expect(handleOIDCCallback).not.toHaveBeenCalled();
  });
});

describe("GET /auth/sso/bind-status (public)", () => {
  it("returns {pending: false} when SSO is disabled", async () => {
    const res = await request(app.callback()).get("/api/auth/sso/bind-status");
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toEqual({ pending: false });
  });

  it("returns {pending: true} when SSO enabled + session has a pending bind", async () => {
    (systemConfig as any).ssoEnabled = true;
    vi.mocked(userSystem.getUserBySsoSub).mockReturnValue(null);
    const s = seedSession({
      ssoBindSub: "sso-sub-123",
      ssoBindTimestamp: Date.now()
    });
    const res = await request(app.callback())
      .get("/api/auth/sso/bind-status")
      .set(s.headers);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toEqual({ pending: true });
  });
});

describe("POST /auth/sso/bind (public, validator body username/password)", () => {
  it("binds the SSO sub to the existing account and returns the login token", async () => {
    (systemConfig as any).ssoEnabled = true;
    vi.mocked(userSystem.getUserBySsoSub).mockReturnValue(null);
    vi.mocked(userSystem.getUserByUserName).mockReturnValue({
      uuid: "u1",
      userName: "alice",
      ssoBound: false,
      ssoSub: ""
    } as any);
    vi.mocked(userSystem.bindSso).mockResolvedValue(undefined);
    vi.mocked(loginSuccess).mockReturnValue("tok-bind");
    const s = seedSession({
      ssoBindSub: "sso-sub-123",
      ssoBindTimestamp: Date.now()
    });
    const res = await request(app.callback())
      .post("/api/auth/sso/bind")
      .set(s.headers)
      .send({ username: "alice", password: "Password123" });
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toBe("tok-bind");
    expect(userSystem.bindSso).toHaveBeenCalledWith("u1", "sso-sub-123");
    expect(loginSuccess).toHaveBeenCalledWith(expect.anything(), "alice");
    expect(operationLogger.info).toHaveBeenCalledWith(
      "user_login",
      expect.objectContaining({ login_method: "sso_bind" })
    );
  });

  it("rejects a missing password with envelope 400 (Validator failed)", async () => {
    (systemConfig as any).ssoEnabled = true;
    const res = await request(app.callback())
      .post("/api/auth/sso/bind")
      .send({ username: "alice" });
    const env = unwrap(res);
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("Validator failed");
    expect(String(env.data)).toContain("password");
  });

  it("returns 403 'SSO is not enabled' when ssoEnabled is false", async () => {
    const res = await request(app.callback())
      .post("/api/auth/sso/bind")
      .send({ username: "alice", password: "Password123" });
    const env = unwrap(res);
    expect(env.status).toBe(403);
    expect(String(env.data)).toContain("SSO is not enabled");
  });
});

describe("POST /auth/sso/bind-current (USER)", () => {
  it("binds the SSO sub to the current session user and returns true", async () => {
    (systemConfig as any).ssoEnabled = true;
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "u1",
      userName: "alice",
      permission: 1,
      instances: []
    } as any);
    vi.mocked(userSystem.getUserBySsoSub).mockReturnValue(null);
    vi.mocked(userSystem.getUserByUserName).mockReturnValue({
      uuid: "u1",
      userName: "alice",
      ssoBound: false,
      ssoSub: ""
    } as any);
    vi.mocked(userSystem.bindSso).mockResolvedValue(undefined);
    const cred = asUser({ uuid: "u1", userName: "alice", permission: 1 });
    cred.session.ssoBindSub = "sso-sub-456";
    cred.session.ssoBindTimestamp = Date.now();
    const res = await request(app.callback())
      .post("/api/auth/sso/bind-current")
      .set(cred.headers)
      .query(tokenQuery(cred.token))
      .send({});
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toBe(true);
    expect(userSystem.bindSso).toHaveBeenCalledWith("u1", "sso-sub-456");
    expect(operationLogger.info).toHaveBeenCalledWith(
      "user_login",
      expect.objectContaining({ login_method: "sso_bind_current" })
    );
  });

  it("public request (no session) -> 403", async () => {
    (systemConfig as any).ssoEnabled = true;
    const res = await request(app.callback())
      .post("/api/auth/sso/bind-current")
      .send({});
    const env = unwrap(res);
    expect(env.status).toBe(403);
    expect(userSystem.bindSso).not.toHaveBeenCalled();
  });

  it("returns 403 'SSO is not enabled' when ssoEnabled is false (even as a user)", async () => {
    (systemConfig as any).ssoEnabled = false;
    const cred = asUser({ uuid: "u1", userName: "alice", permission: 1 });
    const res = await request(app.callback())
      .post("/api/auth/sso/bind-current")
      .set(cred.headers)
      .query(tokenQuery(cred.token))
      .send({});
    const env = unwrap(res);
    expect(env.status).toBe(403);
    expect(String(env.data)).toContain("SSO is not enabled");
  });
});

describe("PUT /auth/sso/unbind (ADMIN, validator body uuid)", () => {
  it("unbinds SSO for the target user and returns true", async () => {
    vi.mocked(userSystem.getUserByUuid).mockReturnValue({
      uuid: "u1",
      userName: "alice"
    } as any);
    vi.mocked(userSystem.unbindSso).mockResolvedValue(undefined);
    const cred = asAdmin();
    const res = await request(app.callback())
      .put("/api/auth/sso/unbind")
      .set(cred.headers)
      .query(tokenQuery(cred.token))
      .send({ uuid: "u1" });
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toBe(true);
    expect(userSystem.unbindSso).toHaveBeenCalledWith("u1");
    expect(operationLogger.log).toHaveBeenCalledWith(
      "sso_unbind",
      expect.objectContaining({ target_user_name: "alice" }),
      "warning"
    );
  });

  it("rejects a missing uuid with envelope 400 (Validator failed)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .put("/api/auth/sso/unbind")
      .set(cred.headers)
      .query(tokenQuery(cred.token))
      .send({});
    const env = unwrap(res);
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("Validator failed");
    expect(String(env.data)).toContain("uuid");
  });

  it("non-admin user -> 403", async () => {
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "u",
      userName: "u",
      permission: 1,
      instances: []
    } as any);
    const cred = asUser({ uuid: "u", userName: "u", permission: 1 });
    const res = await request(app.callback())
      .put("/api/auth/sso/unbind")
      .set(cred.headers)
      .query(tokenQuery(cred.token))
      .send({ uuid: "u1" });
    const env = unwrap(res);
    expect(env.status).toBe(403);
    expect(userSystem.unbindSso).not.toHaveBeenCalled();
  });

  it("returns 400 'User not found' when the target uuid does not exist", async () => {
    vi.mocked(userSystem.getUserByUuid).mockReturnValue(null);
    const cred = asAdmin();
    const res = await request(app.callback())
      .put("/api/auth/sso/unbind")
      .set(cred.headers)
      .query(tokenQuery(cred.token))
      .send({ uuid: "missing-user" });
    const env = unwrap(res);
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("User not found");
    expect(userSystem.unbindSso).not.toHaveBeenCalled();
  });
});
