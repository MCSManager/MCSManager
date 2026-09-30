import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import {
  mockLog,
  mockPassportService,
  mockSetting,
  mockUserSystem
} from "../../../../test/harness/mocks";

// Boundary mocks. Paths mirror the specifiers upgrade_router itself uses.
vi.mock("../../setting", () => mockSetting({ enableApiKey: false, language: "en_us" }));
vi.mock("../../service/user_service", () => mockUserSystem());
vi.mock("../../service/passport_service", () => mockPassportService());
vi.mock("../../service/log", () => mockLog());

// remote_command: constructor + prototype.request spy; per-call event + payload
// asserted by the forwarding tests.
vi.mock("../../service/remote_command", () => {
  function RemoteRequest(this: any, _rService?: any) {}
  (RemoteRequest as any).prototype.request = vi.fn(async () => ({
    version: "daemon-up-grade",
    notes: "remote-notes"
  }));
  class RemoteRequestTimeoutError extends Error {}
  return { default: RemoteRequest, RemoteRequestTimeoutError };
});

// remote_service: default export is the RemoteServiceSubsystem singleton.
// `services` is a real Map (native .has() used by requireDaemon); getInstance
// is a spy over the map.
vi.mock("../../service/remote_service", () => {
  const services = new Map();
  return {
    default: {
      services,
      getInstance: vi.fn((uuid: string) => services.get(uuid))
    }
  };
});

// upgrade_service: inline stubs so the panel self-update path is exercised
// WITHOUT touching the real overlay/download/restart machinery.
vi.mock("../../service/upgrade_service", () => ({
  getUpgradeInfo: vi.fn(async () => ({
    configured: true,
    currentVersion: "9.999.0",
    onlineVersion: "9.999.1",
    onlineNotes: "online-notes",
    updateAvailable: true,
    updateSourceUrl: "http://example/manifest.json"
  })),
  performUpgrade: vi.fn(async () => ({ started: true, onlineVersion: "9.999.1" }))
}));

// version: protocol middleware imports getVersion() for the X-Version header.
vi.mock("../../version", () => ({
  getVersion: vi.fn(() => "9.999.0")
}));

// permission, validator, entity/user, i18n stay REAL.

import upgradeRouter from "../upgrade_router";
import { createTestApp, resetSessions, unwrap } from "../../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../../test/harness/auth";
import RemoteRequest from "../../service/remote_command";
import RemoteServiceSubsystem from "../../service/remote_service";
import userSystem from "../../service/user_service";
import { systemConfig } from "../../setting";
import { getUpgradeInfo, performUpgrade } from "../../service/upgrade_service";

const remoteRequest = vi.mocked(RemoteRequest.prototype.request as any);

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };

const app = createTestApp([upgradeRouter]);

const DAEMON = {
  uuid: "daemon-1",
  available: true,
  socket: { connected: true },
  config: { ip: "127.0.0.1", port: 24444, prefix: "", remarks: "Local" }
};

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  remoteRequest.mockClear();
  vi.mocked(getUpgradeInfo).mockClear();
  vi.mocked(performUpgrade).mockClear();
  // reset updateSourceUrl between tests (forwardedSource reads it).
  (systemConfig as any).updateSourceUrl = "";
  RemoteServiceSubsystem.services.clear();
});

describe("upgrade_router GET /panel_info (ADMIN)", () => {
  it("admin gets upgrade info passthrough from getUpgradeInfo", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/upgrade/panel_info")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(getUpgradeInfo).toHaveBeenCalled();
    expect(env.data).toMatchObject({
      configured: true,
      currentVersion: "9.999.0",
      onlineVersion: "9.999.1",
      onlineNotes: "online-notes",
      updateAvailable: true
    });
  });

  it("non-admin -> 403", async () => {
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "u",
      userName: "u",
      permission: 1,
      instances: []
    } as any);
    const cred = asUser({ uuid: "u", userName: "u", permission: 1 });
    const res = await request(app.callback())
      .get("/api/upgrade/panel_info")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(403);
  });
});

