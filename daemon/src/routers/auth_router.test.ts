import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { globalConfiguration } from "../entity/config";
import { IGNORE } from "../const";
import { dispatch, invoke, packetsFor } from "../../test/harness/router";

// Register the auth handler + gate on the singleton routerApp.
import "./auth_router";

beforeEach(() => {
  globalConfiguration.config.key = "test-key";
  globalConfiguration.config.whiteListPanelIp = false;
  globalConfiguration.config.whiteListPanelIps = ["127.0.0.1"];
});

describe("auth handler", () => {
  it("authenticates with the correct key -> {200, true} + trusted session", () => {
    const { socket, session } = invoke("auth", "test-key");
    const pkts = packetsFor(socket, "auth");
    expect(pkts).toHaveLength(1);
    expect(pkts[0].status).toBe(200);
    expect(pkts[0].data).toBe(true);
    expect(session.key).toBe("test-key");
    expect(session.type).toBe("TOP_LEVEL");
    expect(session.login).toBe(true);
  });

  it("rejects the wrong key -> {200, false} without setting the session", () => {
    const { socket, session } = invoke("auth", "WRONG");
    expect(packetsFor(socket, "auth")[0].data).toBe(false);
    expect(session.login).toBeUndefined();
  });

  it("rejects when the source IP is not on the whitelist", () => {
    globalConfiguration.config.whiteListPanelIp = true;
    globalConfiguration.config.whiteListPanelIps = ["10.0.0.1"];
    expect(packetsFor(invoke("auth", "test-key").socket, "auth")[0].data).toBe(false);
  });
});

describe("top-level auth gate", () => {
  it("silently drops a non-public event when not logged in -> status 500 on ctx.event", () => {
    const { socket } = dispatch("info/overview", null, { session: {} });
    const pkts = packetsFor(socket, "info/overview");
    expect(pkts).toHaveLength(1);
    expect(pkts[0].status).toBe(500);
    expect(pkts[0].data).toBe(IGNORE);
  });
});

describe("connection auth-timeout", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("disconnects an unauthenticated socket after AUTH_TIMEOUT (6s)", async () => {
    const { socket, session } = invoke("connection", null, { session: {} });
    expect(session.login).toBeFalsy();
    expect(socket.disconnect).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(6000);
    expect(socket.disconnect).toHaveBeenCalled();
  });

  it("does not disconnect a socket that authenticated before the timer fires", async () => {
    const { socket } = invoke("connection", null, {
      session: { login: true, key: "test-key", type: "TOP_LEVEL", id: "s1" }
    });
    await vi.advanceTimersByTimeAsync(6000);
    expect(socket.disconnect).not.toHaveBeenCalled();
  });
});
