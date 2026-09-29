import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import {
  mockLog,
  mockOperationLogger,
  mockPassportService,
  mockSetting,
  mockUserSystem
} from "../../../test/harness/mocks";

// Boundary mocks. Paths mirror the specifiers settings_router itself uses.
vi.mock("../setting", () => mockSetting({ language: "en_us", enableApiKey: false }));
vi.mock("../service/user_service", () => {
  const m = mockUserSystem();
  // settings_router calls userSystem.unbindAllSso() when identity-critical SSO
  // fields change; the shared factory omits it, so extend inline.
  (m.default as any).unbindAllSso = vi.fn(async () => 0);
  return m;
});
vi.mock("../service/passport_service", () => mockPassportService());
vi.mock("../service/log", () => mockLog());
vi.mock("../service/operation_logger", () => {
  const base = mockOperationLogger();
  // settings_router calls runRetention() after saving; shared factory omits it.
  (base.operationLogger as any).runRetention = vi.fn(async () => undefined);
  // get/getOperationLoggerOperator already present from the shared factory.
  return base;
});

// remote_service: settings_router calls remoteService.changeDaemonLanguage on a
// language change. Provide a thin singleton mock.
vi.mock("../service/remote_service", () => ({
  default: {
    changeDaemonLanguage: vi.fn()
  }
}));

// frontend_layout: inline stubs for get/set/reset.
vi.mock("../service/frontend_layout", () => ({
  getFrontendLayoutConfig: vi.fn(() => "layout-json"),
  setFrontendLayoutConfig: vi.fn(),
  resetFrontendLayoutConfig: vi.fn()
}));

// version: settings_router calls checkBusinessMode() after saving config.
// protocol.ts also imports getVersion() to set the X-Version header, so the
// mock must expose it too (same module specifier from protocol's view).
vi.mock("../version", () => ({
  getVersion: vi.fn(() => "9.999.0"),
  checkBusinessMode: vi.fn(async () => undefined)
}));

// limit: passthrough so refresh_business_mode never exercises the real limiter.
vi.mock("../middleware/limit", () => ({
  speedLimit: (_seconds: number) => async (_ctx: any, next: Function) => next()
}));

// sso_service: settings_router requires verifyIssuer dynamically when enabling
// OIDC. vi.mock intercepts the require too (same module specifier).
vi.mock("../service/sso_service", () => ({
  verifyIssuer: vi.fn(async () => undefined)
}));

// fs-extra: mock the FS boundary the upload_assets route and the presetPackAddr
// cache-clear in PUT /setting touch.
vi.mock("fs-extra", () => {
  const fns = {
    remove: vi.fn(async () => undefined),
    existsSync: vi.fn(() => true),
    mkdirsSync: vi.fn(),
    move: vi.fn(async () => undefined)
  };
  return { ...fns, default: fns };
});

// permission, validator, entity/user, entity/setting, i18n, common/config_diff,
// utils/safe, const, uuid, path, formidable stay REAL.

import settingsRouter from "./settings_router";
import { createTestApp, resetSessions, unwrap } from "../../../test/harness/app";
import { asAdmin, asUser, tokenQuery } from "../../../test/harness/auth";
import userSystem from "../service/user_service";
import { operationLogger } from "../service/operation_logger";
import * as frontendLayout from "../service/frontend_layout";
import { checkBusinessMode } from "../version";
import { verifyIssuer } from "../service/sso_service";
import { saveSystemConfig, systemConfig } from "../setting";

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };

const app = createTestApp([settingsRouter]);

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  vi.mocked(frontendLayout.getFrontendLayoutConfig).mockClear();
  vi.mocked(frontendLayout.setFrontendLayoutConfig).mockClear();
  vi.mocked(frontendLayout.resetFrontendLayoutConfig).mockClear();
  vi.mocked(checkBusinessMode).mockClear();
  vi.mocked(verifyIssuer).mockClear();
  vi.mocked(saveSystemConfig).mockClear();
  vi.mocked(operationLogger.log as any).mockClear();
  vi.mocked(operationLogger.runRetention as any).mockClear();
});