describe("upgrade_router POST /panel (ADMIN)", () => {
  it("admin triggers performUpgrade -> success shape (mocked, no real overlay)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/upgrade/panel")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(performUpgrade).toHaveBeenCalled();
    expect(env.data).toMatchObject({ started: true, onlineVersion: "9.999.1" });
  });

  it("performUpgrade failure -> 500 with {started:false, message}", async () => {
    vi.mocked(performUpgrade).mockRejectedValueOnce(new Error("download failed"));
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/upgrade/panel")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(500);
    expect(env.data).toMatchObject({ started: false, message: "download failed" });
  });

  it("non-admin -> 403", async () => {
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "u",
      userName: "u",
      permission: 1,
      instances: []
    } as any);
    const cred = asUser({ uuid: "u", userName: "u", permission: 1 });
    const res = await request(app.callback())
      .post("/api/upgrade/panel")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(403);
  });
});

describe("upgrade_router GET /daemon_info (ADMIN, validator uuid)", () => {
  it("admin forwards upgrade/info to the daemon with forwardedSource()", async () => {
    RemoteServiceSubsystem.services.set("daemon-1", DAEMON);
    (systemConfig as any).updateSourceUrl = "http://example/manifest.json";
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/upgrade/daemon_info")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&uuid=daemon-1`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith(
      "upgrade/info",
      { updateSourceUrl: "http://example/manifest.json" },
      25000
    );
  });

  it("forwards an empty object when updateSourceUrl is unset", async () => {
    RemoteServiceSubsystem.services.set("daemon-1", DAEMON);
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/upgrade/daemon_info")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&uuid=daemon-1`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("upgrade/info", {}, 25000);
  });

  it("missing uuid -> 400 (Validator failed: uuid)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/upgrade/daemon_info")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("Validator failed");
    expect(String(env.data)).toContain("uuid");
  });

  it("unknown uuid (daemon missing) -> 500 with daemon-missing message", async () => {
    // services map is empty -> requireDaemon throws
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/upgrade/daemon_info")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&uuid=does-not-exist`);
    const env = unwrap(res);
    expect(env.status).toBe(500);
    expect(String(env.data.message || env.data)).toContain("not exist");
  });

  it("non-admin -> 403", async () => {
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "u",
      userName: "u",
      permission: 1,
      instances: []
    } as any);
    const cred = asUser({ uuid: "u", userName: "u", permission: 1 });
    const res = await request(app.callback())
      .get("/api/upgrade/daemon_info")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&uuid=daemon-1`);
    const env = unwrap(res);
    expect(env.status).toBe(403);
  });
});

describe("upgrade_router POST /daemon (ADMIN, validator uuid)", () => {
  it("admin forwards upgrade/daemon to the daemon with forwardedSource()", async () => {
    RemoteServiceSubsystem.services.set("daemon-1", DAEMON);
    (systemConfig as any).updateSourceUrl = "http://example/manifest.json";
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/upgrade/daemon")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&uuid=daemon-1`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith(
      "upgrade/daemon",
      { updateSourceUrl: "http://example/manifest.json" },
      180000
    );
  });

  it("missing uuid -> 400 (Validator failed: uuid)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/upgrade/daemon")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("Validator failed");
    expect(String(env.data)).toContain("uuid");
  });

  it("unknown uuid (daemon missing) -> 500 with started:false + message", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/upgrade/daemon")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&uuid=does-not-exist`);
    const env = unwrap(res);
    expect(env.status).toBe(500);
    expect(env.data).toMatchObject({ started: false });
    expect(String(env.data.message || env.data)).toContain("not exist");
  });

  it("non-admin -> 403", async () => {
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "u",
      userName: "u",
      permission: 1,
      instances: []
    } as any);
    const cred = asUser({ uuid: "u", userName: "u", permission: 1 });
    const res = await request(app.callback())
      .post("/api/upgrade/daemon")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&uuid=daemon-1`);
    const env = unwrap(res);
    expect(env.status).toBe(403);
  });
});
