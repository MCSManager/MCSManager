import { beforeEach, describe, expect, it, vi } from "vitest";

import { globalConfiguration } from "../../entity/config";
import { invoke, dispatch, packetsFor, flush } from "../../../test/harness/router";
import { fakeInstance, mockInstanceSystem } from "../../../test/harness/mocks";

// --- Inline mocks for everything Instance_router pulls in at load time ---

// noOp logger (auth_router + Instance_router both read `../service/log`). The
// factory must be self-contained: vi.mock is hoisted above top-level consts,
// so referencing an outer binding trips a TDZ ReferenceError.
vi.mock("../../service/log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// Instance -> dispatcher -> docker_stats statically news up DefaultDocker at
// module load. Even with Instance mocked below, keep the chain load-safe.
vi.mock("../../service/docker_service", () => ({
  DockerManager: class {},
  DefaultDocker: class {}
}));

// The real Instance class drags in the command dispatcher / docker_stats chain;
// the covered events only need the STATUS_* constants (used by `instance/delete`).
vi.mock("../../entity/instance/instance", () => ({
  default: class Instance {
    static readonly STATUS_BUSY = -1;
    static readonly STATUS_STOP = 0;
    static readonly STATUS_STOPPING = 1;
    static readonly STATUS_STARTING = 2;
    static readonly STATUS_RUNNING = 3;
  }
}));

// Heavy deps the router imports but the covered events never touch; stub them so
// the router module loads without pulling docker/async-download/mod chains.
vi.mock("../../entity/commands/process_info", () => ({ default: class ProcessInfoCommand {} }));
vi.mock("../../entity/instance/process_config", () => ({ ProcessConfig: class {} }));
vi.mock("../../service/async_task_service", () => ({
  TaskCenter: { getTask: vi.fn(), getTasks: vi.fn(() => []) }
}));
vi.mock("../../service/async_task_service/quick_install", () => ({
  createQuickInstallTask: vi.fn(),
  QuickInstallTask: { TYPE: "quick_install" }
}));
vi.mock("../../service/download_manager", () => ({ default: { tasks: [], downloadingCount: 0 } }));
vi.mock("../../service/mod_service", () => ({
  modService: {
    listMods: vi.fn(),
    toggleMod: vi.fn(),
    deleteMod: vi.fn(),
    installMod: vi.fn(),
    getModConfig: vi.fn()
  }
}));
vi.mock("../../service/system_file", () => ({ default: class FileManager {} }));
vi.mock("../../service/upload_manager", () => ({ default: { getUploads: () => new Map() } }));

vi.mock("../../service/system_instance", () => {
  const insts = [
    fakeInstance("i1", {
      config: { nickname: "inst-1", tag: ["a", "b"] },
      info: { mcPingOnline: false, currentPlayers: 0 },
      status: vi.fn(() => 3), // Instance.STATUS_RUNNING
      execPreset: vi.fn(async () => undefined),
      forceExec: vi.fn(async () => undefined),
      parameters: vi.fn((cfg: any) => cfg)
    }),
    fakeInstance("i2", {
      config: { nickname: "inst-2", tag: [] },
      info: {},
      status: vi.fn(() => 0), // Instance.STATUS_STOP
      execPreset: vi.fn(async () => undefined),
      forceExec: vi.fn(async () => undefined),
      parameters: vi.fn((cfg: any) => cfg)
    })
  ];
  const base = mockInstanceSystem(insts);
  return {
    default: {
      ...base.default,
      // instance/select handler probes InstanceSubsystem.isGlobalInstance(v).
      isGlobalInstance: vi.fn((v: any) => v.instanceUuid === "global0001"),
      // instance/forward handler calls InstanceSubsystem.forward / stopForward.
      forward: vi.fn(),
      stopForward: vi.fn(),
      // Real createInstance is SYNC and returns an Instance; the shared factory
      // marks it `async` (returns a Promise), which would make `instance/new`
      // read `.config.nickname` off a Promise and crash. Mirror the real sync
      // contract so the handler behaves as it does against the real subsystem.
      createInstance: vi.fn((cfg: any) => ({
        instanceUuid: "new-uuid",
        config: { nickname: "new-name", ...(cfg || {}) },
        startCount: 0,
        autoRestartCount: 0,
        status: vi.fn(() => 0),
        info: {}
      })),
      // instance/select uses queryWrapper.select(...) then queryWrapper.page(...)
      getQueryMapWrapper: vi.fn(() => ({
        select: (pred: (v: any) => boolean) => insts.filter(pred),
        page: (arr: any[], p: number, ps: number) => {
          const start = (p - 1) * ps;
          return {
            data: arr.slice(start, start + ps),
            page: p,
            pageSize: ps,
            maxPage: Math.max(1, Math.ceil(arr.length / ps))
          };
        }
      }))
    }
  };
});

// Register the auth gate + instance handlers on the singleton routerApp.
import "../auth_router";
import "../Instance_router";
import InstanceSubsystem from "../../service/system_instance";

const sub: any = InstanceSubsystem;
const getInstance = (uuid: string): any => sub.getInstance(uuid);

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

describe("Instance_router", () => {
  // ---- read handlers (invoke / handler mode) ----
  it("instance/select: returns paged overview with tags, sorted by status desc", async () => {
    const data = { page: 1, pageSize: 10, condition: { instanceName: "", tag: [] } };
    const { socket } = invoke("instance/select", data, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "instance/select")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.page).toBe(1);
    expect(pkt.data.pageSize).toBe(10);
    expect(pkt.data.maxPage).toBe(1);
    expect(pkt.data.allTags).toEqual(["a", "b"]);
    expect(pkt.data.data).toHaveLength(2);
    expect(pkt.data.data[0].instanceUuid).toBe("i1"); // status 3 sorts first
    expect(pkt.data.data[1].instanceUuid).toBe("i2");
    expect(pkt.data.data[0].status).toBe(3);
  });

  it("instance/overview: lists every instance in the subsystem", async () => {
    const { socket } = invoke("instance/overview", null, { session: AUTHED() });
    await flush();
    const pkt = packetsFor(socket, "instance/overview")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toHaveLength(2);
    expect(pkt.data.map((d: any) => d.instanceUuid)).toEqual(["i1", "i2"]);
    expect(pkt.data[0].status).toBe(3);
    expect(pkt.data[1].status).toBe(0);
  });

  it("instance/section: returns overview only for the requested uuids", async () => {
    const { socket } = invoke(
      "instance/section",
      { instanceUuids: ["i1"] },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "instance/section")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toHaveLength(1);
    expect(pkt.data[0].instanceUuid).toBe("i1");
  });

  it("instance/detail: returns the single-instance detail shape", async () => {
    const { socket } = invoke(
      "instance/detail",
      { instanceUuid: "i1" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "instance/detail")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.instanceUuid).toBe("i1");
    expect(pkt.data.status).toBe(3);
    expect(pkt.data.config.nickname).toBe("inst-1");
    expect(pkt.data.space).toBe(0);
    expect(pkt.data).toHaveProperty("processInfo");
  });

  // ---- execPreset delegating handlers (invoke / handler mode) ----
  it("instance/open: calls execPreset('start') and acks the uuid", async () => {
    const inst = getInstance("i1");
    const { socket } = invoke(
      "instance/open",
      { instanceUuids: ["i1"] },
      { session: AUTHED() }
    );
    await flush();
    expect(inst.execPreset).toHaveBeenCalledWith("start");
    const pkt = packetsFor(socket, "instance/open")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.instanceUuid).toBe("i1");
  });

  it("instance/stop: calls execPreset('stop')", async () => {
    const inst = getInstance("i1");
    invoke("instance/stop", { instanceUuids: ["i1"] }, { session: AUTHED() });
    await flush();
    expect(inst.execPreset).toHaveBeenCalledWith("stop");
  });

  it("instance/restart: calls execPreset('restart')", async () => {
    const inst = getInstance("i1");
    invoke("instance/restart", { instanceUuids: ["i1"] }, { session: AUTHED() });
    await flush();
    expect(inst.execPreset).toHaveBeenCalledWith("restart");
  });

  it("instance/kill: calls execPreset('kill')", async () => {
    const inst = getInstance("i1");
    invoke("instance/kill", { instanceUuids: ["i1"] }, { session: AUTHED() });
    await flush();
    expect(inst.execPreset).toHaveBeenCalledWith("kill");
  });

  it("instance/command: forwards data.command as the 2nd execPreset arg", async () => {
    const inst = getInstance("i1");
    const { socket } = invoke(
      "instance/command",
      { instanceUuid: "i1", command: "say hi" },
      { session: AUTHED() }
    );
    await flush();
    expect(inst.execPreset).toHaveBeenCalledWith("command", "say hi");
    const pkt = packetsFor(socket, "instance/command")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.instanceUuid).toBe("i1");
  });

  // ---- mutating handlers (invoke / handler mode) ----
  it("instance/new: calls createInstance and echoes the new instance uuid", async () => {
    const data = { nickname: "new-name", type: "universal" };
    const { socket } = invoke("instance/new", data, { session: AUTHED() });
    await flush();
    expect(sub.createInstance).toHaveBeenCalledWith(data);
    const pkt = packetsFor(socket, "instance/new")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.instanceUuid).toBe("new-uuid");
    expect(pkt.data.nickname).toBe("new-name");
  });

  it("instance/update: forwards config to instance.parameters", async () => {
    const inst = getInstance("i1");
    const { socket } = invoke(
      "instance/update",
      { instanceUuid: "i1", config: { nickname: "updated" } },
      { session: AUTHED() }
    );
    await flush();
    expect(inst.parameters).toHaveBeenCalledWith({ nickname: "updated" });
    const pkt = packetsFor(socket, "instance/update")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.instanceUuid).toBe("i1");
  });

  it("instance/delete: removes a stopped instance and acks", async () => {
    const { socket } = invoke(
      "instance/delete",
      { instanceUuids: ["i2"], deleteFile: false },
      { session: AUTHED() }
    );
    await flush();
    expect(sub.removeInstance).toHaveBeenCalledWith("i2", false);
    const pkt = packetsFor(socket, "instance/delete")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.instanceUuids).toEqual(["i2"]);
    expect(pkt.data.instances[0].nickname).toBe("inst-2");
  });

  it("instance/forward: forward:true calls InstanceSubsystem.forward(socket)", async () => {
    const { socket } = invoke(
      "instance/forward",
      { instanceUuid: "i1", forward: true },
      { session: AUTHED() }
    );
    await flush();
    expect(sub.forward).toHaveBeenCalledWith("i1", socket);
    expect(sub.stopForward).not.toHaveBeenCalled();
    expect(packetsFor(socket, "instance/forward")[0].status).toBe(200);
  });

  it("instance/forward: forward:false calls stopForward instead", async () => {
    const { socket } = invoke(
      "instance/forward",
      { instanceUuid: "i1", forward: false },
      { session: AUTHED() }
    );
    await flush();
    expect(sub.stopForward).toHaveBeenCalledWith("i1", socket);
    expect(sub.forward).not.toHaveBeenCalled();
  });

  // ---- instance-existence gate (dispatch / gate mode) ----
  it("gate: instance/detail with an unknown uuid is rejected with status 500", async () => {
    const { socket } = dispatch(
      "instance/detail",
      { instanceUuid: "does-not-exist" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "instance/detail")[0];
    expect(pkt.status).toBe(500);
    expect(pkt.data.instanceUuid).toBe("does-not-exist");
  });

  // ---- handler error branches (invoke / handler mode) ----
  it("instance/delete: a running instance (not STATUS_STOP) -> status 500", async () => {
    const { socket } = invoke(
      "instance/delete",
      { instanceUuids: ["i1"], deleteFile: false },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "instance/delete")[0];
    expect(pkt.status).toBe(500);
    expect(sub.removeInstance).not.toHaveBeenCalled();
  });

  it("instance/open: an unknown uuid in the batch -> status 500 error packet", async () => {
    const { socket } = invoke(
      "instance/open",
      { instanceUuids: ["nope"] },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "instance/open")[0];
    expect(pkt.status).toBe(500);
    expect(pkt.data.instanceUuid).toBe("nope");
  });
});
