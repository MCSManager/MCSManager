import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import {
  mockLog,
  mockOperationLogger,
  mockPassportService,
  mockSetting,
  mockUserSystem
} from "../../../test/harness/mocks";

// Boundary mocks (paths mirror the specifiers filemananger_router itself uses;
// co-located test file -> same relative paths). The REAL permission, validator
// and protocol-envelope middleware run; transitive deps are swapped for the
// shared in-memory factories.
vi.mock("../setting", () => mockSetting({ language: "en_us" }));
vi.mock("../service/user_service", () => mockUserSystem());
vi.mock("../service/operation_logger", () => mockOperationLogger());
vi.mock("../service/passport_service", () => mockPassportService());
vi.mock("../service/log", () => mockLog());

// remote_command: default export is a constructor whose prototype.request is a
// single shared vi.fn. Every `new RemoteRequest(svc).request(event, data[, timeout])`
// in the router hits that one spy, so tests assert the forwarded daemon event +
// payload. RemoteRequestTimeoutError stays a real Error subclass so the source
// still type-checks.
vi.mock("../service/remote_command", () => {
  function RemoteRequest(this: any, _rService?: any) {}
  (RemoteRequest as any).prototype.request = vi.fn(async () => ({} as any));
  class RemoteRequestTimeoutError extends Error {}
  return { default: RemoteRequest, RemoteRequestTimeoutError };
});

// remote_service: default export is the RemoteServiceSubsystem singleton.
// `services` is a real Map populated from tests; getInstance is a spy over it.
// Some routes early-throw if getInstance returns undefined; seed DAEMON per test.
vi.mock("../service/remote_service", () => {
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
vi.mock("../service/permission_service", () => ({
  isHaveInstanceByUuid: vi.fn(() => true),
  isTopPermissionByUuid: vi.fn(() => true)
}));

// instance_name_service + password: inline stubs the router imports at module
// scope but most routes never exercise the real impl.
vi.mock("../service/instance_name_service", () => ({
  getInstanceNameSafely: vi.fn(async () => undefined)
}));
vi.mock("../service/password", () => ({ timeUuid: vi.fn(() => "stream-pw") }));

// limit: passthroughs so routes never exercise the real rate-limiter/mini_redis.
vi.mock("../middleware/limit", () => ({
  speedLimit: (_seconds: number) => async (_ctx: any, next: Function) => next(),
  requestConcurrencyLimiter: (_url: string) => async (_ctx: any, next: Function) => next()
}));

// validator, permission, i18n, entity/user, path, common/config_diff stay REAL.

import fileManagerRouter from "./filemananger_router";
import { createTestApp, resetSessions, unwrap } from "../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../test/harness/auth";
import RemoteRequest from "../service/remote_command";
import { isHaveInstanceByUuid } from "../service/permission_service";
import * as passport from "../service/passport_service";
import userSystem from "../service/user_service";
import RemoteServiceSubsystem from "../service/remote_service";
import { systemConfig } from "../setting";

const DAEMON_ID = "daemon-1";
const INSTANCE_UUID = "inst-uuid-1";

const DAEMON = {
  uuid: DAEMON_ID,
  available: true,
  socket: { connected: true } as any,
  config: {
    ip: "127.0.0.1",
    port: 24444,
    prefix: "",
    remarks: "Local",
    fullAddr: "http://127.0.0.1:24444",
    getConvertedRemoteMappings: () => [] as any[],
    remoteMappings: [] as any[]
  }
};

const app = createTestApp([fileManagerRouter]);
const remoteRequest = vi.mocked(RemoteRequest.prototype.request as any);

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  vi.mocked(isHaveInstanceByUuid).mockReturnValue(true);
  vi.mocked(passport.getUserPermission).mockReturnValue(10);
  remoteRequest.mockClear();
  RemoteServiceSubsystem.services.clear();
  RemoteServiceSubsystem.services.set(DAEMON_ID, DAEMON);
  (systemConfig as any).canFileManager = true;
});

