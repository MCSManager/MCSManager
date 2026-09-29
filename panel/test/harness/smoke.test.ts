import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import { mockLog, mockOperationLogger, mockPassportService, mockSetting, mockUserSystem } from "./mocks";

// Mock the boundary modules BEFORE login_router (and transitively permission.ts)
// load. Paths resolve from this test file.
vi.mock("../../src/app/setting", () => mockSetting({ loginInfo: "hello", language: "en_us" }));
vi.mock("../../src/app/service/user_service", () => mockUserSystem());
vi.mock("../../src/app/service/operation_logger", () => mockOperationLogger());
vi.mock("../../src/app/service/passport_service", () => mockPassportService());
vi.mock("../../src/app/service/log", () => mockLog());

import loginRouter from "../../src/app/routers/login_router";
import { createTestApp, resetSessions, unwrap } from "./app";

describe("harness: panel public routes via real router + supertest", () => {
  beforeEach(() => resetSessions());

  it("GET /api/auth/login_info returns {loginInfo} in the envelope", async () => {
    const app = createTestApp([loginRouter]);
    const res = await request(app.callback()).get("/api/auth/login_info");
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toEqual({ loginInfo: "hello" });
  });

  it("GET /api/auth/status returns isInstall + settings shape", async () => {
    const app = createTestApp([loginRouter]);
    const res = await request(app.callback()).get("/api/auth/status");
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toMatchObject({
      isInstall: false,
      settings: { businessMode: false, businessId: "" }
    });
    expect(env.data).toHaveProperty("language");
  });
});
