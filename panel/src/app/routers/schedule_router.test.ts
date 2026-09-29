import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import {
  mockLog,
  mockOperationLogger,
  mockPassportService,
  mockRemoteService,
  mockSetting,
  mockUserSystem
} from "../../../test/harness/mocks";

// Boundary mocks. Paths mirror the specifiers schedule_router itself uses
// (co-located test file -> same relative paths). The REAL permission, validator
// and protocol-envelope middleware run; transitive deps are swapped for the
// shared in-memory factories.
vi.mock("../setting", () => mockSetting({ language: "en_us" }));
vi.mock("../service/user_service", () => mockUserSystem());
vi.mock("../service/operation_logger", () => mockOperationLogger());
vi.mock("../service/passport_service", () => mockPassportService());
vi.mock("../service/log", () => mockLog());

// remote_command: default export is a constructor whose prototype.request is a
// single shared vi.fn. Every `new RemoteRequest(svc).request(event, data)` in the
// router hits that one spy, so tests assert the forwarded daemon event + payload.
// RemoteRequestTimeoutError stays a real Error subclass so the source still
// type-checks.
vi.mock("../service/remote_command", () => {
  function RemoteRequest(this: any, _rService?: any) {}
  (RemoteRequest as any).prototype.request = vi.fn(async () => ({} as any));
  class RemoteRequestTimeoutError extends Error {}
  return { default: RemoteRequest, RemoteRequestTimeoutError };
});

// remote_service: default export is the RemoteServiceSubsystem singleton from
// the shared mockRemoteService factory. getInstance() returns undefined; the
// schedule routes only pass it to `new RemoteRequest(...)` (constructor ignores
// it), so undefined is safe for list/register/delete.
vi.mock("../service/remote_service", () => {
  const m = mockRemoteService();
  return { default: m.default.RemoteServiceSubsystem };
});

// permission_service: inline mock so the per-instance `router.use` gate can be
// flipped per test (admin -> true; non-owner user -> false -> 403).
vi.mock("../service/permission_service", () => ({
  isHaveInstanceByUuid: vi.fn(() => true),
  isTopPermissionByUuid: vi.fn(() => true)
}));

// instance_name_service: stub so the register/delete routes' name lookup is a
// no-op (the router imports it at module scope but the tests don't exercise the
// real impl, which would hit RemoteRequest).
vi.mock("../service/instance_name_service", () => ({
  getInstanceNameSafely: vi.fn(async () => undefined)
}));

// validator, permission, i18n, entity/user, const (FILENAME_BLACKLIST) stay REAL.

import scheduleRouter from "./schedule_router";
import { createTestApp, resetSessions, unwrap } from "../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../test/harness/auth";
import RemoteRequest from "../service/remote_command";
import { isHaveInstanceByUuid } from "../service/permission_service";
import userSystem from "../service/user_service";

const DAEMON_ID = "daemon-1";
const INSTANCE_UUID = "inst-uuid-1";

const app = createTestApp([scheduleRouter]);

// Shared spy installed on the prototype (see remote_command factory above).
const remoteRequest = vi.mocked(RemoteRequest.prototype.request as any);

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  vi.mocked(isHaveInstanceByUuid).mockReturnValue(true);
  remoteRequest.mockClear();
});

describe("schedule_router /protected_schedule (forwards schedule/* events)", () => {
  describe("(a) happy paths assert the forwarded daemon event + payload", () => {
    it("GET / -> schedule/list with { instanceUuid }", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .get("/api/protected_schedule/")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("schedule/list", {
        instanceUuid: INSTANCE_UUID
      });
    });

    it("POST / -> schedule/register with { instanceUuid, name, count, time, actions, type }", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/protected_schedule/")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
        .send({ name: "task1", count: 5, time: "0 * * * *", actions: ["command"], type: 1 });
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("schedule/register", {
        instanceUuid: INSTANCE_UUID,
        name: "task1",
        count: 5,
        time: "0 * * * *",
        actions: ["command"],
        type: 1
      });
    });

    it("DELETE / -> schedule/delete with { instanceUuid, name } (name from query.task_name)", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .delete("/api/protected_schedule/")
        .set(cred.headers)
        .query(
          `${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}&task_name=task1`
        );
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("schedule/delete", {
        instanceUuid: INSTANCE_UUID,
        name: "task1"
      });
    });
  });

  describe("(b) per-instance router.use gate (isHaveInstanceByUuid)", () => {
    it("blocks a non-owner user with 403 before reaching the route handler", async () => {
      vi.mocked(isHaveInstanceByUuid).mockReturnValue(false);
      const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
      const res = await request(app.callback())
        .get("/api/protected_schedule/")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
      const env = unwrap(res);
      expect(env.status).toBe(403);
      // Gate short-circuited -> route handler never ran -> no daemon forward.
      expect(remoteRequest).not.toHaveBeenCalled();
    });
  });

  describe("(c) validator", () => {
    it("rejects POST / with a missing body `name` via validator (400) before the handler", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/protected_schedule/")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
        .send({ count: 5, time: "0 * * * *", actions: ["command"], type: 1 });
      const env = unwrap(res);
      expect(env.status).toBe(400);
      expect(String(env.data)).toContain("Validator failed");
      expect(String(env.data)).toContain("name");
      // Validator caught it before the handler -> no daemon forward.
      expect(remoteRequest).not.toHaveBeenCalled();
    });
  });
});