describe("filemananger_router /files (admin happy paths forward file/* events)", () => {
  it("GET /status -> file/status with { instanceUuid }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/files/status")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
    expect(unwrap(res).status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("file/status", { instanceUuid: INSTANCE_UUID });
  });

  it("GET /list -> file/list with { instanceUuid, target, pageSize, page, fileName }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/files/list")
      .set(cred.headers)
      .query(
        `${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}&target=/&page=2&page_size=15&file_name=foo`
      );
    expect(unwrap(res).status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("file/list", {
      instanceUuid: INSTANCE_UUID,
      target: "/",
      pageSize: 15,
      page: 2,
      fileName: "foo"
    });
  });

  it("PUT /chmod -> file/chmod with { target, instanceUuid, chmod, deep }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .put("/api/files/chmod")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
      .send({ target: "foo.txt", chmod: 644, deep: false });
    expect(unwrap(res).status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("file/chmod", {
      target: "foo.txt",
      instanceUuid: INSTANCE_UUID,
      chmod: 644,
      deep: false
    });
  });

  it("PUT /chmod_batch -> file/chmod_batch with { targets, instanceUuid, chmod, deep } + timeout", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .put("/api/files/chmod_batch")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
      .send({ targets: ["a.txt", "b.txt"], chmod: 644, deep: false });
    expect(unwrap(res).status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith(
      "file/chmod_batch",
      {
        targets: ["a.txt", "b.txt"],
        instanceUuid: INSTANCE_UUID,
        chmod: 644,
        deep: false
      },
      expect.any(Number)
    );
  });

  it("POST /touch -> file/touch with { target, instanceUuid }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/files/touch")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
      .send({ target: "foo.txt" });
    expect(unwrap(res).status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("file/touch", {
      target: "foo.txt",
      instanceUuid: INSTANCE_UUID
    });
  });

  it("POST /mkdir -> file/mkdir with { target, instanceUuid }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/files/mkdir")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
      .send({ target: "newdir" });
    expect(unwrap(res).status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("file/mkdir", {
      target: "newdir",
      instanceUuid: INSTANCE_UUID
    });
  });

  it("POST /copy -> file/copy with { instanceUuid, targets }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/files/copy")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
      .send({ targets: ["a.txt", "b.txt"] });
    expect(unwrap(res).status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("file/copy", {
      instanceUuid: INSTANCE_UUID,
      targets: ["a.txt", "b.txt"]
    });
  });

  it("POST /download_from_url -> file/download_from_url and returns downloadId", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/files/download_from_url")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
      .send({ url: "http://example.com/a.zip", file_name: "a.zip" });
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toBe("stream-pw");
    expect(remoteRequest).toHaveBeenCalledWith("file/download_from_url", {
      url: "http://example.com/a.zip",
      fileName: "a.zip",
      instanceUuid: INSTANCE_UUID
    });
  });

  it("POST /download_from_url_stop -> file/download_from_url_stop with { taskId, instanceUuid }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/files/download_from_url_stop")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
      .send({ taskId: "task-1" });
    expect(unwrap(res).status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("file/download_from_url_stop", {
      taskId: "task-1",
      instanceUuid: INSTANCE_UUID
    });
  });

  it("PUT /move -> file/move with { instanceUuid, targets }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .put("/api/files/move")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
      .send({ targets: [["a.txt", "b.txt"]] });
    expect(unwrap(res).status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("file/move", {
      instanceUuid: INSTANCE_UUID,
      targets: [["a.txt", "b.txt"]]
    });
  });

  it("POST /compress -> file/compress with { instanceUuid, targets, source, type, code }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/files/compress")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
      .send({ source: "foo.txt", targets: ["foo.txt"], type: 1, code: "pw" });
    expect(unwrap(res).status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith(
      "file/compress",
      {
        instanceUuid: INSTANCE_UUID,
        targets: ["foo.txt"],
        source: "foo.txt",
        type: 1,
        code: "pw"
      },
      0
    );
  });

  it("PUT / -> file/edit twice (read textBefore + write text)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .put("/api/files/")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
      .send({ target: "foo.txt", text: "hello" });
    expect(unwrap(res).status).toBe(200);
    expect(remoteRequest).toHaveBeenNthCalledWith(
      1,
      "file/edit",
      { instanceUuid: INSTANCE_UUID, target: "foo.txt" },
      100000
    );
    expect(remoteRequest).toHaveBeenNthCalledWith(
      2,
      "file/edit",
      { instanceUuid: INSTANCE_UUID, target: "foo.txt", text: "hello" },
      100000
    );
  });

  it("DELETE / -> file/delete with { instanceUuid, targets }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .delete("/api/files/")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`)
      .send({ targets: ["foo.txt"] });
    expect(unwrap(res).status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("file/delete", {
      instanceUuid: INSTANCE_UUID,
      targets: ["foo.txt"]
    });
  });

  it("ALL /download -> passport/register (download) + { password, addr, remoteMappings }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/files/download")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}&file_name=foo.txt`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("passport/register", {
      name: "download",
      password: "stream-pw",
      parameter: { fileName: "foo.txt", instanceUuid: INSTANCE_UUID }
    });
    expect(env.data).toEqual({
      password: "stream-pw",
      addr: "http://127.0.0.1:24444",
      remoteMappings: []
    });
  });

  it("ALL /upload -> passport/register (upload) + { password, addr, remoteMappings }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/files/upload")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}&upload_dir=/foo`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("passport/register", {
      name: "upload",
      password: "stream-pw",
      parameter: { uploadDir: "/foo", instanceUuid: INSTANCE_UUID }
    });
    expect(env.data).toEqual({
      password: "stream-pw",
      addr: "http://127.0.0.1:24444",
      remoteMappings: []
    });
  });
});

describe("filemananger_router /files (per-instance router.use gate)", () => {
  it("blocks a non-owner user with 403 when isHaveInstanceByUuid is false (before remote)", async () => {
    vi.mocked(isHaveInstanceByUuid).mockReturnValue(false);
    const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
    const res = await request(app.callback())
      .get("/api/files/status")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
    const env = unwrap(res);
    expect(env.status).toBe(403);
    expect(remoteRequest).not.toHaveBeenCalled();
  });

  it("blocks a non-admin user with 403 when systemConfig.canFileManager is disabled (before remote)", async () => {
    (systemConfig as any).canFileManager = false;
    vi.mocked(passport.getUserPermission).mockReturnValue(1);
    const cred = asUser({ uuid: "user-1", userName: "user1", permission: 1 });
    const res = await request(app.callback())
      .get("/api/files/status")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&uuid=${INSTANCE_UUID}`);
    const env = unwrap(res);
    // The gate sets ctx.status = 403 explicitly. Before the fix the body was
    // `new Error(...)` and protocol envelope overrode status to 500; now uses
    // a plain string like the forbiddenInstance branch so 403 is preserved.
    expect(env.status).toBe(403);
    expect(remoteRequest).not.toHaveBeenCalled();
  });
});

describe("filemananger_router /files (validator branch)", () => {
  it("rejects GET /status with missing uuid via validator (400) before the handler", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/files/status")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}`);
    const env = unwrap(res);
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("Validator failed");
    expect(String(env.data)).toContain("uuid");
    expect(remoteRequest).not.toHaveBeenCalled();
  });
});
