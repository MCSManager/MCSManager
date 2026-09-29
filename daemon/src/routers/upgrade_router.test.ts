import { beforeEach, describe, expect, it, vi } from "vitest";

import { globalConfiguration } from "../entity/config";
import { dispatch, invoke, packetsFor, flush } from "../../test/harness/router";

// --- Inline mocks for deps upgrade_router reads at load time ---

// noOp logger (protocol.responseError logs through `../service/log`).
vi.mock("../service/log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// upgrade_service: the heavy overlay/download layer; stub both entry points so
// the router loads without pulling mcsmanager-common/applyUpgradePackage.
vi.mock("../service/upgrade_service", () => ({
  getUpgradeInfo: vi.fn(async () => ({
    configured: true,
    currentVersion: "1.0.0",
    onlineVersion: "2.0.0",
    onlineNotes: { en_us: "notes-en", zh_cn: "notes-zh" },
    updateAvailable: true,
    updateSourceUrl: "http://x"
  })),
  performUpgrade: vi.fn(async () => ({ started: true, onlineVersion: "2.0.0" }))
}));

// Register the top-level gate (auth_router) + upgrade handlers on the singleton.
import "./auth_router";
import "./upgrade_router";
import { getUpgradeInfo, performUpgrade } from "../service/upgrade_service";

beforeEach(() => {
  globalConfiguration.config.key = "test-key";
  vi.clearAllMocks();
});

const AUTHED = (id = "sx") => ({
  key: "test-key",
  login: true,
  id,
  type: "TOP_LEVEL",
  stream: {}
});

describe("upgrade/info", () => {
  it("returns manifest info with onlineNotes passthrough -> 200", async () => {
    const data = { updateSourceUrl: "http://manifest" };
    const { socket } = invoke("upgrade/info", data, { session: AUTHED() });
    await flush();
    expect(getUpgradeInfo).toHaveBeenCalledWith(data);
    const pkt = packetsFor(socket, "upgrade/info")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.currentVersion).toBe("1.0.0");
    expect(pkt.data.onlineVersion).toBe("2.0.0");
    expect(pkt.data.onlineNotes).toEqual({ en_us: "notes-en", zh_cn: "notes-zh" });
    expect(pkt.data.updateAvailable).toBe(true);
    expect(pkt.data.updateSourceUrl).toBe("http://x");
  });

  it("surfaces a service error as responseError -> 500", async () => {
    vi.mocked(getUpgradeInfo).mockRejectedValueOnce(new Error("boom"));
    const { socket } = invoke("upgrade/info", {}, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "upgrade/info")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("boom");
  });
});

describe("upgrade/daemon", () => {
  it("performs upgrade (mocked, no real overlay) -> 200 result", async () => {
    const data = { updateSourceUrl: "http://manifest" };
    const { socket } = invoke("upgrade/daemon", data, { session: AUTHED() });
    await flush();
    expect(performUpgrade).toHaveBeenCalledWith(data);
    const pkt = packetsFor(socket, "upgrade/daemon")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toEqual({ started: true, onlineVersion: "2.0.0" });
  });

  it("surfaces a performUpgrade failure as 500", async () => {
    vi.mocked(performUpgrade).mockRejectedValueOnce(new Error("overlay-failed"));
    const { socket } = invoke("upgrade/daemon", {}, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "upgrade/daemon")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("overlay-failed");
  });
});

describe("upgrade auth gate", () => {
  it("blocks upgrade/info without login -> 500 and does not call getUpgradeInfo", async () => {
    const { socket } = dispatch("upgrade/info", null, { session: {} });
    await flush();
    const pkt = packetsFor(socket, "upgrade/info")[0];
    expect(pkt.status).toBe(500);
    expect(getUpgradeInfo).not.toHaveBeenCalled();
  });

  it("blocks upgrade/daemon without login -> 500 and does not call performUpgrade", async () => {
    const { socket } = dispatch("upgrade/daemon", null, { session: {} });
    await flush();
    const pkt = packetsFor(socket, "upgrade/daemon")[0];
    expect(pkt.status).toBe(500);
    expect(performUpgrade).not.toHaveBeenCalled();
  });
});
