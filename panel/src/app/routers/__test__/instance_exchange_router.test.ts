import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import {
  mockLog,
  mockOperationLogger,
  mockPassportService,
  mockSetting,
  mockUserSystem
} from "../../../../test/harness/mocks";

// Boundary mocks. Paths mirror the specifiers instance_exchange_router itself
// uses (co-located test file -> same relative paths). The REAL permission,
// validator and protocol-envelope middleware run; transitive deps are swapped
// for the shared in-memory factories.
vi.mock("../../setting", () =>
  mockSetting({ language: "en_us", panelId: "panel-1", registerCode: "reg-1" })
);
vi.mock("../../service/user_service", () => mockUserSystem());
vi.mock("../../service/operation_logger", () => mockOperationLogger());
vi.mock("../../service/passport_service", () => mockPassportService());
vi.mock("../../service/log", () => mockLog());

// exchange_service: inline mock so the POST / dispatch and the
// /request_buy_instance flow are isolated from the real exchange_service (which
// pulls in axios / RemoteRequest / user_service). RequestAction is re-exported
// as a plain object enum so the router's `requestAction === RequestAction.PING`
// comparisons resolve to the same string constants the real enum uses.
vi.mock("../../service/exchange_service", () => {
  const RequestAction = {
    BUY: "buy",
    RENEW: "renew",
    QUERY_INSTANCE: "query_instance",
    PING: "ping",
    SSO_TOKEN: "sso_token"
  };
  return {
    RequestAction,
    getNodeStatus: vi.fn(async () => ({
      name: "node1",
      id: "n1",
      ip: "127.0.0.1",
      port: 24444,
      available: true,
      running: 0,
      instances: 0
    })),
    buyOrRenewInstance: vi.fn(async () => ({
      instance_id: "new-inst",
      instance_config: {},
      username: "u",
      password: "p",
      uuid: "u-1",
      expire: 0
    })),
    queryInstanceByUserId: vi.fn(async () => []),
    parseUserName: vi.fn((t?: string) => (t ? String(t) : "")),
    requestUseRedeem: vi.fn(async () => ({
      hours: 24,
      payload: '{"config": {"endTime": 1000}}'
    }))
  };
});

// user_sso_service: default export is the UserSSOService class-like singleton;
// both static methods are vi.fn spies so GET /sso can flip verifySSOToken per
// test.
vi.mock("../../service/user_sso_service", () => ({
  default: {
    generateSSOToken: vi.fn(() => "sso-token-123"),
    verifySSOToken: vi.fn(() => true)
  }
}));

// utils/sync: passthrough so /request_buy_instance never exercises the real
// async-mutex (module-level mutexIdMap would accumulate state across tests).
vi.mock("../../utils/sync", () => ({
  execWithMutexId: vi.fn(async (_id: string, fn: () => Promise<any>) => fn())
}));

// validator, permission, i18n, entity/user stay REAL.

import exchangeRouter from "../instance_exchange_router";
import { createTestApp, resetSessions, unwrap } from "../../../../test/harness/app";
import { asAdmin, asPublic, tokenQuery } from "../../../../test/harness/auth";
import {
  RequestAction,
  buyOrRenewInstance,
  getNodeStatus,
  requestUseRedeem
} from "../../service/exchange_service";
import UserSSOService from "../../service/user_sso_service";
import { execWithMutexId } from "../../utils/sync";
import { loginSuccess } from "../../service/passport_service";
import userSystem from "../../service/user_service";

const app = createTestApp([exchangeRouter]);

const ADMIN = { uuid: "admin-uuid", userName: "admin", permission: 10, instances: [] as any[] };

beforeEach(() => {
  resetSessions();
  vi.mocked(userSystem.getInstance).mockReturnValue(ADMIN as any);
  vi.mocked(getNodeStatus).mockClear();
  vi.mocked(buyOrRenewInstance).mockClear();
  vi.mocked(requestUseRedeem).mockClear();
  vi.mocked(UserSSOService.generateSSOToken).mockClear();
  vi.mocked(UserSSOService.verifySSOToken).mockClear();
  vi.mocked(UserSSOService.verifySSOToken).mockReturnValue(true);
  vi.mocked(loginSuccess).mockClear();
  vi.mocked(execWithMutexId).mockClear();
});

