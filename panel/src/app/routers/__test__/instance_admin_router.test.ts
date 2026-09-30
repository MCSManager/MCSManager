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

// --- Shared boundary mocks (paths mirror the router's own specifiers) ---
vi.mock("../../setting", () =>
  mockSetting({ language: "en_us", presetPackAddr: "https://example.com/presets.json" })
);
vi.mock("../../service/user_service", () => mockUserSystem());
vi.mock("../../service/operation_logger", () => mockOperationLogger());
vi.mock("../../service/passport_service", () => mockPassportService());
vi.mock("../../service/log", () => mockLog());

// remote_command: prototype.request is a single shared vi.fn so every
// `new RemoteRequest(svc).request(event, data)` hits the same spy.
vi.mock("../../service/remote_command", () => {
  function RemoteRequest(this: any, _rService?: any) {}
  (RemoteRequest as any).prototype.request = vi.fn(async () => ({} as any));
  class RemoteRequestTimeoutError extends Error {}
  return { default: RemoteRequest, RemoteRequestTimeoutError };
});

// remote_service: getInstance returns undefined by default; routes only pass
// the value to `new RemoteRequest(...)` (mocked constructor ignores it).
vi.mock("../../service/remote_service", () => {
  const m = mockRemoteService();
  return { default: m.default.RemoteServiceSubsystem };
});

// permission_service: inline mocks so per-instance / top-permission checks can
// be flipped per test.
vi.mock("../../service/permission_service", () => ({
  isHaveInstanceByUuid: vi.fn(() => true),
  isTopPermissionByUuid: vi.fn(() => true)
}));

// instance_service: multiOperationForwarding mock mirrors the real
// classification (group by daemonId) and calls back synchronously, so the
// route's fire-and-forget RemoteRequest chain registers on the shared spy.
vi.mock("../../service/instance_service", () => ({
  multiOperationForwarding: vi.fn(
    (instances: any[], callback: (daemonId: string, instanceUuids: string[]) => void) => {
      const map = new Map<string, string[]>();
      for (const info of instances) {
        const d = info.daemonId;
        const u = info.instanceUuid;
        if (map.has(d)) map.get(d)!.push(u);
        else map.set(d, [u]);
      }
      for (const [d, uuids] of map) {
        callback(d, uuids);
      }
    }
  )
}));

vi.mock("../../service/instance_config_audit", () => ({
  updateInstanceWithAudit: vi.fn(
    async (_ctx: any, _daemonId: string, _uuid: string, fn: () => any) => fn()
  )
}));

vi.mock("../../service/password", () => ({ timeUuid: vi.fn(() => "stream-pw") }));

// axios: mock for quick_install_list (remote preset fetch) and /forward (proxy).
vi.mock("axios", () => ({
  default: { request: vi.fn(async () => ({ status: 200, data: { packages: [] } })) }
}));

// fs-extra: mock so quick_install_list cache / file reads never touch disk.
vi.mock("fs-extra", () => ({
  default: {
    existsSync: vi.fn(() => false),
    stat: vi.fn(async () => {
      throw new Error("ENOENT");
    }),
    readFile: vi.fn(async () => "[]"),
    writeFile: vi.fn(async () => undefined)
  }
}));

// validator, permission, i18n, entity/user, const stay REAL.

import adminRouter from "../instance_admin_router";
import { createTestApp, resetSessions, unwrap } from "../../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../../test/harness/auth";
import RemoteRequest from "../../service/remote_command";
import { isHaveInstanceByUuid } from "../../service/permission_service";
import { multiOperationForwarding } from "../../service/instance_service";
import userSystem from "../../service/user_service";
import axios from "axios";

const DAEMON_ID = "daemon-1";
const INSTANCE_UUID = "inst-uuid-1";

const app = createTestApp([adminRouter]);

const remoteRequest = vi.mocked(RemoteRequest.prototype.request as any);
const axiosRequest = vi.mocked(axios.request as any);

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  vi.mocked(isHaveInstanceByUuid).mockReturnValue(true);
  remoteRequest.mockClear();
  vi.mocked(multiOperationForwarding).mockClear();
  axiosRequest.mockClear();
  axiosRequest.mockResolvedValue({ status: 200, data: { packages: [] } } as any);
});

