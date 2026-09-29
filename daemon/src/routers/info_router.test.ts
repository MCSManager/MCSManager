import { beforeEach, describe, expect, it, vi } from "vitest";

import { globalConfiguration } from "../entity/config";
import { dispatch, packetsFor, flush } from "../../test/harness/router";
import { fakeInstance, mockInstanceSystem } from "../../test/harness/mocks";

// Stubs for the heavy deps info_router reads at the boundary.
vi.mock("../service/system_instance", () =>
  mockInstanceSystem([
    fakeInstance("running-1", { status: vi.fn(() => 3) }), // Instance.STATUS_RUNNING === 3
    fakeInstance("stopped-1", { status: vi.fn(() => 0) }),
    fakeInstance("stopped-2", { status: vi.fn(() => 0) })
  ])
);
vi.mock("../service/docker_service", () => ({
  DockerManager: class {
    async getSupportedPlatforms() {
      return ["linux/amd64"];
    }
  },
  // docker_stats.ts static-inits `new DefaultDocker()` at module load via the
  // Instance -> dispatcher -> task import chain, so the mock must export it too.
  DefaultDocker: class {}
}));
vi.mock("../service/system_visual_data", () => ({
  default: { getSystemChartArray: () => [], addRequestCount: () => {} }
}));
vi.mock("../service/version", () => ({ getVersion: () => "4.18.3" }));
vi.mock("../service/log", () => {
  const f = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// Register the gate (auth_router) + info handlers on the singleton routerApp.
import "./auth_router";
import "./info_router";

let storeSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  globalConfiguration.config.key = "test-key";
  globalConfiguration.config.language = "en_us";
  globalConfiguration.config.uploadSpeedRate = 0;
  globalConfiguration.config.downloadSpeedRate = 0;
  globalConfiguration.config.maxDownloadFromUrlFileCount = 1;
  globalConfiguration.config.allocatablePortRange = [10010, 65500];
  globalConfiguration.config.portAssignInterval = 5;
  globalConfiguration.config.port = 24444;
  globalConfiguration.config.outputBufferSize = 256;
  globalConfiguration.config.enableSoftShutdown = true;
  globalConfiguration.config.softShutdownSkipDocker = true;
  globalConfiguration.config.softShutdownWaitSeconds = 30;
  storeSpy = vi.spyOn(globalConfiguration, "store").mockImplementation(() => undefined);
});

const AUTHED = (id = "s1") => ({
  key: "test-key",
  login: true,
  id,
  type: "TOP_LEVEL",
  stream: {}
});

describe("info/overview (authenticated)", () => {
  it("returns daemon overview with version, instance counts, and docker platforms", async () => {
    const { socket } = dispatch("info/overview", null, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "info/overview")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.version).toBe("4.18.3");
    expect(pkt.data.instance).toEqual({ running: 1, total: 3 });
    expect(pkt.data.dockerPlatforms).toEqual(["linux/amd64"]);
    expect(pkt.data.config.port).toBe(24444);
    expect(pkt.data).toHaveProperty("process");
    expect(pkt.data).toHaveProperty("system");
    expect(pkt.data).toHaveProperty("cpuMemChart");
  });

  it("degrades gracefully when docker platforms cannot be queried (dockerPlatforms undefined, still 200)", async () => {
    const { DockerManager } = await import("../service/docker_service");
    const spy = vi
      .spyOn(DockerManager.prototype, "getSupportedPlatforms")
      .mockRejectedValue(new Error("docker down"));
    const { socket } = dispatch("info/overview", null, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "info/overview")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.dockerPlatforms).toBeUndefined();
    spy.mockRestore();
  });
});

describe("info/setting (authenticated)", () => {
  it("persists validated config overrides and responds true", async () => {
    const { socket } = dispatch(
      "info/setting",
      { port: 25565, outputBufferSize: 512, enableSoftShutdown: false },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "info/setting")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
    expect(globalConfiguration.config.port).toBe(25565);
    expect(globalConfiguration.config.outputBufferSize).toBe(512);
    expect(globalConfiguration.config.enableSoftShutdown).toBe(false);
    expect(storeSpy).toHaveBeenCalled();
  });

  it("ignores an out-of-range port (keeps the previous value)", async () => {
    const before = globalConfiguration.config.port;
    const { socket } = dispatch("info/setting", { port: 70000 }, { session: AUTHED() });
    await flush();
    packetsFor(socket, "info/setting");
    expect(globalConfiguration.config.port).toBe(before);
    expect(storeSpy).toHaveBeenCalled();
  });
});