describe("instance_exchange_router /exchange", () => {
  describe("(a) POST / (ADMIN) dispatches by request_action", () => {
    it("request_action=ping -> getNodeStatus(params) and returns the node status", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/exchange/")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ request_action: "ping", data: { node_id: "daemon-1" } });
      const env = unwrap(res);
      expect(env.status).toBe(200);
      expect(vi.mocked(getNodeStatus)).toHaveBeenCalledWith({ node_id: "daemon-1" });
      expect(env.data).toMatchObject({ name: "node1", id: "n1" });
    });

    it("request_action=buy -> buyOrRenewInstance(BUY, params) and returns the buy response", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/exchange/")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ request_action: "buy", data: { category_id: 1, node_id: "daemon-1" } });
      const env = unwrap(res);
      expect(env.status).toBe(200);
      expect(vi.mocked(buyOrRenewInstance)).toHaveBeenCalledWith(
        RequestAction.BUY,
        { category_id: 1, node_id: "daemon-1" }
      );
      expect(env.data).toMatchObject({ instance_id: "new-inst" });
    });

    it("rejects a missing request_action with envelope status 400 (Validator failed)", async () => {
      const cred = asAdmin();
      const res = await request(app.callback())
        .post("/api/exchange/")
        .set(cred.headers)
        .query(tokenQuery(cred.token))
        .send({ data: { node_id: "daemon-1" } });
      const env = unwrap(res);
      expect(env.status).toBe(400);
      expect(String(env.data)).toContain("Validator failed");
      expect(String(env.data)).toContain("request_action");
    });
  });

  describe("(b) GET /sso (PUBLIC) SSO token verify + loginSuccess", () => {
    it("verifies the SSO token -> loginSuccess(userName) + 302 redirect to the origin terminal", async () => {
      const cred = asPublic();
      const res = await request(app.callback())
        .get("/api/exchange/sso")
        .query(
          "username=alice&token=valid-sso-token&instanceId=inst-1&daemonId=daemon-1&origin=" +
            encodeURIComponent("http://example.com")
        )
        .redirects(0);
      // loginSuccess was called with the resolved userName.
      expect(vi.mocked(loginSuccess)).toHaveBeenCalledWith(expect.anything(), "alice");
      // The route issued a 302 redirect to the origin terminal URL.
      const env = unwrap(res);
      expect(env.status).toBe(302);
      const location = res.headers.location ?? "";
      expect(location).toContain("/#/instances/terminal");
      expect(location).toContain("daemonId=daemon-1");
      expect(location).toContain("instanceId=inst-1");
      expect(location).toContain("from=sso");
    });

    it("invalid SSO token -> error branch (envelope 400, SSO failed message) and loginSuccess not called", async () => {
      vi.mocked(UserSSOService.verifySSOToken).mockReturnValue(false);
      const cred = asPublic();
      const res = await request(app.callback())
        .get("/api/exchange/sso")
        .query(
          "username=alice&token=bad-token&instanceId=inst-1&daemonId=daemon-1&origin=" +
            encodeURIComponent("http://example.com")
        )
        .redirects(0);
      const env = unwrap(res);
      // The handler throws `$t("TXT_CODE_13411df7")` ("SSO login failed...")
      // for an invalid token. The shared `validator` middleware wraps
      // `await next()` in its own try/catch, so the handler's thrown Error is
      // caught there and surfaced as envelope status 400 (not 500) — the SSO
      // error message is still preserved in `data`. This is a shared-middleware
      // behavior, not a router bug; assert the actual status.
      expect(env.status).toBe(400);
      expect(String(env.data)).toContain("SSO login failed");
      expect(vi.mocked(loginSuccess)).not.toHaveBeenCalled();
    });
  });

  describe("(c) POST /request_buy_instance (PUBLIC) requestUseRedeem + buyOrRenewInstance", () => {
    it("redeems the code then buys the instance -> response passthrough", async () => {
      const cred = asPublic();
      const res = await request(app.callback())
        .post("/api/exchange/request_buy_instance")
        .send({ productId: 1, daemonId: "daemon-1", code: "CODE-1" });
      const env = unwrap(res);
      expect(env.status).toBe(200);
      // First the redeem code is validated (isDelete=false).
      expect(vi.mocked(requestUseRedeem)).toHaveBeenCalledWith(
        "panel-1",
        "reg-1",
        1,
        "daemon-1",
        "CODE-1",
        false
      );
      // Then buyOrRenewInstance runs with the BUY action (no instanceId -> BUY).
      expect(vi.mocked(buyOrRenewInstance)).toHaveBeenCalledWith(
        RequestAction.BUY,
        expect.objectContaining({
          category_id: 1,
          node_id: "daemon-1",
          hours: 24,
          code: "CODE-1"
        }),
        expect.objectContaining({ onCreateConfirm: expect.any(Function) })
      );
      expect(env.data).toMatchObject({ instance_id: "new-inst" });
    });

    it("rejects a missing productId with envelope status 400 (Validator failed)", async () => {
      const cred = asPublic();
      const res = await request(app.callback())
        .post("/api/exchange/request_buy_instance")
        .send({ daemonId: "daemon-1", code: "CODE-1" });
      const env = unwrap(res);
      expect(env.status).toBe(400);
      expect(String(env.data)).toContain("Validator failed");
      expect(String(env.data)).toContain("productId");
    });
  });
});
