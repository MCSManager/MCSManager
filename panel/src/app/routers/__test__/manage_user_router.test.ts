import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import { mockLog, mockOperationLogger, mockPassportService, mockSetting, mockUserSystem } from "../../../../test/harness/mocks";

vi.mock("../../setting", () => mockSetting());
vi.mock("../../service/user_service", () => mockUserSystem());
vi.mock("../../service/operation_logger", () => mockOperationLogger());
vi.mock("../../service/passport_service", () => mockPassportService());
vi.mock("../../service/log", () => mockLog());

import manageUserRouter from "../manage_user_router";
import { createTestApp, resetSessions, unwrap } from "../../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../../test/harness/auth";
import { operationLogger } from "../../service/operation_logger";
import userSystem from "../../service/user_service";
import * as passport from "../../service/passport_service";

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] };

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  vi.mocked(userSystem.getUserByUuid).mockReturnValue({ userName: "bob" } as any);
  vi.mocked(operationLogger.log).mockClear();
});

const app = createTestApp([manageUserRouter]);

describe("POST /api/auth/ (ADMIN, validator username/password/permission)", () => {
  it("creates a user and returns the new record", async () => {
    vi.mocked(passport.register).mockResolvedValue({ uuid: "new-uuid", userName: "bob", permission: 1 });
    const cred = asAdmin();
    const env = unwrap(
      await request(app.callback())
        .post("/api/auth/")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ username: "bob", password: "Pass#123", permission: 1 })
    );
    expect(env.status).toBe(200);
    expect(env.data).toEqual({ uuid: "new-uuid", userName: "bob", permission: 1 });
    expect(passport.register).toHaveBeenCalledWith(expect.anything(), "bob", "Pass#123", 1);
    expect(operationLogger.log).toHaveBeenCalledWith("user_create", expect.any(Object));
  });

  it("rejects a missing permission field with 400 (Validator)", async () => {
    const cred = asAdmin();
    const env = unwrap(
      await request(app.callback())
        .post("/api/auth/")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ username: "bob", password: "Pass#123" })
    );
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("Validator failed");
  });

  it("rejects a weak password and an existing username with 400 (via validator catch)", async () => {
    const cred = asAdmin();
    vi.mocked(userSystem.validatePassword).mockReturnValue(false);
    let env = unwrap(
      await request(app.callback())
        .post("/api/auth/")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ username: "bob", password: "x", permission: 1 })
    );
    expect(env.status).toBe(400);

    vi.mocked(userSystem.validatePassword).mockReturnValue(true);
    vi.mocked(userSystem.existUserName).mockReturnValue(true);
    env = unwrap(
      await request(app.callback())
        .post("/api/auth/")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ username: "bob", password: "Pass#123", permission: 1 })
    );
    expect(env.status).toBe(400);
  });
});

describe("DELETE /api/auth/ (ADMIN)", () => {
  it("deletes each listed uuid and returns true", async () => {
    const cred = asAdmin();
    const env = unwrap(
      await request(app.callback())
        .del("/api/auth/")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send(["u1", "u2"])
    );
    expect(env.status).toBe(200);
    expect(env.data).toBe(true);
    expect(userSystem.deleteInstance).toHaveBeenCalledWith("u1");
    expect(userSystem.deleteInstance).toHaveBeenCalledWith("u2");
  });

  it("non-admin -> 403", async () => {
    vi.mocked(userSystem.getInstance).mockReturnValue({ uuid: "u", userName: "u", permission: 1, instances: [] } as any);
    const cred = asUser({ uuid: "u", userName: "u", permission: 1 });
    const env = unwrap(
      await request(app.callback())
        .del("/api/auth/")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send(["u1"])
    );
    expect(env.status).toBe(403);
  });
});

describe("GET /api/auth/search (ADMIN, validator page/page_size)", () => {
  it("returns a sanitized page and clamps page/page_size", async () => {
    vi.mocked(userSystem.getQueryWrapper).mockReturnValue({
      selectPage: vi.fn(() => ({
        total: 1,
        data: [{ userName: "u", passWord: "x", salt: "y", apiKey: "secret-key", permission: 1 }]
      })) as any
    });
    const cred = asAdmin();
    const env = unwrap(
      await request(app.callback())
        .get("/api/auth/search")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&page=0&page_size=999`)
    );
    expect(env.status).toBe(200);
    expect(env.data.data[0].passWord).toBe("");
    expect(env.data.data[0].salt).toBe("");
    expect(env.data.data[0].apiKey).toBe("__MCSM_SECRET_DATA__");
    // page clamped to 1, page_size to 50
    expect(userSystem.getQueryWrapper).toHaveBeenCalled();
  });
});
