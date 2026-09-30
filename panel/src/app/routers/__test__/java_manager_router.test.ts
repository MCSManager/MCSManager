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

// Boundary mocks. Paths mirror the specifiers java_manager_router itself uses
// (co-located test file -> same relative paths). The REAL permission, validator
// and protocol-envelope middleware run; transitive deps are swapped for the
// shared in-memory factories.
vi.mock("../../setting", () => mockSetting({ language: "en_us" }));
vi.mock("../../service/user_service", () => mockUserSystem());
vi.mock("../../service/operation_logger", () => mockOperationLogger());
vi.mock("../../service/passport_service", () => mockPassportService());
vi.mock("../../service/log", () => mockLog());

// remote_command: default export is a constructor whose prototype.request is a
// single shared vi.fn. Every `new RemoteRequest(svc).request(event, data)` in the
// router hits that one spy, so tests assert the forwarded daemon event + payload.
// RemoteRequestTimeoutError stays a real Error subclass so the source still
// type-checks.
vi.mock("../../service/remote_command", () => {
  function RemoteRequest(this: any, _rService?: any) {}
  (RemoteRequest as any).prototype.request = vi.fn(async () => ({} as any));
  class RemoteRequestTimeoutError extends Error {}
  return { default: RemoteRequest, RemoteRequestTimeoutError };
});

// remote_service: default export is the RemoteServiceSubsystem singleton from
// the shared mockRemoteService factory. getInstance() returns undefined; the
// java_manager routes only pass it to `new RemoteRequest(...)` (constructor
// ignores it), so undefined is safe for list/add/download/using/delete.
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

// limit: passthroughs so the add/download routes never exercise the real
// rate-limiter/mini_redis.
vi.mock("../../middleware/limit", () => ({
  speedLimit: (_seconds: number) => async (_ctx: any, next: Function) => next(),
  requestConcurrencyLimiter: (_url: string) => async (_ctx: any, next: Function) => next()
}));

// validator, permission, i18n, entity/user stay REAL.

import javaManagerRouter from "../java_manager_router";
import { createTestApp, resetSessions, unwrap } from "../../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../../test/harness/auth";
import RemoteRequest from "../../service/remote_command";
import { isHaveInstanceByUuid } from "../../service/permission_service";
import userSystem from "../../service/user_service";

const DAEMON_ID = "daemon-1";
const INSTANCE_ID = "inst-1";

const app = createTestApp([javaManagerRouter]);

// Shared spy installed on the prototype (see remote_command factory above).
const remoteRequest = vi.mocked(RemoteRequest.prototype.request as any);

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  vi.mocked(isHaveInstanceByUuid).mockReturnValue(true);
  remoteRequest.mockClear();
});

describe("java_manager_router /java_manager (forwards java_manager/* events)", () => {
  describe("(a) happy paths assert the forwarded daemon event + payload", () => {
    it("GET /list (USER) -> java_manager/list", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .get("/api/java_manager/list")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&instanceId=${INSTANCE_ID}`);
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("java_manager/list");
    });

    it("POST /add (ADMIN) -> java_manager/add with { name, path }", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/java_manager/add")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}`)
        .send({ name: "jdk-17", path: "/opt/jdk-17" });
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("java_manager/add", {
        name: "jdk-17",
        path: "/opt/jdk-17"
      });
    });

    it("POST /download (ADMIN) -> java_manager/download with { name, version }", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/java_manager/download")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&instanceId=${INSTANCE_ID}`)
        .send({ name: "jdk-17", version: "17.0.1" });
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("java_manager/download", {
        name: "jdk-17",
        version: "17.0.1"
      });
    });

    it("POST /using (USER) -> java_manager/using with { instanceId, id }", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/java_manager/using")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&instanceId=${INSTANCE_ID}`)
        .send({ id: "jdk-17" });
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("java_manager/using", {
        instanceId: INSTANCE_ID,
        id: "jdk-17"
      });
    });

    it("DELETE /delete (ADMIN) -> java_manager/delete with { id }", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .delete("/api/java_manager/delete")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}`)
        .send({ id: "jdk-17" });
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("java_manager/delete", {
        id: "jdk-17"
      });
    });
  });

  describe("(b) per-instance router.use gate (isHaveInstanceByUuid)", () => {
    it("blocks a non-owner user with 403 before reaching the route handler", async () => {
      vi.mocked(isHaveInstanceByUuid).mockReturnValue(false);
      const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
      const res = await request(app.callback())
        .get("/api/java_manager/list")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&instanceId=${INSTANCE_ID}`);
      const env = unwrap(res);
      // Before the bug fix the gate `throw new Error(...)`, which the protocol
      // envelope wrapped as 500. Sibling routers (schedule/filemananger) set
      // `ctx.status = 403; ctx.body = $t(...)` for the same gate; java_manager
      // now uses the same idiom so 403 is preserved.
      expect(env.status).toBe(403);
      // Gate short-circuited -> route handler never ran -> no daemon forward.
      expect(remoteRequest).not.toHaveBeenCalled();
    });
  });

  describe("(c) validator", () => {
    it("rejects POST /add with a missing body `name` via validator (400) before the handler", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/java_manager/add")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}`)
        .send({ path: "/opt/jdk-17" });
      const env = unwrap(res);
      expect(env.status).toBe(400);
      expect(String(env.data)).toContain("Validator failed");
      expect(String(env.data)).toContain("name");
      // Validator caught it before the handler -> no daemon forward.
      expect(remoteRequest).not.toHaveBeenCalled();
    });
  });
});
