import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import {
  mockLog,
  mockOperationLogger,
  mockPassportService,
  mockSetting,
  mockUserSystem
} from "../../../../test/harness/mocks";

// Boundary mocks. Paths mirror the specifiers overview_router itself uses
// (co-located test file -> same relative paths). The REAL permission and
// protocol envelope middleware run; transitive deps are swapped for the
// shared in-memory factories.
vi.mock("../../setting", () => mockSetting({ enableApiKey: false, language: "en_us" }));
vi.mock("../../service/user_service", () => mockUserSystem());
vi.mock("../../service/passport_service", () => mockPassportService());
vi.mock("../../service/log", () => mockLog());

// operation_logger: shared factory lacks the get/search/runRetention the
// overview routes call, so extend operationLogger inline.
vi.mock("../../service/operation_logger", () => {
  const base = mockOperationLogger();
  (base.operationLogger as any).get = vi.fn(async () => [{ type: "user_login" }]);
  (base.operationLogger as any).search = vi.fn(async () => ({
    page: 1,
    pageSize: 20,
    maxPage: 1,
    total: 0,
    data: []
  }));
  (base.operationLogger as any).runRetention = vi.fn(async () => undefined);
  return base;
});

// remote_command: default export is a constructor whose prototype.request is a
// single shared vi.fn. `new RemoteRequest(svc).request("info/overview")` hits
// that spy, so tests assert the forwarded daemon event.
vi.mock("../../service/remote_command", () => {
  function RemoteRequest(this: any, _rService?: any) {}
  (RemoteRequest as any).prototype.request = vi.fn(async () => ({ version: "daemon-ver" }));
  class RemoteRequestTimeoutError extends Error {}
  return { default: RemoteRequest, RemoteRequestTimeoutError };
});

// remote_service: default export is the RemoteServiceSubsystem singleton.
// `services` is a real Map populated from tests; count/getInstance are spies
// over it, mirroring the real subsystem behavior.
vi.mock("../../service/remote_service", () => {
  const services = new Map();
  return {
    default: {
      services,
      count: vi.fn(() => {
        let total = 0;
        let available = 0;
        services.forEach((v: any) => {
          total++;
          if (v.available) available++;
        });
        return { available, total };
      }),
      getInstance: vi.fn((uuid: string) => services.get(uuid))
    }
  };
});

// visual_data: protocol middleware calls addRequestCount; the overview handler
// reads the chart arrays.
vi.mock("../../service/visual_data", () => ({
  default: {
    addRequestCount: vi.fn(),
    getSystemChartArray: vi.fn(() => []),
    getStatusChartArray: vi.fn(() => [])
  }
}));

// version: inline stubs the overview handler reads.
vi.mock("../../version", () => ({
  getVersion: vi.fn(() => "9.999.0"),
  specifiedDaemonVersion: vi.fn(() => "4.0.0")
}));

// permission, entity/user, i18n, mcsmanager-common stay REAL.

import overviewRouter from "../overview_router";
import { createTestApp, resetSessions, unwrap } from "../../../../test/harness/app";
import { asAdmin, asApiKey, asUser, tokenQuery } from "../../../../test/harness/auth";
import RemoteRequest from "../../service/remote_command";
import RemoteServiceSubsystem from "../../service/remote_service";
import { operationLogger } from "../../service/operation_logger";
import * as passport from "../../service/passport_service";
import userSystem from "../../service/user_service";
import { systemConfig } from "../../setting";

// Shared spy on the prototype (see remote_command factory above).
const remoteRequest = vi.mocked(RemoteRequest.prototype.request as any);
const opGet = vi.mocked(operationLogger.get as any);
const opSearch = vi.mocked(operationLogger.search as any);

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };

const app = createTestApp([overviewRouter]);

const DAEMON = {
  uuid: "daemon-1",
  available: true,
  socket: {},
  config: {
    ip: "127.0.0.1",
    port: 24444,
    prefix: "",
    remarks: "Local",
    remoteMappings: []
  }
};

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  remoteRequest.mockClear();
  opGet.mockClear();
  opSearch.mockClear();
  vi.mocked(passport.getUuidByApiKey).mockReturnValue(null);
  (systemConfig as any).enableApiKey = false;
  RemoteServiceSubsystem.services.clear();
});

describe("overview_router GET / (ADMIN): daemon fan-out -> aggregated shape", () => {
  it("admin gets overview with remote daemon info aggregated", async () => {
    RemoteServiceSubsystem.services.set("daemon-1", DAEMON);
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/overview")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toMatchObject({
      version: "9.999.0",
      specifiedDaemonVersion: "4.0.0",
      remoteCount: { available: 1, total: 1 },
      remote: [
        expect.objectContaining({
          uuid: "daemon-1",
          ip: "127.0.0.1",
          port: 24444,
          available: true,
          remarks: "Local",
          version: "daemon-ver"
        })
      ]
    });
    expect(remoteRequest).toHaveBeenCalledWith("info/overview");
    expect(env.data).toHaveProperty("process");
    expect(env.data).toHaveProperty("record");
    expect(env.data).toHaveProperty("system");
    expect(env.data).toHaveProperty("chart");
  });

  it("non-admin user -> 403 verificationFailed", async () => {
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "u",
      userName: "u",
      permission: 1,
      instances: []
    } as any);
    const cred = asUser({ uuid: "u", userName: "u", permission: 1 });
    const res = await request(app.callback())
      .get("/api/overview")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(403);
  });
});

describe("Review Focus #2: API key path on GET /", () => {
  it("enableApiKey=false + x-request-api-key header -> 403 disabledApiKey (TXT_CODE_db253979)", async () => {
    (systemConfig as any).enableApiKey = false;
    const res = await request(app.callback()).get("/api/overview").set(asApiKey().headers);
    const env = unwrap(res);
    expect(env.status).toBe(403);
    // The i18n key TXT_CODE_db253979 -> "API key creation feature is not enabled".
    expect(String(env.data)).toContain("API key");
  });

  it("enableApiKey=true + matching admin apiKey -> 200 (api key path)", async () => {
    (systemConfig as any).enableApiKey = true;
    vi.mocked(passport.getUuidByApiKey).mockReturnValue({
      uuid: "admin-uuid",
      userName: "admin",
      permission: 10
    } as any);
    const res = await request(app.callback()).get("/api/overview").set(asApiKey().headers);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toHaveProperty("remote");
    expect(env.data).toHaveProperty("remoteCount");
  });
});

describe("overview_router GET /operation_logs (ADMIN)", () => {
  it("admin gets the recent operation logs via operationLogger.get(limit)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/overview/operation_logs")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&limit=10`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(opGet).toHaveBeenCalledWith(10);
    expect(Array.isArray(env.data)).toBe(true);
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
      .get("/api/overview/operation_logs")
      .set(cred.headers)
      .query(tokenQuery(cred.token));
    const env = unwrap(res);
    expect(env.status).toBe(403);
  });
});

describe("overview_router GET /operation_logs/search (ADMIN)", () => {
  it("admin search forwards filters to operationLogger.search and returns paginated shape", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/overview/operation_logs/search")
      .set(cred.headers)
      .query(
        `${tokenQuery(cred.token)}&page=2&page_size=50&type=user_login&keyword=hello`
      );
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(opSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        pageSize: 50,
        type: "user_login",
        keyword: "hello"
      })
    );
    expect(env.data).toMatchObject({ page: 1, pageSize: 20, total: 0, data: [] });
  });
});
