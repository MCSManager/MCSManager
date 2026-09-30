import { beforeEach, describe, expect, it } from "vitest";

// Importing routerApp (service/router) side-effect-loads all daemon routers and
// registers their handlers/middlewares on the singleton. This is the real test of
// whether the import chain is test-loadable.
import { routerApp } from "../../src/service/router_app";
// Explicit imports are no-ops if already loaded (clarity only).
import "../../src/routers/auth_router";

import { globalConfiguration } from "../../src/entity/config";
import { IGNORE } from "../../src/const";
import { dispatch, invoke, packetsFor } from "./router";

beforeEach(() => {
  // Mutate the real singleton config (load() is never called in tests).
  globalConfiguration.config.key = "test-key";
  globalConfiguration.config.whiteListPanelIp = false;
  globalConfiguration.config.whiteListPanelIps = ["127.0.0.1"];
});

describe("harness: imports + routerApp reachable", () => {
  it("registered at least the auth + connection events", () => {
    expect(routerApp.listenerCount("auth")).toBeGreaterThanOrEqual(1);
    expect(routerApp.listenerCount("connection")).toBeGreaterThanOrEqual(1);
  });
});

describe("harness: auth handler (invoke / handler mode)", () => {
  it("authenticates with the correct key -> {200, true} and sets the session", () => {
    const { socket, session } = invoke("auth", "test-key");
    const pkts = packetsFor(socket, "auth");
    expect(pkts).toHaveLength(1);
    expect(pkts[0].status).toBe(200);
    expect(pkts[0].data).toBe(true);
    expect(session.key).toBe("test-key");
    expect(session.login).toBe(true);
    expect(session.type).toBe("TOP_LEVEL");
  });

  it("rejects the wrong key -> {200, false} and leaves the session untouched", () => {
    const { socket, session } = invoke("auth", "WRONG");
    expect(packetsFor(socket, "auth")[0].data).toBe(false);
    expect(session.key).toBeUndefined();
    expect(session.login).toBeUndefined();
  });

  it("rejects when ip is not on the whitelist", () => {
    globalConfiguration.config.whiteListPanelIp = true;
    globalConfiguration.config.whiteListPanelIps = ["10.0.0.1"];
    const { socket } = invoke("auth", "test-key", { session: {} });
    // fakeSocket default address is 127.0.0.1 -> not allow-listed -> false
    expect(packetsFor(socket, "auth")[0].data).toBe(false);
  });
});

describe("harness: auth gate (dispatch / gate mode)", () => {
  it("silently drops a non-public event when the session is not logged in", () => {
    const { socket } = dispatch("info/overview", null, { session: {} });
    const pkts = packetsFor(socket, "info/overview");
    expect(pkts).toHaveLength(1);
    expect(pkts[0].status).toBe(500);
    expect(pkts[0].data).toBe(IGNORE);
  });
});
