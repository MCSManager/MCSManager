import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import {
  mockLog,
  mockOperationLogger,
  mockPassportService,
  mockSetting,
  mockUserSystem
} from "../../../../test/harness/mocks";

// Boundary mocks. Paths mirror the specifiers environment_router itself uses
// (co-located test file -> same relative paths). The REAL permission and
// protocol-envelope middleware run; transitive deps are swapped for the shared
// in-memory factories.
vi.mock("../../setting", () => mockSetting({ language: "en_us" }));
vi.mock("../../service/user_service", () => mockUserSystem());
vi.mock("../../service/passport_service", () => mockPassportService());
vi.mock("../../service/log", () => mockLog());
vi.mock("../../service/operation_logger", () => mockOperationLogger());

// remote_command: default export is a constructor whose prototype.request is a
// single shared vi.fn spy. `new RemoteRequest(svc).request("environment/images", {})
// hits that spy, so tests assert the forwarded daemon event + payload.
vi.mock("../../service/remote_command", () => {
  function RemoteRequest(this: any, _rService?: any) {}
  (RemoteRequest as any).prototype.request = vi.fn(async (event: string, data: any) => ({
    event,
    data
  }));
  class RemoteRequestTimeoutError extends Error {}
  return { default: RemoteRequest, RemoteRequestTimeoutError };
});

// remote_service: default export is the RemoteServiceSubsystem singleton.
// `services` is a real Map; getInstance returns entries from it.
vi.mock("../../service/remote_service", () => {
  const services = new Map();
  return {
    default: {
      services,
      getInstance: vi.fn((uuid: string) => services.get(uuid))
    }
  };
});

// axios: dockerhub_image_platforms fetches directly from the Docker registry
// via axios.get (NOT via RemoteRequest). The factory implementation
// differentiates the token endpoint from the manifest endpoint by URL.
vi.mock("axios", () => ({
  default: {
    get: vi.fn(async (url: any) => {
      const s = String(url);
      if (s.includes("auth.docker.io/token")) {
        return { status: 200, data: { token: "tok-123" } };
      }
      return {
        status: 200,
        data: {
          manifests: [
            { platform: { os: "linux", architecture: "amd64" } },
            { platform: { os: "linux", architecture: "arm64" } }
          ]
        }
      };
    })
  }
}));

// permission, entity/user, validator, i18n, mcsmanager-common stay REAL.

import environmentRouter from "../environment_router";
import { createTestApp, resetSessions, unwrap } from "../../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../../test/harness/auth";
import RemoteRequest from "../../service/remote_command";
import RemoteServiceSubsystem from "../../service/remote_service";
import userSystem from "../../service/user_service";
import axios from "axios";

// Shared spies on the prototype / mock objects.
const remoteRequest = vi.mocked(RemoteRequest.prototype.request as any);
const axiosGet = vi.mocked((axios as any).get as any);

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };
const DAEMON = { uuid: "daemon-1", available: true };

const app = createTestApp([environmentRouter]);

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  remoteRequest.mockClear();
  axiosGet.mockClear();
  RemoteServiceSubsystem.services.clear();
  RemoteServiceSubsystem.services.set("daemon-1", DAEMON);
});

describe("environment_router /environment (ADMIN) - daemon forwarding routes", () => {
  it("GET /image forwards environment/images to the daemon with empty payload", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/environment/image")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=daemon-1`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("environment/images", {});
    expect(env.data).toEqual({ event: "environment/images", data: {} });
  });

  it("POST /image forwards environment/new_image with the body config", async () => {
    const cred = asAdmin();
    const config = { image: "nginx", tag: "latest" };
    const res = await request(app.callback())
      .post("/api/environment/image")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=daemon-1`)
      .send(config);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("environment/new_image", config);
    expect(env.data).toEqual({ event: "environment/new_image", data: config });
  });

  it("DELETE /image forwards environment/del_image with {imageId}", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .delete("/api/environment/image")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=daemon-1&imageId=img-123`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("environment/del_image", { imageId: "img-123" });
  });

  it("DELETE /image rejects a missing imageId with envelope 400 (Validator failed)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .delete("/api/environment/image")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=daemon-1`);
    const env = unwrap(res);
    expect(env.status).toBe(400);
    expect(String(env.data)).toContain("Validator failed");
    expect(String(env.data)).toContain("imageId");
    expect(remoteRequest).not.toHaveBeenCalled();
  });

  it("GET /containers forwards environment/containers to the daemon", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/environment/containers")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=daemon-1`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("environment/containers", {});
  });

  it("GET /networkModes forwards environment/networkModes to the daemon", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/environment/networkModes")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=daemon-1`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("environment/networkModes", {});
  });

  it("GET /progress forwards environment/progress to the daemon", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .get("/api/environment/progress")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=daemon-1`);
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("environment/progress", {});
  });

  it("POST /image_platforms forwards environment/image_platforms with {imageName}", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/environment/image_platforms")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=daemon-1`)
      .send({ imageName: "nginx" });
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(remoteRequest).toHaveBeenCalledWith("environment/image_platforms", { imageName: "nginx" });
  });

  it("POST /image_platforms returns body {status:400} when imageName is missing", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/environment/image_platforms")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=daemon-1`)
      .send({});
    const env = unwrap(res);
    // The handler sets ctx.body = {status:400, message:"Image name is required"};
    // protocol wraps it as envelope {status:200, data:{...}}.
    expect(env.status).toBe(200);
    expect(env.data).toEqual({ status: 400, message: "Image name is required" });
    expect(remoteRequest).not.toHaveBeenCalled();
  });
});

describe("environment_router POST /dockerhub_image_platforms (axios, NOT RemoteRequest)", () => {
  it("fetches platforms via axios.get to the Docker registry and returns the normalized list", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/environment/dockerhub_image_platforms")
      .set(cred.headers)
      .query(tokenQuery(cred.token))
      .send({ imageName: "nginx" });
    const env = unwrap(res);
    expect(env.status).toBe(200);
    // axios.get was called (twice: token endpoint + manifest endpoint).
    expect(axiosGet).toHaveBeenCalled();
    // RemoteRequest was NOT called (this route bypasses the daemon RPC).
    expect(remoteRequest).not.toHaveBeenCalled();
    // normalizeDockerPlatform produced "linux/amd64" and "linux/arm64".
    expect(env.data).toEqual(["linux/amd64", "linux/arm64"]);
  });

  it("returns body {status:400} when imageName is missing (and does not call axios)", async () => {
    const cred = asAdmin();
    const res = await request(app.callback())
      .post("/api/environment/dockerhub_image_platforms")
      .set(cred.headers)
      .query(tokenQuery(cred.token))
      .send({});
    const env = unwrap(res);
    expect(env.data).toEqual({ status: 400, message: "Image name is required" });
    expect(axiosGet).not.toHaveBeenCalled();
    expect(remoteRequest).not.toHaveBeenCalled();
  });
});

describe("environment_router non-admin authorization gate", () => {
  it("non-admin user -> 403 verificationFailed (RemoteRequest not called)", async () => {
    vi.mocked(userSystem.getInstance).mockReturnValue({
      uuid: "u",
      userName: "u",
      permission: 1,
      instances: []
    } as any);
    const cred = asUser({ uuid: "u", userName: "u", permission: 1 });
    const res = await request(app.callback())
      .get("/api/environment/image")
      .set(cred.headers)
      .query(`${tokenQuery(cred.token)}&daemonId=daemon-1`);
    const env = unwrap(res);
    expect(env.status).toBe(403);
    expect(remoteRequest).not.toHaveBeenCalled();
  });
});
