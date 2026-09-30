import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import {
  mockLog,
  mockOperationLogger,
  mockPassportService,
  mockRemoteService,
  mockSetting,
  mockUserSystem
} from "../../../../test/harness/mocks";

// Boundary mocks. Paths mirror the specifiers instance_operate_router itself
// uses (co-located test file -> same relative paths). The REAL permission and
// validator middleware run; their transitive deps (user_service / passport_service
// / setting / log) are swapped for the shared in-memory factories.
vi.mock("../../setting", () => mockSetting({ language: "en_us" }));
vi.mock("../../service/user_service", () => mockUserSystem());
vi.mock("../../service/operation_logger", () => mockOperationLogger());
vi.mock("../../service/passport_service", () => mockPassportService());
vi.mock("../../service/log", () => mockLog());

// remote_command: default export is a constructor whose prototype.request is a
// single shared vi.fn. Every `new RemoteRequest(svc).request(event, data)` in the
// router hits that one spy, so the (a) tests assert the forwarded daemon event +
// payload. RemoteRequestTimeoutError stays a real Error subclass so the open
// route's timeout branch still type-checks (not exercised here).
vi.mock("../../service/remote_command", () => {
  function RemoteRequest(this: any, _rService?: any) {}
  (RemoteRequest as any).prototype.request = vi.fn(async () => ({} as any));
  class RemoteRequestTimeoutError extends Error {}
  return { default: RemoteRequest, RemoteRequestTimeoutError };
});

// remote_service: default export is RemoteServiceSubsystem, re-shaped from the
// shared mockRemoteService factory. getInstance() returns undefined; the operate
// routes only pass it to `new RemoteRequest(...)` (constructor ignores it), so
// undefined is safe for open/stop/restart/kill/command.
vi.mock("../../service/remote_service", () => {
  const m = mockRemoteService();
  return { default: m.default.RemoteServiceSubsystem };
});

// permission_service: inline mock so the per-instance `router.use` gate can be
// flipped per test (admin -> true; non-owner user -> false -> 403).
vi.mock("../../service/permission_service", () => ({
  isHaveInstanceByUuid: vi.fn(() => true),
  isTopPermissionByUuid: vi.fn(() => true)
}));

// Service modules the router imports at module scope but the operate routes
// never invoke. Mock them inline to keep module-load light and isolate the
// operate routes from their transitive deps (axios / fs-extra / i18next / sync).
vi.mock("../../service/instance_config_audit", () => ({
  updateInstanceWithAudit: vi.fn(
    async (_ctx: any, _daemonId: string, _uuid: string, fn: () => any) => fn()
  )
}));
vi.mock("../../service/instance_name_service", () => ({
  getInstanceNameSafely: vi.fn(async () => undefined)
}));
vi.mock("../../service/instance_service", () => ({
  checkInstanceAdvancedParams: vi.fn(() => ({})),
  getAppMarketList: vi.fn(async () => ({ packages: [] }))
}));
vi.mock("../../service/password", () => ({ timeUuid: vi.fn(() => "stream-pw") }));
// limit: passthroughs so operate-adjacent (instance_update/asynchronous/install)
// routes never exercise the real rate-limiter/mini_redis.
vi.mock("../../middleware/limit", () => ({
  speedLimit: (_seconds: number) => async (_ctx: any, next: Function) => next(),
  requestConcurrencyLimiter: (_url: string) => async (_ctx: any, next: Function) => next()
}));

// validator, permission, i18n, common/config_diff, entity/user stay REAL.

import operateRouter from "../instance_operate_router";
import { createTestApp, resetSessions, unwrap } from "../../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../../test/harness/auth";
import RemoteRequest from "../../service/remote_command";
import { isHaveInstanceByUuid } from "../../service/permission_service";
import userSystem from "../../service/user_service";

const DAEMON_ID = "daemon-1";
const INSTANCE_UUID = "inst-uuid-1";

const app = createTestApp([operateRouter]);

// Shared spy installed on the prototype (see remote_command factory above).
const remoteRequest = vi.mocked(RemoteRequest.prototype.request as any);

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  vi.mocked(isHaveInstanceByUuid).mockReturnValue(true);
  remoteRequest.mockClear();
});

describe("instance_operate_router /protected_instance (open/stop/restart/kill/command)", () => {
  describe("(a) admin forwards the correct daemon event + payload via RemoteRequest", () => {
    it("/open -> instance/open with { instanceUuids: [uuid] }", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .get("/api/protected_instance/open")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("instance/open", {
        instanceUuids: [INSTANCE_UUID]
      });
    });

    it("/stop -> instance/stop with { instanceUuids: [uuid] }", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .get("/api/protected_instance/stop")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("instance/stop", {
        instanceUuids: [INSTANCE_UUID]
      });
    });

    it("/restart -> instance/restart with { instanceUuids: [uuid] }", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .get("/api/protected_instance/restart")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("instance/restart", {
        instanceUuids: [INSTANCE_UUID]
      });
    });

    it("/kill -> instance/kill with { instanceUuids: [uuid] }", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .get("/api/protected_instance/kill")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("instance/kill", {
        instanceUuids: [INSTANCE_UUID]
      });
    });

    it("/command -> instance/command with { instanceUuid, command }", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .get("/api/protected_instance/command")
        .set(cred.headers)
        .query(
          `${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}&command=hello`
        );
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("instance/command", {
        instanceUuid: INSTANCE_UUID,
        command: "hello"
      });
    });
  });

  describe("(b) per-instance router.use gate (isHaveInstanceByUuid)", () => {
    it("blocks a non-owner user with 403 before reaching permission/route", async () => {
      vi.mocked(isHaveInstanceByUuid).mockReturnValue(false);
      const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
      const res = await request(app.callback())
        .get("/api/protected_instance/open")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
      const env = unwrap(res);
      expect(env.status).toBe(403);
      // Gate short-circuited -> route handler never ran -> no daemon forward.
      expect(remoteRequest).not.toHaveBeenCalled();
    });
  });

  describe("(c) validator", () => {
    it("rejects a missing uuid with envelope 400 (Validator failed: uuid)", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .get("/api/protected_instance/open")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}`);
      const env = unwrap(res);
      expect(env.status).toBe(400);
      expect(String(env.data)).toContain("Validator failed");
      expect(String(env.data)).toContain("uuid");
      // Validator caught it before the handler -> no daemon forward.
      expect(remoteRequest).not.toHaveBeenCalled();
    });
  });
});
