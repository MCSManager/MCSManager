import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import { mockLog, mockOperationLogger, mockPassportService, mockSetting, mockUserSystem } from "../../../../test/harness/mocks";

// Mock boundary modules BEFORE importing login_router. Paths are relative to this
// co-located test file, identical to the specifiers login_router itself uses.
// Factories must not reference top-level locals (vi.mock is hoisted) -> call imports inline.
vi.mock("../../setting", () => mockSetting({ loginInfo: "hello", language: "en_us", ssoEnabled: false, ssoOnlyMode: false }));
vi.mock("../../service/user_service", () => mockUserSystem());
vi.mock("../../service/operation_logger", () => mockOperationLogger());
vi.mock("../../service/passport_service", () => mockPassportService());
vi.mock("../../service/log", () => mockLog());
vi.mock("axios", () => ({ default: { request: vi.fn(async () => ({ status: 200, data: { ok: 1 } })) } }));

import loginRouter from "../login_router";
import { createTestApp, resetSessions, unwrap } from "../../../../test/harness/app";
import { asAdmin, asUser, asPublic, tokenQuery } from "../../../../test/harness/auth";
import { operationLogger } from "../../service/operation_logger";
import { systemConfig } from "../../setting";
import userSystem, { TwoFactorError } from "../../service/user_service";
import * as passport from "../../service/passport_service";
import axios from "axios";

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] };

const app = createTestApp([loginRouter]);

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  vi.mocked(operationLogger.info).mockClear();
  vi.mocked(operationLogger.warning).mockClear();
  vi.mocked(passport.login).mockReturnValue("tok-from-login");
  vi.mocked(passport.checkBanIp).mockReturnValue(true);
  vi.mocked(passport.check).mockReturnValue(false);
  vi.mocked((axios as any).request as any).mockClear?.();
  // reset sso flags between tests (mutate the mocked systemConfig singleton)
  (systemConfig as any).ssoEnabled = false;
  (systemConfig as any).ssoOnlyMode = false;
});

describe("POST /api/auth/login", () => {
  it("returns the login token and logs user_login", async () => {
    const res = await request(app.callback())
      .post("/api/auth/login")
      .send({ username: "admin", password: "Admin#12345" });
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toBe("tok-from-login");
    expect(operationLogger.info).toHaveBeenCalledWith(
      "user_login",
      expect.objectContaining({ operator_name: "admin", login_result: true })
    );
  });

  // Review focus #3: validator rejects a missing required field BEFORE the handler.
  it("rejects a missing password with envelope status 400 (Validator failed)", async () => {
    const res = await request(app.callback()).post("/api/auth/login").send({ username: "admin" });
    const env = unwrap(res);
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("Validator failed");
    expect(String(env.data)).toContain("password");
  });

  it("returns NEED_2FA when 2FA is required and an empty code is given", async () => {
    vi.mocked(passport.login).mockImplementation(() => {
      throw new TwoFactorError("2FA required");
    });
    const res = await request(app.callback())
      .post("/api/auth/login")
      .send({ username: "admin", password: "x", code: "" });
    expect(unwrap(res).data).toBe("NEED_2FA");
  });

  it("surfaces a wrong-credential error as an error envelope (500)", async () => {
    vi.mocked(passport.login).mockImplementation(() => {
      throw new Error("invalid credentials");
    });
    const env = unwrap(
      await request(app.callback()).post("/api/auth/login").send({ username: "admin", password: "x", code: "" })
    );
    expect(env.status).toBe(500);
    expect(String(env.data)).toContain("invalid credentials");
    expect(operationLogger.warning).toHaveBeenCalled();
  });

  // The ban throw sits OUTSIDE the handler's try/catch, so it propagates to the
  // validator() middleware, which wraps `await next()` in try/catch and converts
  // any downstream throw into a 400 with the error message. (The wrong-credential
  // case above is different: that error is caught inside the handler's own try and
  // surfaces as ctx.body=Error -> protocol 500.)
  it("rejects with a ban message when the IP is banned (checkBanIp false -> 400 via validator)", async () => {
    vi.mocked(passport.checkBanIp).mockReturnValue(false);
    const env = unwrap(
      await request(app.callback()).post("/api/auth/login").send({ username: "admin", password: "x", code: "" })
    );
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("banned");
  });
});

describe("GET /api/auth/logout", () => {
  it("logs out and returns true (public route)", async () => {
    const env = unwrap(await request(app.callback()).get("/api/auth/logout"));
    expect(env.status).toBe(200);
    expect(env.data).toBe(true);
    expect(passport.logout).toHaveBeenCalled();
  });
});

describe("POST /api/auth/install (validator username/password)", () => {
  it("creates the admin and returns true when no users exist", async () => {
    (userSystem as any).objects = new Map();
    vi.mocked(userSystem.validatePassword).mockReturnValue(true);
    const env = unwrap(
      await request(app.callback()).post("/api/auth/install").send({ username: "admin", password: "Admin#12345" })
    );
    expect(env.status).toBe(200);
    expect(env.data).toBe(true);
    expect(userSystem.create).toHaveBeenCalledWith(expect.objectContaining({ userName: "admin", permission: 10 }));
  });

  it("refuses install when users already exist (error -> 400 via validator, message)", async () => {
    (userSystem as any).objects = new Map([["any", { userName: "x" }]]);
    const env = unwrap(
      await request(app.callback()).post("/api/auth/install").send({ username: "admin", password: "Admin#12345" })
    );
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("already been created");
  });
});

describe("ALL /api/auth/proxy (ADMIN, validator query target)", () => {
  it("admin proxies the target URL via axios and returns its data", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/auth/proxy")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&target=https://example.com`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toEqual({ ok: 1 });
    expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({ url: "https://example.com" }));
  });

  it("non-admin user gets 403 (insufficient level)", async () => {
    vi.mocked(userSystem.getInstance).mockReturnValue({ uuid: "u", userName: "u", permission: 1, instances: [] } as any);
    const cred = asUser({ uuid: "u", userName: "u", permission: 1 });
    const env = unwrap(
      await request(app.callback())
        .get("/api/auth/proxy")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&target=https://example.com`)
    );
    expect(env.status).toBe(403);
  });
});