describe("settings_router /overview (settings)", () => {
  describe("GET /setting (ADMIN)", () => {
    it("returns systemConfig with ssoClientSecret blanked", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .get("/api/overview/setting")
        .set(cred.headers)
        .query(tokenQuery(cred.token));
      const env = unwrap(res);
      expect(env.status).toBe(200);
      expect(env.data.ssoClientSecret).toBe("");
      expect(env.data).toHaveProperty("loginInfo");
    });
  });

  describe("PUT /setting (ADMIN)", () => {
    it("mutates systemConfig, calls saveSystemConfig + checkBusinessMode, returns OK", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .put("/api/overview/setting")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ httpIp: "0.0.0.0", httpPort: 12345 });
      const env = unwrap(res);
      expect(env.status).toBe(200);
      expect(env.data).toBe("OK");
      expect(systemConfig.httpIp).toBe("0.0.0.0");
      expect(systemConfig.httpPort).toBe(12345);
      expect(saveSystemConfig).toHaveBeenCalledWith(systemConfig);
      expect(checkBusinessMode).toHaveBeenCalled();
      expect(operationLogger.runRetention).toHaveBeenCalled();
    });

    it("SSO OIDC branch: rejects a non-https issuer URL before reaching verifyIssuer", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .put("/api/overview/setting")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({
          ssoEnabled: true,
          ssoIssuer: "http://insecure.example",
          ssoClientId: "cid",
          ssoClientSecret: "secret"
        });
      const env = unwrap(res);
      // This validation runs in the OIDC branch BEFORE the dynamic
      // require("../service/sso_service"). It proves the SSO code path is
      // entered. See docs/test-doubts/panel-settings_router-put_setting.md
      // for why the verifyIssuer require branch itself is not asserted.
      expect(env.status).toBe(500);
      expect(String(env.data)).toContain("SSO Issuer URL must use the https protocol");
    });

    // verifyIssuer happy-path is intentionally skipped: the handler does
    // `const { verifyIssuer } = require("../service/sso_service")` at runtime.
    // vitest's `vi.mock` does not intercept native require() calls for .ts
    // modules in the `node` environment, so the require fails with
    // MODULE_NOT_FOUND. See docs/test-doubts/panel-settings_router-put_setting.md
    it.skip("SSO verifyIssuer branch: enabling SSO would call verifyIssuer (require() not interceptable)", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .put("/api/overview/setting")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({
          ssoEnabled: true,
          ssoIssuer: "https://issuer.example",
          ssoClientId: "cid",
          ssoClientSecret: "secret"
        });
      const env = unwrap(res);
      expect(env.status).toBe(200);
      expect(env.data).toBe("OK");
      expect(verifyIssuer).toHaveBeenCalledWith("https://issuer.example", "cid", "secret");
    });
  });

  describe("PUT /install (anon, no auth)", () => {
    it("returns OK when no users exist (public route -> no 403)", async () => {
      const res = await request(app.callback())
        .put("/api/overview/install")
        .send({ language: "en_us" });
      const env = unwrap(res);
      expect(env.status).toBe(200);
      expect(env.data).toBe("OK");
      expect(saveSystemConfig).toHaveBeenCalled();
    });
  });

  describe("GET /layout (no auth)", () => {
    it("returns the frontend layout config string", async () => {
      const res = await request(app.callback()).get("/api/overview/layout");
      const env = unwrap(res);
      expect(env.status).toBe(200);
      expect(env.data).toBe("layout-json");
    });
  });

  describe("POST /layout (ADMIN)", () => {
    it("saves layout config and returns true", async () => {
      const cred = asAdmin();
      const layout = [{ page: "/overview", items: [] }];
      const res = await request(app.callback())
        .post("/api/overview/layout")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send(layout);
      const env = unwrap(res);
      expect(env.status).toBe(200);
      expect(env.data).toBe(true);
      expect(frontendLayout.setFrontendLayoutConfig).toHaveBeenCalledWith(layout);
    });
  });

  describe("DELETE /layout (ADMIN)", () => {
    it("resets layout config and returns true", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .delete("/api/overview/layout")
        .set(cred.headers)
        .query(tokenQuery(cred.token));
      const env = unwrap(res);
      expect(env.status).toBe(200);
      expect(env.data).toBe(true);
      expect(frontendLayout.resetFrontendLayoutConfig).toHaveBeenCalled();
    });
  });

  describe("POST /upload_assets (ADMIN)", () => {
    it("admin reaches the handler; no file body -> 500 error shape (admin gate passed)", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/overview/upload_assets")
        .set(cred.headers)
        .query(tokenQuery(cred.token));
      const env = unwrap(res);
      // Non-admin would get 403 before the handler. Admin reaches it; the
      // harness koaBody has multipart:false so ctx.request.files is undefined
      // -> handler throws "Request Body Error" (TXT_CODE_e4d6cc20) -> 500.
      expect(env.status).toBe(500);
      expect(String(env.data)).toContain("Request Body Error");
    });

    it("non-admin -> 403 (insufficient level)", async () => {
      vi.mocked(userSystem.getInstance).mockReturnValue({
        uuid: "u",
        userName: "u",
        permission: 1,
        instances: []
      } as any);
      const cred = asUser({ uuid: "u", userName: "u", permission: 1 });
      const res = await request(app.callback())
        .post("/api/overview/upload_assets")
        .set(cred.headers)
        .query(tokenQuery(cred.token));
      const env = unwrap(res);
      expect(env.status).toBe(403);
    });
  });

  describe("POST /refresh_business_mode (ADMIN, speedLimit 5)", () => {
    it("calls checkBusinessMode and returns OK", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/overview/refresh_business_mode")
        .set(cred.headers)
        .query(tokenQuery(cred.token));
      const env = unwrap(res);
      expect(env.status).toBe(200);
      expect(env.data).toBe("OK");
      expect(checkBusinessMode).toHaveBeenCalled();
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
        .post("/api/overview/refresh_business_mode")
        .set(cred.headers)
        .query(tokenQuery(cred.token));
      const env = unwrap(res);
      expect(env.status).toBe(403);
    });
  });
});
