import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { fakeSocket, packetsFor } from "../../test/harness/router";

// --- Inline mocks for deps instance_event_router reads at load time ---

// noOp logger (protocol.msg/responseError route warnings through `../service/log`).
vi.mock("../service/log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// fs-extra: the 500ms log flush writes per-instance .log files; stub all calls
// so no disk I/O happens and the writeFile callback still fires to clear buffer.
vi.mock("fs-extra", () => {
  const mod: any = {
    existsSync: vi.fn(() => false),
    mkdirsSync: vi.fn(),
    statSync: vi.fn(() => ({ size: 0 })),
    writeFile: vi.fn((_p: string, _d: any, _o: any, cb: any) => {
      if (typeof cb === "function") cb();
    }),
    removeSync: vi.fn()
  };
  return { ...mod, default: mod };
});

// InstanceSubsystem: the router subscribes to its events (data/exit/open/failure)
// at load time and calls forEachForward to relay packets. Make it a lightweight
// in-process emitter whose forEachForward fans out to sockets we register.
vi.mock("../service/system_instance", () => {
  const handlers: Record<string, Array<(a: any, b?: any) => void>> = {};
  const forwardSockets = new Map<string, any[]>();
  const instance = {
    LOG_DIR: "/tmp/inst-logs",
    on(event: string, fn: (a: any, b?: any) => void) {
      (handlers[event] ||= []).push(fn);
      return instance;
    },
    emit(event: string, ...args: any[]) {
      (handlers[event] || []).forEach((fn) => fn(...args));
      return true;
    },
    forEachForward(uuid: string, cb: (s: any) => void) {
      const socks = forwardSockets.get(uuid);
      if (socks) socks.forEach((s) => cb(s));
    },
    __forwardSockets: forwardSockets
  };
  return { default: instance };
});

let InstanceSubsystem: any;

// Enable fake timers BEFORE importing the router: its top-level setInterval
// (500ms log flush) must be scheduled under the fake clock so we can advance it.
beforeAll(async () => {
  vi.useFakeTimers();
  await import("./instance_event_router");
  InstanceSubsystem = (await import("../service/system_instance")).default;
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  vi.clearAllMocks();
  InstanceSubsystem.__forwardSockets.clear();
});

function registerForward(uuid: string) {
  const sock = fakeSocket();
  const socks = InstanceSubsystem.__forwardSockets;
  if (!socks.has(uuid)) socks.set(uuid, []);
  socks.get(uuid).push(sock);
  return sock;
}

describe("instance_event_router relay", () => {
  it("data -> instance/stdout forwarded to the subscribed socket", () => {
    const sock = registerForward("i1");
    InstanceSubsystem.emit("data", "i1", "hello");
    const pkt = packetsFor(sock, "instance/stdout")[0];
    expect(pkt).toBeDefined();
    expect(pkt.status).toBe(200);
    expect(pkt.data).toEqual({ instanceUuid: "i1", text: "hello" });
  });

  it("data -> no packet when no socket is subscribed", () => {
    const sock = fakeSocket();
    InstanceSubsystem.emit("data", "nope", "x");
    expect(packetsFor(sock, "instance/stdout")).toHaveLength(0);
  });

  it("exit -> instance/stopped", () => {
    const sock = registerForward("i1");
    InstanceSubsystem.emit("exit", { instanceUuid: "i1", instanceName: "inst-1" });
    const pkt = packetsFor(sock, "instance/stopped")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toEqual({ instanceUuid: "i1", instanceName: "inst-1" });
  });

  it("open -> instance/opened", () => {
    const sock = registerForward("i1");
    InstanceSubsystem.emit("open", { instanceUuid: "i1", instanceName: "inst-1" });
    const pkt = packetsFor(sock, "instance/opened")[0];
    expect(pkt.data).toEqual({ instanceUuid: "i1", instanceName: "inst-1" });
  });

  it("failure -> instance/failure", () => {
    const sock = registerForward("i1");
    InstanceSubsystem.emit("failure", { instanceUuid: "i1", instanceName: "inst-1" });
    const pkt = packetsFor(sock, "instance/failure")[0];
    expect(pkt.data).toEqual({ instanceUuid: "i1", instanceName: "inst-1" });
  });

  it("forwards to every socket subscribed to the same instance uuid", () => {
    const s1 = registerForward("i1");
    const s2 = registerForward("i1");
    InstanceSubsystem.emit("data", "i1", "hi");
    expect(packetsFor(s1, "instance/stdout")).toHaveLength(1);
    expect(packetsFor(s2, "instance/stdout")).toHaveLength(1);
  });

  it("does not forward to sockets subscribed to a different instance", () => {
    const s1 = registerForward("i1");
    const s2 = registerForward("i2");
    InstanceSubsystem.emit("data", "i1", "hello");
    expect(packetsFor(s1, "instance/stdout")).toHaveLength(1);
    expect(packetsFor(s2, "instance/stdout")).toHaveLength(0);
  });
});

describe("instance_event_router log flush", () => {
  it("writes buffered stdout to <LOG_DIR>/<uuid>.log every 500ms", async () => {
    const fs = (await import("fs-extra")) as any;
    InstanceSubsystem.emit("data", "log-uuid", "log-text");
    await vi.advanceTimersByTimeAsync(500);
    expect(fs.mkdirsSync).toHaveBeenCalledWith("/tmp/inst-logs");
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("log-uuid.log"),
      "log-text",
      expect.objectContaining({ encoding: "utf-8", flag: "a" }),
      expect.any(Function)
    );
  });
});
