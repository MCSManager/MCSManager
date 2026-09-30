import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import {
  mockLog,
  mockOperationLogger,
  mockPassportService,
  mockSetting,
  mockUserSystem
} from "../../../../test/harness/mocks";

// Boundary mocks (paths mirror the specifiers mod_manager_router itself uses;
// co-located test file -> same relative paths). The REAL permission, validator
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
vi.mock("../../service/remote_command", () => {
  function RemoteRequest(this: any, _rService?: any) {}
  (RemoteRequest as any).prototype.request = vi.fn(async () => ({} as any));
  class RemoteRequestTimeoutError extends Error {}
  return { default: RemoteRequest, RemoteRequestTimeoutError };
});

// remote_service: default export is the RemoteServiceSubsystem singleton.
vi.mock("../../service/remote_service", () => {
  const services = new Map<string, any>();
  return {
    default: {
      services,
      getInstance: vi.fn((uuid: string) => services.get(uuid))
    }
  };
});

// permission_service: inline mock so the per-instance router.use gate can be
// flipped per test (admin -> true; non-owner user -> false -> 403).
vi.mock("../../service/permission_service", () => ({
  isHaveInstanceByUuid: vi.fn(() => true),
  isTopPermissionByUuid: vi.fn(() => true)
}));

// mod_manager_service: the routes call its outbound HTTP methods (CurseForge /
// Modrinth). Mock the named export so tests assert passthrough without network.
vi.mock("../../service/mod_manager_service", () => ({
  modManagerService: {
    getMinecraftVersions: vi.fn(async () => ["1.21", "1.20.4"]),
    getInfoByHash: vi.fn(async () => ({ version: {}, project: {} })),
    searchProjects: vi.fn(async () => ({ hits: [], total_hits: 0 })),
    getProjectVersions: vi.fn(async () => []),
    getInfosByHashes: vi.fn(async () => ({}))
  }
}));

// instance_name_service: inline stub the router may import transitively.
vi.mock("../../service/instance_name_service", () => ({
  getInstanceNameSafely: vi.fn(async () => undefined)
}));

// limit: passthroughs so routes never exercise the real rate-limiter/mini_redis.
vi.mock("../../middleware/limit", () => ({
  speedLimit: (_seconds: number) => async (_ctx: any, next: Function) => next(),
  requestConcurrencyLimiter: (_url: string) => async (_ctx: any, next: Function) => next()
}));

// utils/url: checkSafeUrl is used by /download for SSRF guard. Return true for
// happy-path forwarding; tests flip it when needed.
vi.mock("../../utils/url", () => ({ checkSafeUrl: vi.fn(async () => true) }));

// validator, permission, i18n, entity/user stay REAL.

import modManagerRouter from "../mod_manager_router";
import { createTestApp, resetSessions, unwrap } from "../../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../../test/harness/auth";
import RemoteRequest from "../../service/remote_command";
import { isHaveInstanceByUuid } from "../../service/permission_service";
import * as passport from "../../service/passport_service";
import userSystem from "../../service/user_service";
import RemoteServiceSubsystem from "../../service/remote_service";
import { systemConfig } from "../../setting";
import { modManagerService } from "../../service/mod_manager_service";
import { checkSafeUrl } from "../../utils/url";

const DAEMON_ID = "daemon-1";
const INSTANCE_UUID = "inst-uuid-1";

const DAEMON = {
  uuid: DAEMON_ID,
  available: true,
  socket: { connected: true } as any,
  config: { ip: "127.0.0.1", port: 24444, prefix: "", remarks: "Local" } as any
};

const app = createTestApp([modManagerRouter]);
const remoteRequest = vi.mocked(RemoteRequest.prototype.request as any);

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  vi.mocked(isHaveInstanceByUuid).mockReturnValue(true);
  vi.mocked(passport.getUserPermission).mockReturnValue(10);
  vi.mocked(passport.getUserUuid).mockReturnValue("admin-uuid");
  vi.mocked(modManagerService.getMinecraftVersions).mockResolvedValue(["1.21", "1.20.4"]);
  vi.mocked(modManagerService.getInfoByHash).mockResolvedValue({ version: {}, project: {} });
  vi.mocked(modManagerService.getProjectVersions).mockResolvedValue([]);
  remoteRequest.mockClear();
  RemoteServiceSubsystem.services.clear();
  RemoteServiceSubsystem.services.set(DAEMON_ID, DAEMON);
  (systemConfig as any).canFileManager = true;
  vi.mocked(checkSafeUrl).mockResolvedValue(true);
});