describe("instance_admin_router /instance", () => {
  describe("GET / (USER, per-instance check inside body)", () => {
    it("returns instance detail via RemoteRequest instance/detail for an owner", async () => {
      const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
      vi.mocked(userSystem.getInstance).mockReturnValue({
        uuid: "user-1",
        userName: "user1",
        permission: 1,
        instances: [{ daemonId: DAEMON_ID, instanceUuid: INSTANCE_UUID }]
      } as any);
      const res = await request(app.callback())
        .get("/api/instance/")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("instance/detail", {
        instanceUuid: INSTANCE_UUID
      });
    });

    it("rejects a non-owner user — per-instance check throws Error -> 500", async () => {
      // The per-instance gate lives INSIDE the route body (not a middleware), so
      // a failed isHaveInstanceByUuid throws and the protocol middleware
      // serializes the Error as 500 (not 403 like instance_operate_router's
      // router.use gate that explicitly sets ctx.status = 403).
      vi.mocked(isHaveInstanceByUuid).mockReturnValue(false);
      const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
      vi.mocked(userSystem.getInstance).mockReturnValue({
        uuid: "user-1",
        userName: "user1",
        permission: 1,
        instances: []
      } as any);
      const res = await request(app.callback())
        .get("/api/instance/")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
      const env = unwrap(res);
      expect(env.status).toBe(500);
      expect(remoteRequest).not.toHaveBeenCalled();
    });

    it("rejects a missing uuid with 400 (Validator failed: uuid)", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .get("/api/instance/")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}`);
      const env = unwrap(res);
      expect(env.status).toBe(400);
      expect(String(env.data)).toContain("Validator failed");
      expect(String(env.data)).toContain("uuid");
      expect(remoteRequest).not.toHaveBeenCalled();
    });
  });

  describe("POST / (ADMIN, create instance)", () => {
    it("forwards instance/new with the request body as config", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/instance/")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}`)
        .send({ nickname: "my-server", command: "java -jar server.jar" });
      expect(unwrap(res).status).toBe(200);
      expect(remoteRequest).toHaveBeenCalledWith("instance/new", {
        nickname: "my-server",
        command: "java -jar server.jar"
      });
    });
  });

  describe("POST /multi_open (ADMIN, batch fan-out)", () => {
    it("multiOperationForwarding classifies by daemonId and forwards instance/open per group", async () => {
      const cred = asAdmin();
      const instances = [
        { daemonId: "daemon-1", instanceUuid: "inst-1" },
        { daemonId: "daemon-2", instanceUuid: "inst-2" },
        { daemonId: "daemon-1", instanceUuid: "inst-3" }
      ];
      const res = await request(app.callback())
        .post("/api/instance/multi_open")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send(instances);
      expect(unwrap(res).status).toBe(200);
      expect(unwrap(res).data).toBe(true);
      expect(multiOperationForwarding).toHaveBeenCalledWith(instances, expect.any(Function));
      // Fan-out: daemon-1 -> [inst-1, inst-3], daemon-2 -> [inst-2]
      expect(remoteRequest).toHaveBeenCalledWith("instance/open", {
        instanceUuids: ["inst-1", "inst-3"]
      });
      expect(remoteRequest).toHaveBeenCalledWith("instance/open", {
        instanceUuids: ["inst-2"]
      });
    });
  });

  describe("GET /quick_install_list (USER)", () => {
    it("returns the preset list fetched via axios when no cache exists", async () => {
      axiosRequest.mockResolvedValue({
        status: 200,
        data: { packages: [{ name: "Paper" }] }
      } as any);
      const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
      vi.mocked(userSystem.getInstance).mockReturnValue({
        uuid: "user-1",
        userName: "user1",
        permission: 1,
        instances: []
      } as any);
      const res = await request(app.callback())
        .get("/api/instance/quick_install_list")
        .set(cred.headers)
        .query(tokenQuery(cred.token));
      const env = unwrap(res);
      expect(env.status).toBe(200);
      expect(env.data).toEqual({ packages: [{ name: "Paper" }] });
    });
  });

  describe("ALL /forward (ADMIN, proxy)", () => {
    it("forwards the request via axios with target URL and body", async () => {
      axiosRequest.mockResolvedValue({
        status: 200,
        data: { forwarded: true }
      } as any);
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/instance/forward")
        .set(cred.headers)
        .query(
          `${tokenQuery(cred.token)}&target=${encodeURIComponent(
            "https://daemon.example.com/api"
          )}`
        )
        .send({ cmd: "hello" });
      const env = unwrap(res);
      expect(env.status).toBe(200);
      expect(env.data).toEqual({ forwarded: true });
      expect(axiosRequest).toHaveBeenCalledWith({
        method: "POST",
        url: "https://daemon.example.com/api",
        data: { cmd: "hello" }
      });
    });
  });

  describe("POST /upload (ADMIN gate)", () => {
    // NOTE: the real multipart file upload is NOT exercised here —
    // formidable/koa-body multipart fixtures are heavy and out of scope.
    // These tests only prove the admin gate + validator pass (handler is
    // reached) vs non-admin 403.
    it("non-admin -> 403 (admin gate rejects before handler)", async () => {
      const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
      vi.mocked(userSystem.getInstance).mockReturnValue({
        uuid: "user-1",
        userName: "user1",
        permission: 1,
        instances: []
      } as any);
      const res = await request(app.callback())
        .post("/api/instance/upload")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&upload_dir=/tmp`)
        .send({});
      const env = unwrap(res);
      expect(env.status).toBe(403);
    });

    it("admin reaches the handler (not 403; undefined RemoteService -> 500)", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/instance/upload")
        .set(cred.headers)
        .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&upload_dir=/tmp`)
        .send({});
      const env = unwrap(res);
      expect(env.status).not.toBe(403);
      expect(env.status).toBe(500);
    });
  });
});
