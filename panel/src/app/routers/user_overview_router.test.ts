import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import { mockLog, mockOperationLogger, mockPassportService, mockSetting, mockUserSystem } from "../../../test/harness/mocks";

vi.mock("../setting", () => mockSetting());
vi.mock("../service/user_service", () => mockUserSystem());
vi.mock("../service/operation_logger", () => mockOperationLogger());
vi.mock("../service/passport_service", () => mockPassportService());
vi.mock("../service/log", () => mockLog());

import userOverviewRouter from "./user_overview_router";
import { createTestApp, resetSessions, unwrap } from "../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../test/harness/auth";
import { operationLogger } from "../service/operation_logger";
import userSystem from "../service/user_service";

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] };

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue({
    uuid: "u1",
    userName: "bob",
    permission: 10,
    instances: [],
    loginTime: "T",
    passWord: "x",
    salt: "y",
    secret: "z",
    apiKey: "a"
  } as any);
  vi.mocked(operationLogger.log).mockClear();
});

const app = createTestApp([userOverviewRouter]);

describe("PUT /api/auth/ (ADMIN)", () => {
  it("edits the user and returns true (no password -> no audit log)", async () => {
    const cred = asAdmin();
    const env = unwrap(
      await request(app.callback())
        .put("/api/auth/")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ uuid: "u1", config: { instances: ["r1"] } })
    );
    expect(env.status).toBe(200);
    expect(env.data).toBe(true);
    expect(userSystem.edit).toHaveBeenCalledWith("u1", { instances: ["r1"] });
    expect(operationLogger.log).not.toHaveBeenCalled();
  });

  it("audits a password reset (clears 2FA/secret, logs user_config_change)", async () => {
    const cred = asAdmin();
    const env = unwrap(
      await request(app.callback())
        .put("/api/auth/")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ uuid: "u1", config: { passWord: "NewPass#123" } })
    );
    expect(env.status).toBe(200);
    expect(env.data).toBe(true);
    expect(userSystem.edit).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ passWord: "NewPass#123", secret: "", open2FA: false })
    );
    expect(operationLogger.log).toHaveBeenCalled();
  });

  it("non-admin -> 403", async () => {
    vi.mocked(userSystem.getInstance).mockReturnValue({ uuid: "u", userName: "u", permission: 1, instances: [] } as any);
    const cred = asUser({ uuid: "u", userName: "u", permission: 1 });
    const env = unwrap(
      await request(app.callback())
        .put("/api/auth/")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ uuid: "u", config: {} })
    );
    expect(env.status).toBe(403);
  });
});

describe("GET /api/auth/overview (ADMIN)", () => {
  it("returns the user list shape", async () => {
    (userSystem as any).objects = new Map([
      ["u1", { uuid: "u1", userName: "alice", permission: 1, instances: [], loginTime: "T" }],
      ["u2", { uuid: "u2", userName: "bob", permission: 10, instances: [], loginTime: "T2" }]
    ]);
    const cred = asAdmin();
    const env = unwrap(await request(app.callback()).get("/api/auth/overview").set(cred.headers).query(tokenQuery(cred.token)));
    expect(env.status).toBe(200);
    expect(env.data).toHaveLength(2);
    expect(env.data.map((u: any) => u.userName).sort()).toEqual(["alice", "bob"]);
  });
});