describe("mod_manager_router /mod (service passthrough routes)", () => {
  it("GET /mc_versions -> modManagerService.getMinecraftVersions passthrough", async () => {
    const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "user-1",
      userName: "user1",
      permission: 1,
      instances: [] as any[]
    } as any);
    const res = await request(app.callback())
      .get("/api/mod/mc_versions")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toEqual(["1.21", "1.20.4"]);
    expect(modManagerService.getMinecraftVersions).toHaveBeenCalled();
    expect(remoteRequest).not.toHaveBeenCalled();
  });

  it("GET /info -> modManagerService.getInfoByHash with hash", async () => {
    const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "user-1",
      userName: "user1",
      permission: 1,
      instances: [] as any[]
    } as any);
    const res = await request(app.callback())
      .get("/api/mod/info")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&hash=abc123`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(modManagerService.getInfoByHash).toHaveBeenCalledWith("abc123");
    expect(remoteRequest).not.toHaveBeenCalled();
  });
});

describe("mod_manager_router /mod (admin forwarding routes)", () => {
  it("GET /list forwards instance/mods/list via RemoteRequest with page params", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/mod/list")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}&page=2&pageSize=10`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("instance/mods/list", {
      instanceUuid: INSTANCE_UUID,
      page: 2,
      pageSize: 10,
      folder: "",
      search: ""
    });
  });

  it("POST /toggle forwards instance/mods/toggle with fileName (admin happy)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/mod/toggle")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
      .send({ daemonId: DAEMON_ID, uuid: INSTANCE_UUID, fileName: "mod.jar" });
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("instance/mods/toggle", {
      instanceUuid: INSTANCE_UUID,
      fileName: "mod.jar"
    });
  });
});

describe("mod_manager_router /mod (validator branch)", () => {
  it("GET /versions rejects missing projectId with envelope 400 (Validator failed)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/mod/versions")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&source=Modrinth`);
    const env = unwrap(res);
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("Validator failed");
    expect(String(env.data)).toContain("projectId");
    expect(remoteRequest).not.toHaveBeenCalled();
  });

  it("GET /list rejects missing uuid with envelope 400 (Validator failed)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/mod/list")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}`);
    const env = unwrap(res);
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("Validator failed");
    expect(String(env.data)).toContain("uuid");
    expect(remoteRequest).not.toHaveBeenCalled();
  });
});

describe("mod_manager_router /mod (top router.use canFileManager gate)", () => {
  it("blocks a non-admin user with 403 (not 500) when canFileManager is disabled, RemoteRequest not called", async () => {
    (systemConfig as any).canFileManager = false;
    vi.mocked(passport.getUserPermission).mockReturnValue(1);
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "user-1",
      userName: "user1",
      permission: 1,
      instances: [] as any[]
    } as any);
    const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
    const res = await request(app.callback())
      .get("/api/mod/list")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
    const env = unwrap(res);
    // Bug fix: gate sets ctx.body = $t("TXT_CODE_router.file.off") (plain string)
    // so the protocol envelope preserves ctx.status=403. Before the fix, body was
    // `new Error(...)` and protocol overrode status to 500.
    expect(env.status).toBe(403);
    expect(remoteRequest).not.toHaveBeenCalled();
  });
});

describe("mod_manager_router /mod (per-instance router.use isHaveInstanceByUuid gate)", () => {
  it("blocks a non-owner user with 403 before forwarding to the daemon", async () => {
    vi.mocked(isHaveInstanceByUuid).mockReturnValue(false);
    const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "user-1",
      userName: "user1",
      permission: 1,
      instances: [] as any[]
    } as any);
    const res = await request(app.callback())
      .get("/api/mod/list")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
    const env = unwrap(res);
    expect(env.status).toBe(403);
    expect(remoteRequest).not.toHaveBeenCalled();
  });
});
