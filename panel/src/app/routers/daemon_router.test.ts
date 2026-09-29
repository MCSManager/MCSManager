import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import {
  mockLog,
  mockOperationLogger,
  mockPassportService,
  mockSetting,
  mockUserSystem
} from "../../../test/harness/mocks";

// Boundary mocks (paths mirror the specifiers daemon_router itself uses;
// co-located test file -> same relative paths). The REAL permission, validator
// and protocol-envelope middleware run; transitive deps are swapped for the
// shared in-memory factories. common/config_diff stays REAL (pure).
vi.mock("../setting", () => mockSetting({ language: "en_us" }));
vi.mock("../service/user_service", () => mockUserSystem());
vi.mock("../service/operation_logger", () => mockOperationLogger());
vi.mock("../service/passport_service", () => mockPassportService());
vi.mock("../service/log", () => mockLog());

// remote_command: default export is a constructor whose prototype.request is a
// single shared vi.fn. Every `new RemoteRequest(svc).request(event, data)` in
// the router hits that spy, so tests assert the forwarded daemon event.
vi.mock("../service/remote_command", () => {
  function RemoteRequest(this: any, _rService?: any) {}
  (RemoteRequest as any).prototype.request = vi.fn(async () => ({} as any));
  class RemoteRequestTimeoutError extends Error {}
  return { default: RemoteRequest, RemoteRequestTimeoutError };
});

// remote_service: default export is the RemoteServiceSubsystem singleton.
// `services` is a real Map populated from tests; getInstance/registerRemoteService/
// edit/deleteRemoteService are spies over it, mirroring the real subsystem.
vi.mock("../service/remote_service", () => {
  const services = new Map<string, any>();
  return {
    default: {
      services,
      getInstance: vi.fn((uuid: string) => services.get(uuid)),
      registerRemoteService: vi.fn(async (cfg: any) => {
        const uuid = "new-daemon";
        const instance = {
          uuid,
          available: false,
          config: {
            ip: cfg.ip,
            port: cfg.port,
            prefix: cfg.prefix ?? "",
            remarks: cfg.remarks ?? "",
            apiKey: cfg.apiKey,
            remoteMappings: cfg.remoteMappings ?? []
          }
        };
        services.set(uuid, instance);
        return instance;
      }),
      edit: vi.fn((uuid: string, cfg: any) => {
        const svc = services.get(uuid);
        if (!svc) return;
        if (cfg.remarks) svc.config.remarks = cfg.remarks;
        if (cfg.ip) svc.config.ip = cfg.ip;
        if (cfg.port) svc.config.port = cfg.port;
        if (cfg.prefix != null) svc.config.prefix = cfg.prefix;
        if (cfg.apiKey) svc.config.apiKey = cfg.apiKey;
        if (cfg.remoteMappings != null) svc.config.remoteMappings = cfg.remoteMappings;
      }),
      deleteRemoteService: vi.fn((uuid: string) => {
        if (services.has(uuid)) services.delete(uuid);
      })
    }
  };
});

// permission, validator, i18n, entity/user, common/config_diff stay REAL.

import daemonRouter from "./daemon_router";
import { createTestApp, resetSessions, unwrap } from "../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../test/harness/auth";
import RemoteRequest from "../service/remote_command";
import RemoteServiceSubsystem from "../service/remote_service";
import { operationLogger } from "../service/operation_logger";
import userSystem from "../service/user_service";

const DAEMON_ID = "daemon-1";

const DAEMON = {
  uuid: DAEMON_ID,
  available: true,
  socket: { connected: true } as any,
  connect: vi.fn(),
  config: {
    ip: "127.0.0.1",
    port: 24444,
    prefix: "",
    remarks: "Local",
    apiKey: "test-key",
    remoteMappings: [] as any[]
  }
};

const app = createTestApp([daemonRouter]);
const remoteRequest = vi.mocked(RemoteRequest.prototype.request as any);

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  remoteRequest.mockClear();
  // Reset shared DAEMON config (PUT /remote_service test mutates remarks/ip/port).
  DAEMON.config.ip = "127.0.0.1";
  DAEMON.config.port = 24444;
  DAEMON.config.prefix = "";
  DAEMON.config.remarks = "Local";
  DAEMON.config.apiKey = "test-key";
  DAEMON.config.remoteMappings = [];
  RemoteServiceSubsystem.services.clear();
  RemoteServiceSubsystem.services.set(DAEMON_ID, DAEMON);
  vi.mocked(RemoteServiceSubsystem.getInstance).mockClear();
  vi.mocked(RemoteServiceSubsystem.registerRemoteService).mockClear();
  vi.mocked(RemoteServiceSubsystem.edit).mockClear();
  vi.mocked(RemoteServiceSubsystem.deleteRemoteService).mockClear();
  vi.mocked(operationLogger.log).mockClear();
  DAEMON.connect.mockClear();
});

