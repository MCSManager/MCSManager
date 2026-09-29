import { beforeEach, describe, expect, it, vi } from "vitest";

import { globalConfiguration } from "../entity/config";
import { invoke, packetsFor, flush } from "../../test/harness/router";

// --- Inline mocks for everything schedule_router pulls in at load time ---

// noOp logger (auth_router reads `../service/log`).
vi.mock("../service/log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// InstanceControlSubsystem: every schedule event delegates here. The router has
// NO `routerApp.use` instance-existence middleware; it only forwards to this
// service. Mock the default export with the methods the router calls
// (registerScheduleJob / listScheduleJob / deleteScheduleTask) so no real
// node-schedule / StorageSubsystem / FileManager chain runs.
vi.mock("../service/system_instance_control", () => ({
  default: {
    registerScheduleJob: vi.fn(() => undefined),
    listScheduleJob: vi.fn(() => []),
    deleteScheduleTask: vi.fn(() => undefined)
  }
}));

// Defensive: the real `system_instance_control` imports `node-schedule`; the mock
// above already short-circuits that chain, but mock the package too so the
// boundary is consistently sealed in case any future transitive import reaches
// it. Per the harness guidance, return a Job stub with a `cancel` method.
vi.mock("node-schedule", () => ({
  scheduleJob: vi.fn(() => ({ cancel: vi.fn() })),
  cancelJob: vi.fn()
}));

// Register the top-level auth gate (auth_router) + schedule handlers on the singleton.
import "./auth_router";
import "./schedule_router";
import InstanceControlSubsystem from "../service/system_instance_control";

beforeEach(() => {
  globalConfiguration.config.key = "test-key";
  vi.clearAllMocks();
  // Restore default mock implementations that individual tests may override.
  (InstanceControlSubsystem as any).registerScheduleJob.mockImplementation(
    () => undefined
  );
  (InstanceControlSubsystem as any).listScheduleJob.mockImplementation(() => []);
  (InstanceControlSubsystem as any).deleteScheduleTask.mockImplementation(
    () => undefined
  );
});

const AUTHED = (id = "sx") => ({
  key: "test-key",
  login: true,
  id,
  type: "TOP_LEVEL",
  stream: {}
});

describe("schedule_router", () => {
  // ---- schedule/register ----
  it("schedule/register: forwards data to InstanceControlSubsystem.registerScheduleJob -> {200, true}", async () => {
    const data = {
      instanceUuid: "i1",
      name: "task1",
      count: 1,
      time: "*/5 * * * *",
      actions: [{ type: "command", payload: "say hi" }],
      type: 3
    };
    const { socket } = invoke("schedule/register", data, { session: AUTHED() });
    await flush();
    expect(InstanceControlSubsystem.registerScheduleJob).toHaveBeenCalledTimes(1);
    expect(InstanceControlSubsystem.registerScheduleJob).toHaveBeenCalledWith(data);
    const pkt = packetsFor(socket, "schedule/register")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  it("schedule/register: registerScheduleJob throws -> {500} with error string", async () => {
    (InstanceControlSubsystem as any).registerScheduleJob.mockImplementation(() => {
      throw new Error("TXT_CODE_system_instance_control.existRepeatTask");
    });
    const { socket } = invoke(
      "schedule/register",
      { instanceUuid: "i1", name: "dup" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "schedule/register")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("existRepeatTask");
  });

  // ---- schedule/list ----
  it("schedule/list: returns listScheduleJob(instanceUuid) -> {200, array}", async () => {
    const tasks = [
      {
        instanceUuid: "i1",
        name: "task1",
        count: 1,
        time: "*/5 * * * *",
        type: 3
      }
    ];
    (InstanceControlSubsystem as any).listScheduleJob.mockImplementation(() => tasks);
    const { socket } = invoke(
      "schedule/list",
      { instanceUuid: "i1" },
      { session: AUTHED() }
    );
    await flush();
    expect(InstanceControlSubsystem.listScheduleJob).toHaveBeenCalledWith("i1");
    const pkt = packetsFor(socket, "schedule/list")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(tasks);
  });

  // The router does NOT run its own instance-existence gate; it forwards whatever
  // uuid is sent. The subsystem returns [] for unknown uuids (no 500). This test
  // pins that contract so a future gate is not silently introduced.
  it("schedule/list: unknown instanceUuid -> {200, []} (no router-level gate)", async () => {
    (InstanceControlSubsystem as any).listScheduleJob.mockImplementation(() => []);
    const { socket } = invoke(
      "schedule/list",
      { instanceUuid: "does-not-exist" },
      { session: AUTHED() }
    );
    await flush();
    expect(InstanceControlSubsystem.listScheduleJob).toHaveBeenCalledWith("does-not-exist");
    const pkt = packetsFor(socket, "schedule/list")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toEqual([]);
  });

  // ---- schedule/delete ----
  it("schedule/delete: forwards (instanceUuid, name) to deleteScheduleTask -> {200, true}", async () => {
    const { socket } = invoke(
      "schedule/delete",
      { instanceUuid: "i1", name: "task1" },
      { session: AUTHED() }
    );
    await flush();
    expect(InstanceControlSubsystem.deleteScheduleTask).toHaveBeenCalledWith("i1", "task1");
    const pkt = packetsFor(socket, "schedule/delete")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  it("schedule/delete: deleteScheduleTask throws -> routerApp.emitRouter catches -> {500}", async () => {
    (InstanceControlSubsystem as any).deleteScheduleTask.mockImplementation(() => {
      throw new Error("task not found");
    });
    const { socket } = invoke(
      "schedule/delete",
      { instanceUuid: "i1", name: "missing" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "schedule/delete")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("task not found");
  });
});
