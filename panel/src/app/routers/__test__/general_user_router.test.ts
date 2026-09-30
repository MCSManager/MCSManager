import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import { mockLog, mockOperationLogger, mockPassportService, mockSetting, mockUserSystem } from "../../../../test/harness/mocks";

vi.mock("../../setting", () => mockSetting({ enableApiKey: true }));
vi.mock("../../service/user_service", () => mockUserSystem());
vi.mock("../../service/operation_logger", () => mockOperationLogger());
vi.mock("../../service/passport_service", () => mockPassportService());
vi.mock("../../service/log", () => mockLog());
vi.mock("../../service/instance_service", () => ({
  getInstancesByUuid: vi.fn(async (uuid: string) => ({ instances: [{ uuid }], rank: 1 }))
}));
vi.mock("../../service/permission_service", () => ({
  isTopPermissionByUuid: vi.fn(() => false),
  isTopPermission: vi.fn(() => false),
  isHaveInstance: vi.fn(() => true),
  isHaveInstanceByUuid: vi.fn(() => true)
}));

import generalUserRouter from "../general_user_router";
import { createTestApp, resetSessions, unwrap } from "../../../../test/harness/app";
import { asUser, tokenQuery } from "../../../../test/harness/auth";
import { systemConfig } from "../../setting";
import userSystem from "../../service/user_service";
import * as passport from "../../service/passport_service";
import { getInstancesByUuid } from "../../service/instance_service";

const USER = { uuid: "u1", userName: "alice", permission: 1 };

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(USER as any);
  (systemConfig as any).enableApiKey = true;
  vi.mocked(passport.getToken).mockImplementation((ctx: any) => ctx?.session?.token || "");
  vi.mocked(passport.confirm2FaQRCode).mockClear();
  vi.mocked(passport.bind2FA).mockClear();
});

const app = createTestApp([generalUserRouter]);

describe("GET /api/auth/token (USER, token:false)", () => {
  it("returns the session token for an Ajax request", async () => {
    const cred = asUser(USER);
    const env = unwrap(await request(app.callback()).get("/api/auth/token").set(cred.headers));
    expect(env.status).toBe(200);
    expect(env.data).toBe(cred.session.token);
  });

  it("rejects a non-Ajax request with 500 (handler throws)", async () => {
    const cred = asUser(USER);
    const headers = { "x-test-session-id": cred.headers["x-test-session-id"] };
    const env = unwrap(await request(app.callback()).get("/api/auth/token").set(headers));
    expect(env.status).toBe(500);
    expect(String(env.data)).toContain("Ajax");
  });
});

describe("GET /api/auth/ (USER, token:false)", () => {
  it("returns the user instances + token for an Ajax request", async () => {
    const cred = asUser(USER);
    const env = unwrap(await request(app.callback()).get("/api/auth/").set(cred.headers));
    expect(env.status).toBe(200);
    expect(env.data.instances).toEqual([{ uuid: "u1" }]);
    expect(env.data.token).toBe(cred.session.token);
    expect(getInstancesByUuid).toHaveBeenCalled();
  });
});

describe("PUT /api/auth/update (USER, token:true) [review-focus #1]", () => {
  it("updates + logs out when the token matches -> 200", async () => {
    const cred = asUser(USER);
    const env = unwrap(
      await request(app.callback())
        .put("/api/auth/update")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ passWord: "NewPass#123", isInit: false })
    );
    expect(env.status).toBe(200);
    expect(env.data).toBe(true);
    expect(userSystem.edit).toHaveBeenCalledWith("u1", expect.objectContaining({ passWord: "NewPass#123" }));
    expect(passport.logout).toHaveBeenCalled();
  });

  it("rejects a mismatched ?token= with 403", async () => {
    const cred = asUser(USER, { tokenMismatch: true });
    const env = unwrap(
      await request(app.callback())
        .put("/api/auth/update")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ passWord: "NewPass#123" })
    );
    expect(env.status).toBe(403);
  });

  it("rejects a request missing the Ajax header with 403", async () => {
    const cred = asUser(USER);
    const headers = { "x-test-session-id": cred.headers["x-test-session-id"] };
    const env = unwrap(
      await request(app.callback())
        .put("/api/auth/update")
        .set(headers)
        .query(tokenQuery(cred.token))
        .send({ passWord: "NewPass#123" })
    );
    expect(env.status).toBe(403);
  });
});

describe("PUT /api/auth/api (USER, token:true)", () => {
  it("generates a new apiKey when enable=true and apiKey enabled -> returns the key", async () => {
    const cred = asUser(USER);
    const env = unwrap(
      await request(app.callback())
        .put("/api/auth/api")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ enable: true })
    );
    expect(env.status).toBe(200);
    expect(typeof env.data).toBe("string");
    expect((env.data as string).length).toBeGreaterThan(0);
    expect(userSystem.edit).toHaveBeenCalledWith("u1", expect.objectContaining({ apiKey: expect.any(String) }));
  });

  it("refuses enabling the api key when apiKey is disabled (500 via handler catch)", async () => {
    (systemConfig as any).enableApiKey = false;
    const cred = asUser(USER);
    const env = unwrap(
      await request(app.callback())
        .put("/api/auth/api")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ enable: true })
    );
    expect(env.status).toBe(500);
  });
});

describe("POST /api/auth/bind2fa (level 1)", () => {
  it("returns the QR data url", async () => {
    vi.mocked(passport.bind2FA).mockResolvedValue("data:image/png;base64,QR");
    const cred = asUser(USER);
    const env = unwrap(await request(app.callback()).post("/api/auth/bind2fa").set(cred.headers).query(tokenQuery(cred.token)));
    expect(env.status).toBe(200);
    expect(env.data).toBe("data:image/png;base64,QR");
  });
});

describe("POST /api/auth/confirm2fa (level 1, validator enable/TOTPCode)", () => {
  it("enables 2FA when check2FA passes -> true", async () => {
    vi.mocked(userSystem.check2FA).mockReturnValue(true);
    const cred = asUser(USER);
    const env = unwrap(
      await request(app.callback())
        .post("/api/auth/confirm2fa")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ enable: true, TOTPCode: "123456" })
    );
    expect(env.status).toBe(200);
    expect(env.data).toBe(true);
    expect(passport.confirm2FaQRCode).toHaveBeenCalledWith("u1", true);
  });

  // NOTE: the handler sets `ctx.body = false` to mean "TOTP invalid, not enabled",
  // but protocol.middleware treats false/null/undefined as "empty -> processing
  // failed" so the envelope is {status:500, data:null}. See
  // docs/test-doubts/panel-protocol-falsey-is-500.md for the general quirk.
  it("refuses to enable when check2FA fails -> false surfaces as 500/null (protocol falsey quirk)", async () => {
    vi.mocked(userSystem.check2FA).mockReturnValue(false);
    const cred = asUser(USER);
    const env = unwrap(
      await request(app.callback())
        .post("/api/auth/confirm2fa")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ enable: true, TOTPCode: "000000" })
    );
    expect(env.status).toBe(500);
    expect(env.data).toBeNull();
    expect(passport.confirm2FaQRCode).not.toHaveBeenCalled();
  });
});