describe("daemon_router /service (admin happy paths forward to RemoteServiceSubsystem / RemoteRequest)", () => {
  it("GET /remote_services_list returns services shape (no remote call)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/service/remote_services_list")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toEqual([
      expect.objectContaining({
        uuid: DAEMON_ID,
        ip: "127.0.0.1",
        port: 24444,
        prefix: "",
        available: true,
        remarks: "Local"
      })
    ]);
    expect(remoteRequest).not.toHaveBeenCalled();
  });

  it("GET /remote_service_instances -> instance/select with { page, pageSize, condition }", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/service/remote_service_instances")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&page=1&page_size=10`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("instance/select", {
      page: 1,
      pageSize: 10,
      condition: { instanceName: undefined, status: undefined, tag: null }
    });
  });

  it("GET /remote_services_instances_global fans out instance/select across services", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/service/remote_services_instances_global")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&page=1&page_size=10`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("instance/select", {
      page: 1,
      pageSize: 10,
      condition: { instanceName: undefined, status: undefined }
    });
    // Mocked remoteRequest returns {} -> data/ maxPage/ page fall back to []/1/1
    expect(env.data[DAEMON_ID]).toEqual({ instances: [], maxPage: 1, page: 1 });
  });

  it("GET /remote_services_system -> info/overview per daemon", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/service/remote_services_system")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("info/overview");
    expect(Array.isArray(env.data)).toBe(true);
  });

  it("GET /remote_services -> instance/overview per daemon + service shape", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/service/remote_services")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("instance/overview");
    expect(env.data).toEqual([
      expect.objectContaining({
        uuid: DAEMON_ID,
        ip: "127.0.0.1",
        port: 24444,
        prefix: "",
        available: true,
        remarks: "Local",
        instances: {}
      })
    ]);
  });

  it("POST /remote_service registers a new daemon and logs daemon_create", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/service/remote_service")
      .set(cred.headers)
      .query(tokenQuery(cred.token))
      .send({ apiKey: "new-key", port: 24445, ip: "10.0.0.1", remarks: "NewDaemon" });
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toBe("new-daemon");
    expect(RemoteServiceSubsystem.registerRemoteService).toHaveBeenCalledWith({
      apiKey: "new-key",
      port: 24445,
      ip: "10.0.0.1",
      prefix: "",
      remarks: "NewDaemon"
    });
    expect(operationLogger.log).toHaveBeenCalledWith(
      "daemon_create",
      expect.objectContaining({ daemon_id: "new-daemon" })
    );
  });

  it("PUT /remote_service edits existing daemon + sends info/setting + edits config", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .put("/api/service/remote_service")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&uuid=${DAEMON_ID}`)
      .send({
        port: 24445,
        ip: "10.0.0.1",
        prefix: "/x",
        apiKey: "new-key",
        remarks: "Renamed",
        remoteMappings: [],
        setting: { language: "en_us" },
        daemonPort: 24445
      });
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toBe(true);
    expect(remoteRequest).toHaveBeenCalledWith("info/setting", {
      language: "en_us",
      port: 24445
    });
    expect(RemoteServiceSubsystem.edit).toHaveBeenCalledWith(
      DAEMON_ID,
      expect.objectContaining({
        port: 24445,
        ip: "10.0.0.1",
        prefix: "/x",
        apiKey: "new-key",
        remarks: "Renamed",
        remoteMappings: []
      })
    );
    // configBefore != configAfter (port/ip/prefix/remarks changed) -> daemon_config_change logged.
    expect(operationLogger.log).toHaveBeenCalledWith(
      "daemon_config_change",
      expect.objectContaining({ daemon_id: DAEMON_ID }),
      "warning"
    );
  });

  it("DELETE /remote_service removes existing daemon and logs daemon_remove", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .delete("/api/service/remote_service")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&uuid=${DAEMON_ID}`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toBe(true);
    expect(RemoteServiceSubsystem.deleteRemoteService).toHaveBeenCalledWith(DAEMON_ID);
    expect(operationLogger.log).toHaveBeenCalledWith(
      "daemon_remove",
      expect.objectContaining({ daemon_id: DAEMON_ID, daemon_name: "Local" }),
      "error"
    );
  });

  it("GET /link_remote_service connects to the daemon and returns true", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/service/link_remote_service")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&uuid=${DAEMON_ID}`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toBe(true);
    expect(DAEMON.connect).toHaveBeenCalled();
  });
});

describe("daemon_router /service (non-admin 403)", () => {
  it("non-admin user gets 403 on /remote_services_list (insufficient level)", async () => {
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "u",
      userName: "u",
      permission: 1,
      instances: []
    } as any);
    const cred = asUser({ uuid: "u", userName: "u", permission: 1 });
    const res = await request(app.callback())
      .get("/api/service/remote_services_list")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(403);
    expect(remoteRequest).not.toHaveBeenCalled();
  });
});

describe("daemon_router /service (validator branch)", () => {
  it("rejects GET /remote_service_instances with missing page_size -> 400 (validator)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/service/remote_service_instances")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=${DAEMON_ID}&page=1`);
    const env = unwrap(res);
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("Validator failed");
    expect(String(env.data)).toContain("page_size");
    expect(remoteRequest).not.toHaveBeenCalled();
  });
});
