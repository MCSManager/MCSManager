import os from "os";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { globalConfiguration, globalEnv } from "../entity/config";
import { dispatch, packetsFor, flush } from "../../test/harness/router";
import { fakeInstance, mockInstanceSystem } from "../../test/harness/mocks";

// --- Inline mocks for everything file_router pulls in at load time ---

// noOp logger (auth_router + file_router both read `../service/log`; file_router
// also calls logger.error in the download_from_url async catch branch).
vi.mock("../service/log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// The file_router gate reads Instance.STATUS_BUSY / Instance.STATUS_STARTING and
// the GLOBAL_INSTANCE_UUID_KEY constant for file/status. Avoid the heavy real
// class chain (dispatcher / docker_stats) by stubbing a minimal class shape.
vi.mock("../entity/instance/instance", () => ({
  default: class Instance {
    static readonly STATUS_BUSY = -1;
    static readonly STATUS_STOP = 0;
    static readonly STATUS_STOPPING = 1;
    static readonly STATUS_STARTING = 2;
    static readonly STATUS_RUNNING = 3;
  },
  GLOBAL_INSTANCE_UUID_KEY: "global0001"
}));

// FileManager: the router only ever touches the instance returned by
// getFileManager. Mock the service so getFileManager returns a fully-controlled
// stub whose methods are vi.fn spies — NO real fs / spawn / /bin/chmod runs.
vi.mock("../service/file_router_service", () => {
  const fileManagerStub = {
    cwd: ".",
    // Mirror the real FileManager.cd escape check: any target climbing out of
    // the workspace throws "illegal access" before list() is reached. This is
    // what Review-focus #5 asserts through the router's try/catch.
    cd: vi.fn((target?: string) => {
      if (typeof target === "string" && target && target.includes("..")) {
        throw new Error("TXT_CODE_system_file.illegalAccess");
      }
      if (typeof target === "string") fileManagerStub.cwd = target;
    }),
    list: vi.fn(async () => ({
      items: [],
      page: 0,
      pageSize: 40,
      total: 0,
      absolutePath: "/tmp/inst-i1"
    })),
    chmod: vi.fn(async () => undefined),
    readFile: vi.fn(async () => ""),
    writeFile: vi.fn(async () => undefined),
    edit: vi.fn(async () => true),
    copy: vi.fn(async () => undefined),
    move: vi.fn(async () => undefined),
    delete: vi.fn(async () => true),
    mkdir: vi.fn(() => undefined),
    newFile: vi.fn(async () => undefined),
    check: vi.fn(() => true),
    toAbsolutePath: vi.fn((p: string = "") => `/tmp/inst-i1/${p}`),
    checkPath: vi.fn(() => true),
    assertInsideWorkspace: vi.fn(),
    zip: vi.fn(async () => undefined),
    unzip: vi.fn(async () => undefined)
  };
  return {
    getFileManager: vi.fn(() => fileManagerStub),
    getWindowsDisks: vi.fn(() => [])
  };
});

// Defensive: file_router_service imports the real FileManager, but since it is
// mocked above this never loads. Still stub it so no transitive import can hit fs.
vi.mock("../service/system_file", () => ({ default: class FileManager {} }));

// download_manager: file/status reads .tasks + .downloadingCount; the
// download_from_url handler calls .downloadFromUrl; download_from_url_stop calls
// .stopById / .stop; delete searches .tasks. Keep tasks an array so .find works.
vi.mock("../service/download_manager", () => ({
  default: {
    tasks: [] as any[],
    downloadingCount: 0,
    downloadFromUrl: vi.fn(async () => undefined),
    stop: vi.fn(() => true),
    stopById: vi.fn(() => true)
  }
}));

// upload_manager: file/delete probes getByPath; default to "no upload in flight"
// so the handler falls through to fileManager.delete.
vi.mock("../service/upload_manager", () => ({
  default: { getByPath: vi.fn(() => undefined) }
}));

// checkSafeUrl: file/download_from_url awaits it; mock to pass so the handler
// reaches downloadManager.downloadFromUrl (asserting the call args).
vi.mock("../utils/url", () => ({ checkSafeUrl: vi.fn(async () => true) }));

// system_instance: the file_router instance-existence gate + file/status +
// file/compress all call getInstance. Seed a single stopped fake instance.
vi.mock("../service/system_instance", () => {
  const inst = fakeInstance("i1", {
    info: { fileLock: 0 },
    status: vi.fn(() => 0) // Instance.STATUS_STOP — gate's busy/starting check passes
  });
  const base = mockInstanceSystem([inst]);
  return { default: { ...base.default } };
});

// Register the top-level auth gate (auth_router) + file handlers on the singleton.
import "./auth_router";
import "./file_router";
import { getFileManager } from "../service/file_router_service";
import downloadManager from "../service/download_manager";
import { checkSafeUrl } from "../utils/url";
import InstanceSubsystem from "../service/system_instance";

// Stable stub reference — the mocked getFileManager returns the same object on
// every call. Captured once at module load; clearAllMocks only clears call data,
// not the implementation, so this reference stays valid across tests.
const fm: any = (getFileManager as any)();
const getInstance = (uuid: string): any =>
  (InstanceSubsystem as any).getInstance(uuid);

beforeEach(() => {
  globalConfiguration.config.key = "test-key";
  globalConfiguration.config.maxFileTask = 4;
  globalConfiguration.config.maxDownloadFromUrlFileCount = 0;
  globalEnv.fileTaskCount = 0;
  vi.clearAllMocks();
  // Restore stub implementations that individual tests may override.
  fm.chmod.mockImplementation(async () => undefined);
  fm.cd.mockImplementation((target?: string) => {
    if (typeof target === "string" && target && target.includes("..")) {
      throw new Error("TXT_CODE_system_file.illegalAccess");
    }
    if (typeof target === "string") fm.cwd = target;
  });
  (downloadManager as any).tasks = [];
  (downloadManager as any).downloadingCount = 0;
  (downloadManager as any).downloadFromUrl.mockImplementation(async () => undefined);
  (downloadManager as any).stop.mockImplementation(() => true);
  (downloadManager as any).stopById.mockImplementation(() => true);
  (checkSafeUrl as any).mockImplementation(async () => true);
  // Reset the shared fake instance's mutable fileLock counter.
  const inst = getInstance("i1");
  if (inst) inst.info.fileLock = 0;
});

const AUTHED = (id = "sx") => ({
  key: "test-key",
  login: true,
  id,
  type: "TOP_LEVEL",
  stream: {}
});

describe("file_router", () => {
  // ---- file/list ----
  it("file/list: cd(target) + list(page,pageSize,fileName) -> {200, overview shape}", async () => {
    const data = { instanceUuid: "i1", page: 0, pageSize: 40, target: "sub", fileName: "" };
    const { socket } = dispatch("file/list", data, { session: AUTHED() });
    await flush();
    expect(fm.cd).toHaveBeenCalledWith("sub");
    expect(fm.list).toHaveBeenCalledWith(0, 40, "");
    const pkt = packetsFor(socket, "file/list")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toMatchObject({
      items: [],
      page: 0,
      pageSize: 40,
      total: 0
    });
  });

  // Review-focus #5: a path escaping the instance cwd workspace is rejected
  // before any filesystem read runs.
  it("file/list: target '../../../../etc' escapes -> {500} and list NOT called", async () => {
    const data = {
      instanceUuid: "i1",
      page: 0,
      pageSize: 40,
      target: "../../../../etc",
      fileName: ""
    };
    const { socket } = dispatch("file/list", data, { session: AUTHED() });
    await flush();
    expect(fm.cd).toHaveBeenCalledWith("../../../../etc");
    expect(fm.list).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/list")[0];
    expect(pkt.status).toBe(500);
  });

  // ---- file/touch ----
  it("file/touch: newFile(target) -> {200, true}", async () => {
    const { socket } = dispatch(
      "file/touch",
      { instanceUuid: "i1", target: "a.txt" },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.newFile).toHaveBeenCalledWith("a.txt");
    const pkt = packetsFor(socket, "file/touch")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  // ---- file/mkdir ----
  it("file/mkdir: mkdir(target) -> {200, true}", async () => {
    const { socket } = dispatch(
      "file/mkdir",
      { instanceUuid: "i1", target: "newdir" },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.mkdir).toHaveBeenCalledWith("newdir");
    const pkt = packetsFor(socket, "file/mkdir")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  // ---- file/copy ----
  it("file/copy: forwards each [src,dst] pair to fileManager.copy -> {200, true}", async () => {
    const { socket } = dispatch(
      "file/copy",
      { instanceUuid: "i1", targets: [["a.txt", "b.txt"], ["c.txt", "d.txt"]] },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.copy).toHaveBeenCalledWith("a.txt", "b.txt");
    expect(fm.copy).toHaveBeenCalledWith("c.txt", "d.txt");
    expect(fm.copy).toHaveBeenCalledTimes(2);
    const pkt = packetsFor(socket, "file/copy")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  // ---- file/move ----
  it("file/move: forwards each [src,dst] pair to fileManager.move -> {200, true}", async () => {
    const { socket } = dispatch(
      "file/move",
      { instanceUuid: "i1", targets: [["x.txt", "y.txt"]] },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.move).toHaveBeenCalledWith("x.txt", "y.txt");
    const pkt = packetsFor(socket, "file/move")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  // ---- file/delete ----
  it("file/delete: no upload/download in flight -> fileManager.delete(target, {ignoreMissing:true}) per target -> {200, true}", async () => {
    const { socket } = dispatch(
      "file/delete",
      { instanceUuid: "i1", targets: ["old.txt", "gone.log"] },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.delete).toHaveBeenCalledWith("old.txt", { ignoreMissing: true });
    expect(fm.delete).toHaveBeenCalledWith("gone.log", { ignoreMissing: true });
    expect(fm.delete).toHaveBeenCalledTimes(2);
    const pkt = packetsFor(socket, "file/delete")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  // ---- file/edit ----
  it("file/edit: edit(target, text) -> {200, true}", async () => {
    const { socket } = dispatch(
      "file/edit",
      { instanceUuid: "i1", target: "f.txt", text: "hello" },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.edit).toHaveBeenCalledWith("f.txt", "hello");
    const pkt = packetsFor(socket, "file/edit")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  // ---- file/chmod ----
  it("file/chmod: chmod(target, mode, deep) -> {200, true}", async () => {
    const { socket } = dispatch(
      "file/chmod",
      { instanceUuid: "i1", chmod: 755, target: "script.sh", deep: true },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.chmod).toHaveBeenCalledWith("script.sh", 755, true);
    const pkt = packetsFor(socket, "file/chmod")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  // ---- file/chmod_batch ----
  it("file/chmod_batch: all targets succeed -> {success:N, failed:0, total:N} with per-target results", async () => {
    const { socket } = dispatch(
      "file/chmod_batch",
      { instanceUuid: "i1", chmod: 644, targets: ["a.txt", "b.txt"], deep: false },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.chmod).toHaveBeenCalledWith("a.txt", 644, false);
    expect(fm.chmod).toHaveBeenCalledWith("b.txt", 644, false);
    const pkt = packetsFor(socket, "file/chmod_batch")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.success).toBe(2);
    expect(pkt.data.failed).toBe(0);
    expect(pkt.data.total).toBe(2);
    expect(pkt.data.results).toEqual([
      { target: "a.txt", success: true },
      { target: "b.txt", success: true }
    ]);
  });

  it("file/chmod_batch: a failing target is caught and aggregated into failed", async () => {
    fm.chmod.mockImplementation(async (target: string) => {
      if (target === "bad.txt") throw new Error("boom");
    });
    const { socket } = dispatch(
      "file/chmod_batch",
      { instanceUuid: "i1", chmod: 644, targets: ["good.txt", "bad.txt"], deep: true },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.chmod).toHaveBeenCalledWith("good.txt", 644, true);
    expect(fm.chmod).toHaveBeenCalledWith("bad.txt", 644, true);
    const pkt = packetsFor(socket, "file/chmod_batch")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.success).toBe(1);
    expect(pkt.data.failed).toBe(1);
    expect(pkt.data.total).toBe(2);
    expect(pkt.data.results[0]).toEqual({ target: "good.txt", success: true });
    expect(pkt.data.results[1]).toMatchObject({ target: "bad.txt", success: false });
    expect(pkt.data.results[1].error).toBe("boom");
  });

  // ---- file/download_from_url ----
  it("file/download_from_url: checkSafeUrl + checkPath + toAbsolutePath + downloadFromUrl -> {200, {}}", async () => {
    const { socket } = dispatch(
      "file/download_from_url",
      {
        instanceUuid: "i1",
        url: "https://example.com/file.zip",
        fileName: "dl.zip",
        fallbackUrl: "https://example.com/fallback.zip"
      },
      { session: AUTHED() }
    );
    await flush();
    expect(checkSafeUrl).toHaveBeenCalledWith("https://example.com/file.zip");
    expect(fm.checkPath).toHaveBeenCalledWith("dl.zip");
    expect(fm.toAbsolutePath).toHaveBeenCalledWith("dl.zip");
    expect(downloadManager.downloadFromUrl).toHaveBeenCalledWith(
      "https://example.com/file.zip",
      "/tmp/inst-i1/dl.zip",
      "https://example.com/fallback.zip"
    );
    const pkt = packetsFor(socket, "file/download_from_url")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toEqual({});
  });

  // ---- file/download_from_url_stop ----
  it("file/download_from_url_stop: with taskId -> downloadManager.stopById(taskId) -> {200, true}", async () => {
    const { socket } = dispatch(
      "file/download_from_url_stop",
      { instanceUuid: "i1", taskId: "task-1" },
      { session: AUTHED() }
    );
    await flush();
    expect(downloadManager.stopById).toHaveBeenCalledWith("task-1");
    expect(downloadManager.stop).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/download_from_url_stop")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  it("file/download_from_url_stop: with fileName (no taskId) -> checkPath + toAbsolutePath + stop(path)", async () => {
    const { socket } = dispatch(
      "file/download_from_url_stop",
      { instanceUuid: "i1", fileName: "dl.zip" },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.checkPath).toHaveBeenCalledWith("dl.zip");
    expect(fm.toAbsolutePath).toHaveBeenCalledWith("dl.zip");
    expect(downloadManager.stop).toHaveBeenCalledWith("/tmp/inst-i1/dl.zip");
    expect(downloadManager.stopById).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/download_from_url_stop")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  // ---- file/status ----
  it("file/status: returns the file-management status shape -> {200, {...}}", async () => {
    const { socket } = dispatch(
      "file/status",
      { instanceUuid: "i1" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "file/status")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.instanceFileTask).toBe(0);
    expect(pkt.data.globalFileTask).toBe(0);
    expect(pkt.data.downloadFileFromURLTask).toBe(0);
    expect(pkt.data.downloadTasks).toEqual([]);
    expect(pkt.data.platform).toBe(os.platform());
    expect(pkt.data.isGlobalInstance).toBe(false);
    expect(pkt.data.disks).toEqual([]);
  });

  // ---- file/compress ----
  it("file/compress: type=1 -> fileManager.zip(source, targets, code) -> {200, true}; instance fileLock balanced back", async () => {
    const inst = getInstance("i1");
    const before = inst.info.fileLock;
    const { socket } = dispatch(
      "file/compress",
      {
        instanceUuid: "i1",
        source: "out.zip",
        targets: ["a.txt", "b.txt"],
        type: 1,
        code: "utf-8"
      },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.zip).toHaveBeenCalledWith("out.zip", ["a.txt", "b.txt"], "utf-8");
    expect(fm.unzip).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/compress")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
    // fileTaskStart/fileTaskEnd finally must balance the counter back to `before`.
    expect(inst.info.fileLock).toBe(before);
  });

  it("file/compress: type=0 -> fileManager.unzip(source, targets, code) -> {200, true}", async () => {
    const { socket } = dispatch(
      "file/compress",
      { instanceUuid: "i1", source: "in.zip", targets: ["out/"], type: 0, code: "gbk" },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.unzip).toHaveBeenCalledWith("in.zip", ["out/"], "gbk");
    expect(fm.zip).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/compress")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
  });

  // ---- instance-existence gate (dispatch / gate mode) ----
  it("gate: file/list with an unknown instanceUuid -> {500} before getFileManager is touched", async () => {
    const { socket } = dispatch(
      "file/list",
      { instanceUuid: "does-not-exist", page: 0, pageSize: 40, target: "", fileName: "" },
      { session: AUTHED() }
    );
    await flush();
    expect(getFileManager).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/list")[0];
    expect(pkt.status).toBe(500);
    expect(pkt.data.instanceUuid).toBe("does-not-exist");
  });
});
