import { beforeEach, describe, expect, it, vi } from "vitest";

import { globalConfiguration } from "../entity/config";
import { dispatch, packetsFor, flush } from "../../test/harness/router";
import { fakeInstance, mockInstanceSystem, mockMissionPassport } from "../../test/harness/mocks";

// --- Inline mocks for the deps stream_router reads at load time ---

// noOp logger (auth_router + stream_router both read `../service/log`).
vi.mock("../service/log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// mission_passport provides missionPassport.getMission + streamLoginSuccessful.
// Seed a valid stream_channel mission under password "pw" pointing at instance "i1".
vi.mock("../service/mission_passport", () =>
  mockMissionPassport({
    pw: { name: "stream_channel", parameter: { instanceUuid: "i1" } }
  })
);

// system_instance provides getInstance / forward / stopForward used by stream_router.
vi.mock("../service/system_instance", () => {
  const inst = fakeInstance("i1", {
    process: { write: vi.fn() },
    execPreset: vi.fn(async () => undefined),
    watchers: new Map<string, any>(),
    startCount: 0,
    autoRestartCount: 0
  });
  const base = mockInstanceSystem([inst]);
  return {
    default: {
      ...base.default,
      forward: vi.fn(),
      stopForward: vi.fn()
    }
  };
});

// Register the top-level gate (auth_router) + stream handlers on the singleton routerApp.
import "./auth_router";
import "./stream_router";
import InstanceSubsystem from "../service/system_instance";
import { streamLoginSuccessful } from "../service/mission_passport";

const sub: any = InstanceSubsystem;
const getInstance = (uuid: string): any => sub.getInstance(uuid);

beforeEach(() => {
  globalConfiguration.config.key = "test-key";
  vi.clearAllMocks();
  // Reset the real Map on the shared fake instance (vi.clearAllMocks won't touch it).
  getInstance("i1").watchers.clear();
});

const AUTHED = (id = "sx") => ({
  key: "test-key",
  login: true,
  id,
  type: "TOP_LEVEL",
  stream: {}
});

const STREAM_AUTHED = (instanceUuid = "i1", id = "sx") => ({
  key: "test-key",
  login: true,
  id,
  type: "STREAM",
  stream: { check: true, instanceUuid }
});

describe("stream_router", () => {
  // ---- stream/auth (gate-exempt public route) ----
  describe("stream/auth", () => {
    it("valid missionPassport.getMission -> streamLoginSuccessful + ack {200, true}", async () => {
      const { socket, session } = dispatch(
        "stream/auth",
        { password: "pw" },
        { session: {} }
      );
      await flush();
      const pkt = packetsFor(socket, "stream/auth")[0];
      expect(pkt.status).toBe(200);
      expect(pkt.data).toBe(true);
      expect(streamLoginSuccessful).toHaveBeenCalledWith(expect.anything(), "i1");
      expect(session.type).toBe("STREAM");
      expect(session.stream).toMatchObject({ check: true, instanceUuid: "i1" });
      expect(sub.forward).toHaveBeenCalledWith("i1", socket);
      expect(socket.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
    });

    it("invalid mission -> rejected {500}, no streamLoginSuccessful", async () => {
      const { socket, session } = dispatch(
        "stream/auth",
        { password: "WRONG" },
        { session: {} }
      );
      await flush();
      const pkt = packetsFor(socket, "stream/auth")[0];
      expect(pkt.status).toBe(500);
      expect(streamLoginSuccessful).not.toHaveBeenCalled();
      expect(session.type).toBeUndefined();
    });
  });

  // ---- stream/detail (stream-authed) ----
  describe("stream/detail", () => {
    it("returns instance meta including watcher size", async () => {
      const { socket } = dispatch("stream/detail", null, {
        session: STREAM_AUTHED()
      });
      await flush();
      const pkt = packetsFor(socket, "stream/detail")[0];
      expect(pkt.status).toBe(200);
      expect(pkt.data.instanceUuid).toBe("i1");
      expect(pkt.data.status).toBe(0);
      expect(pkt.data.autoRestarted).toBe(0);
      expect(pkt.data.started).toBe(0);
      expect(pkt.data.watcher).toBe(0);
      expect(pkt.data).toHaveProperty("config");
      expect(pkt.data).toHaveProperty("info");
    });
  });

  // ---- stream/input -> execPreset("command", data.command) ----
  describe("stream/input", () => {
    it("forwards data.command to instance.execPreset('command', ...)", async () => {
      const inst = getInstance("i1");
      dispatch("stream/input", { command: "say hi" }, { session: STREAM_AUTHED() });
      await flush();
      expect(inst.execPreset).toHaveBeenCalledWith("command", "say hi");
    });
  });

  // ---- stream/write -> instance.process.write(data.input) ----
  describe("stream/write", () => {
    it("forwards data.input to instance.process.write", async () => {
      const inst = getInstance("i1");
      dispatch("stream/write", { input: "hello" }, { session: STREAM_AUTHED() });
      await flush();
      expect(inst.process.write).toHaveBeenCalledWith("hello");
    });
  });

  // ---- stream/resize -> terminal size set + execPreset("resize") ----
  describe("stream/resize", () => {
    it("records terminal size on watchers and calls execPreset('resize')", async () => {
      const inst = getInstance("i1");
      const { socket } = dispatch(
        "stream/resize",
        { w: 80, h: 24 },
        { session: STREAM_AUTHED() }
      );
      await flush();
      expect(inst.watchers.get(socket.id)).toEqual({
        terminalSize: { w: 80, h: 24 }
      });
      expect(inst.execPreset).toHaveBeenCalledWith("resize");
    });

    it("coerces non-numeric w/h to 0", async () => {
      const inst = getInstance("i1");
      const { socket } = dispatch(
        "stream/resize",
        { w: "wide", h: null },
        { session: STREAM_AUTHED() }
      );
      await flush();
      expect(inst.watchers.get(socket.id)).toEqual({
        terminalSize: { w: 0, h: 0 }
      });
    });
  });

  // ---- stream gate: a stream/* (non stream/auth) request WITHOUT stream.check ----
  describe("stream gate (dispatch mode)", () => {
    it("rejects stream/write with a TOP_LEVEL-only session -> {500}, no process.write", async () => {
      const inst = getInstance("i1");
      const { socket } = dispatch(
        "stream/write",
        { input: "x" },
        { session: AUTHED() }
      );
      await flush();
      const pkt = packetsFor(socket, "stream/write")[0];
      expect(pkt.status).toBe(500);
      expect(inst.process.write).not.toHaveBeenCalled();
      expect(sub.forward).not.toHaveBeenCalled();
    });

    it("rejects stream/detail with a TOP_LEVEL-only session -> {500}", async () => {
      const { socket } = dispatch(
        "stream/detail",
        null,
        { session: AUTHED() }
      );
      await flush();
      const pkt = packetsFor(socket, "stream/detail")[0];
      expect(pkt.status).toBe(500);
    });
  });
});
