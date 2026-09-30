import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import {
  mockPassportService,
  mockSetting,
  mockUserSystem
} from "../../../../test/harness/mocks";

// Boundary mocks: the REAL permission middleware under test runs on top of the
// shared in-memory factories (user lookup, API-key lookup, system config).
vi.mock("../../setting", () => mockSetting({ language: "en_us" }));
vi.mock("../../service/user_service", () => mockUserSystem());
vi.mock("../../service/passport_service", () => mockPassportService());

import Router from "@koa/router";
import { createTestApp, resetSessions, unwrap } from "../../../../test/harness/app";
import { ROLE } from "../../entity/user";
import { parseUnsafeIntegrationTestModeArg } from "../../utils/integration_test_mode";
import permission from "../permission";

const router = new Router();
router.get("/admin", permission({ level: ROLE.ADMIN }), (ctx) => {
  ctx.body = "ok";
});

const app = createTestApp([router]);

beforeEach(() => {
  resetSessions();
  parseUnsafeIntegrationTestModeArg([]);
});

describe("permission middleware - unsafe integration-test mode", () => {
  it("rejects a matching header when the mode is disabled", async () => {
    const res = await request(app.callback())
      .get("/api/admin")
      .set("x-request-api-key", "secret-key");
    expect(unwrap(res).status).toBe(403);
  });

  it("bypasses all permission checks for the configured key", async () => {
    parseUnsafeIntegrationTestModeArg(["--Unsafe-Integration-Test-Mode=secret-key"]);
    const res = await request(app.callback())
      .get("/api/admin")
      .set("x-request-api-key", "secret-key");
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toBe("ok");
  });

  it("rejects a wrong header value while the mode is enabled", async () => {
    parseUnsafeIntegrationTestModeArg(["--Unsafe-Integration-Test-Mode=secret-key"]);
    const res = await request(app.callback())
      .get("/api/admin")
      .set("x-request-api-key", "not-the-key");
    expect(unwrap(res).status).toBe(403);
  });

  it("rejects requests without the header while the mode is enabled", async () => {
    parseUnsafeIntegrationTestModeArg(["--Unsafe-Integration-Test-Mode=secret-key"]);
    const res = await request(app.callback()).get("/api/admin");
    expect(unwrap(res).status).toBe(403);
  });

  it("only trusts the header, not the ?apikey query parameter", async () => {
    parseUnsafeIntegrationTestModeArg(["--Unsafe-Integration-Test-Mode=secret-key"]);
    const res = await request(app.callback()).get("/api/admin").query({ apikey: "secret-key" });
    expect(unwrap(res).status).toBe(403);
  });
});
