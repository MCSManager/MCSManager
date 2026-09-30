import os from "os";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { globalConfiguration, globalEnv } from "../../entity/config";
import { dispatch, invoke, packetsFor, flush } from "../../../test/harness/router";
import { fakeInstance, mockInstanceSystem } from "../../../test/harness/mocks";

// --- Inline mocks for everything file_router pulls in at load time ---

// noOp logger (auth_router + file_router both read `../service/log`; file_router
// also calls logger.error in the download_from_url async catch branch).
vi.mock("../../service/log", () => {
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
vi.mock("../../entity/instance/instance", () => ({
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
// PER-INSTANCE stub whose methods are vi.fn() spies — NO real fs / spawn runs.
// Every stub mirrors the real FileManager sandbox contract: path-taking methods
// reject targets climbing out of the instance workspace ("illegalAccess"). This
// is what the escape tests assert through the router's try/catch.
vi.mock("../../service/file_router_service", () => {
  const rejectEscape = (p?: string) => {
    if (typeof p === "string" && p.includes("..")) {
      throw new Error("TXT_CODE_system_file.illegalAccess");
    }
  };
  const makeStub = (uuid: string) => {
    const defaults: Record<string, any> = {
      cd: (target?: string) => {
        rejectEscape(target);
        if (typeof target === "string") stub.cwd = target;
      },
      list: async () => ({
        items: [],
        page: 0,
        pageSize: 40,
        total: 0,
        absolutePath: `/tmp/inst-${uuid}`
      }),
      chmod: async (target?: string) => {
        rejectEscape(target);
      },
      readFile: async (target?: string) => {
        rejectEscape(target);
        return "";
      },
      writeFile: async (target?: string) => {
        rejectEscape(target);
      },
      edit: async (target?: string) => {
        rejectEscape(target);
        return true;
      },
      // copy() is fire-and-forget at the route (never awaited), so its result is
      // never observed here; the real sandbox rejection is covered by the direct
      // FileManager assertions in file_router.security.test.ts.
      copy: async () => undefined,
      move: async (t1?: string, t2?: string) => {
        rejectEscape(t1);
        rejectEscape(t2);
      },
      delete: async (target?: string) => {
        rejectEscape(target);
        return true;
      },
      mkdir: (target?: string) => {
        rejectEscape(target);
      },
      newFile: async (target?: string) => {
        rejectEscape(target);
      },
      check: () => true,
      toAbsolutePath: (p: string = "") => {
        rejectEscape(p);
        return `/tmp/inst-${uuid}/${p}`;
      },
      checkPath: (p?: string) => {
        rejectEscape(p);
        return true;
      },
      assertInsideWorkspace: (p?: string) => {
        rejectEscape(p);
      },
      zip: async (source?: string) => {
        rejectEscape(source);
      },
      unzip: async (source?: string) => {
        rejectEscape(source);
      }
    };
    const stub: any = { uuid, cwd: ".", _defaults: defaults };
    for (const [name, impl] of Object.entries(defaults)) stub[name] = vi.fn(impl);
    return stub;
  };
  const stubs = new Map<string, any>();
  return {
    getFileManager: vi.fn((uuid: string) => {
      if (!stubs.has(uuid)) stubs.set(uuid, makeStub(uuid));
      return stubs.get(uuid);
    }),
    getWindowsDisks: vi.fn(() => [])
  };
});

// Defensive: file_router_service imports the real FileManager, but since it is
// mocked above this never loads. Still stub it so no transitive import can hit fs.
vi.mock("../../service/system_file", () => ({ default: class FileManager {} }));

// download_manager: file/status reads .tasks + .downloadingCount; the
// download_from_url handler calls .downloadFromUrl; download_from_url_stop calls
// .stopById / .stop; delete searches .tasks. Keep tasks an array so .find works.
vi.mock("../../service/download_manager", () => ({
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
vi.mock("../../service/upload_manager", () => ({
  default: { getByPath: vi.fn(() => undefined) }
}));

// checkSafeUrl: file/download_from_url awaits it; mock to pass so the handler
// reaches downloadManager.downloadFromUrl (asserting the call args).
vi.mock("../../utils/url", () => ({ checkSafeUrl: vi.fn(async () => true) }));

// system_instance: the file_router instance-existence gate + file/status +
// file/compress all call getInstance. Seed two stopped fake instances so tests
// can prove requests bind to their own instance's FileManager (isolation).
vi.mock("../../service/system_instance", () => {
  const inst = fakeInstance("i1", {
    info: { fileLock: 0 },
    status: vi.fn(() => 0) // Instance.STATUS_STOP — gate's busy/starting check passes
  });
  const inst2 = fakeInstance("i2", {
    info: { fileLock: 0 },
    status: vi.fn(() => 0)
  });
  const base = mockInstanceSystem([inst, inst2]);
  return { default: { ...base.default } };
});

// Register the top-level auth gate (auth_router) + file handlers on the singleton.
import "../auth_router";
import "../file_router";
import { getFileManager } from "../../service/file_router_service";
import downloadManager from "../../service/download_manager";
import uploadManager from "../../service/upload_manager";
import { checkSafeUrl } from "../../utils/url";
import InstanceSubsystem from "../../service/system_instance";
import Instance from "../../entity/instance/instance";

// Stable per-instance stub references — the mocked getFileManager keeps one stub
// per uuid. Captured once at module load; clearAllMocks only clears call data,
// not the implementation, so these references stay valid across tests.
const fm: any = (getFileManager as any)("i1");
const fm2: any = (getFileManager as any)("i2");
const getInstance = (uuid: string): any => (InstanceSubsystem as any).getInstance(uuid);

// Re-install the default stub behavior (including the escape mirrors) so tests
// that override individual methods cannot leak into later tests.
const restoreStub = (s: any) => {
  for (const [name, impl] of Object.entries(s._defaults)) {
    s[name].mockImplementation(impl);
  }
  s.cwd = ".";
};

beforeEach(() => {
  globalConfiguration.config.key = "test-key";
  globalConfiguration.config.maxFileTask = 4;
  globalConfiguration.config.maxDownloadFromUrlFileCount = 0;
  globalEnv.fileTaskCount = 0;
  vi.clearAllMocks();
  // Restore stub implementations that individual tests may override.
  restoreStub(fm);
  restoreStub(fm2);
  (downloadManager as any).tasks = [];
  (downloadManager as any).downloadingCount = 0;
  (downloadManager as any).downloadFromUrl.mockImplementation(async () => undefined);
  (downloadManager as any).stop.mockImplementation(() => true);
  (downloadManager as any).stopById.mockImplementation(() => true);
  (uploadManager as any).getByPath.mockImplementation(() => undefined);
  (checkSafeUrl as any).mockImplementation(async () => true);
  // Reset the shared fake instances' mutable state (fileLock counter, status).
  for (const uuid of ["i1", "i2"]) {
    const inst = getInstance(uuid);
    if (inst) {
      inst.info.fileLock = 0;
      inst.status.mockImplementation(() => 0);
    }
  }
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
      {
        instanceUuid: "i1",
        targets: [
          ["a.txt", "b.txt"],
          ["c.txt", "d.txt"]
        ]
      },
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
    const { socket } = dispatch("file/status", { instanceUuid: "i1" }, { session: AUTHED() });
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
    expect(fm.unzip).toHaveBeenCalledWith("in.zip", ["out/"], "gbk", undefined);
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

  it("gate: file/touch with an unknown instanceUuid -> {500} before getFileManager is touched", async () => {
    const { socket } = dispatch(
      "file/touch",
      { instanceUuid: "does-not-exist", target: "a.txt" },
      { session: AUTHED() }
    );
    await flush();
    expect(getFileManager).not.toHaveBeenCalled();
    expect(fm.newFile).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/touch")[0];
    expect(pkt.status).toBe(500);
    expect(pkt.data.instanceUuid).toBe("does-not-exist");
  });

  // ---- busy/starting instance policy (write ops frozen, reads allowed) ----
  it("gate: BUSY instance blocks file/touch -> {500} before getFileManager is touched", async () => {
    getInstance("i1").status.mockImplementation(() => Instance.STATUS_BUSY);
    const { socket } = dispatch(
      "file/touch",
      { instanceUuid: "i1", target: "a.txt" },
      { session: AUTHED() }
    );
    await flush();
    expect(getFileManager).not.toHaveBeenCalled();
    expect(fm.newFile).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/touch")[0];
    expect(pkt.status).toBe(500);
  });

  it("gate: STARTING instance blocks file/delete -> {500} before getFileManager is touched", async () => {
    getInstance("i1").status.mockImplementation(() => Instance.STATUS_STARTING);
    const { socket } = dispatch(
      "file/delete",
      { instanceUuid: "i1", targets: ["a.txt"] },
      { session: AUTHED() }
    );
    await flush();
    expect(getFileManager).not.toHaveBeenCalled();
    expect(fm.delete).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/delete")[0];
    expect(pkt.status).toBe(500);
  });

  it("gate: BUSY instance still allows file/list and file/status -> {200}", async () => {
    getInstance("i1").status.mockImplementation(() => Instance.STATUS_BUSY);
    const list = dispatch(
      "file/list",
      { instanceUuid: "i1", page: 0, pageSize: 40, target: "", fileName: "" },
      { session: AUTHED() }
    );
    const status = dispatch("file/status", { instanceUuid: "i1" }, { session: AUTHED() });
    await flush();
    expect(packetsFor(list.socket, "file/list")[0].status).toBe(200);
    expect(packetsFor(status.socket, "file/status")[0].status).toBe(200);
  });

  // ---- per-instance FileManager binding (workspace isolation wiring) ----
  it("file/touch: request for instance i2 only touches i2's FileManager -> {200}", async () => {
    const { socket } = dispatch(
      "file/touch",
      { instanceUuid: "i2", target: "b.txt" },
      { session: AUTHED() }
    );
    await flush();
    expect(getFileManager).toHaveBeenCalledWith("i2");
    expect(fm2.newFile).toHaveBeenCalledWith("b.txt");
    expect(fm.newFile).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/touch")[0];
    expect(pkt.status).toBe(200);
  });

  it("file/delete: request for instance i2 never touches i1's FileManager -> {200}", async () => {
    const { socket } = dispatch(
      "file/delete",
      { instanceUuid: "i2", targets: ["b.txt"] },
      { session: AUTHED() }
    );
    await flush();
    expect(getFileManager).toHaveBeenCalledWith("i2");
    expect(fm2.delete).toHaveBeenCalledWith("b.txt", { ignoreMissing: true });
    expect(fm.delete).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/delete")[0];
    expect(pkt.status).toBe(200);
  });

  it("file/edit: request for instance i2 reads/writes only via i2's FileManager -> {200}", async () => {
    const { socket } = dispatch(
      "file/edit",
      { instanceUuid: "i2", target: "b.txt", text: "x" },
      { session: AUTHED() }
    );
    await flush();
    expect(fm2.edit).toHaveBeenCalledWith("b.txt", "x");
    expect(fm.edit).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/edit")[0];
    expect(pkt.status).toBe(200);
  });

  // ---- workspace escape rejection (sandbox contract at the router boundary) ----
  it("file/touch: target escaping the workspace -> {500} illegalAccess", async () => {
    const { socket } = dispatch(
      "file/touch",
      { instanceUuid: "i1", target: "../evil.txt" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "file/touch")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("illegalAccess");
  });

  it("file/mkdir: target escaping the workspace -> {500} illegalAccess", async () => {
    const { socket } = dispatch(
      "file/mkdir",
      { instanceUuid: "i1", target: "../evil-dir" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "file/mkdir")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("illegalAccess");
  });

  it("file/edit: target escaping the workspace -> {500} illegalAccess", async () => {
    const { socket } = dispatch(
      "file/edit",
      { instanceUuid: "i1", target: "../evil.txt", text: "pwned" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "file/edit")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("illegalAccess");
  });

  it("file/delete: target escaping the workspace -> {500} and no delete/task lookup runs", async () => {
    const { socket } = dispatch(
      "file/delete",
      { instanceUuid: "i1", targets: ["../evil.txt"] },
      { session: AUTHED() }
    );
    await flush();
    // toAbsolutePath rejects before any delete or upload/download task probe.
    expect(fm.delete).not.toHaveBeenCalled();
    expect(uploadManager.getByPath).not.toHaveBeenCalled();
    expect(downloadManager.stop).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/delete")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("illegalAccess");
  });

  it("file/copy: fire-and-forget — responds {200, true} without waiting for copy to settle", async () => {
    // file/copy deliberately does NOT await fileManager.copy(): copying a huge
    // file must not block the response past the client request timeout. Prove
    // the route responds while the copy promise is still pending.
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    fm.copy.mockImplementation(() => pending);
    const { socket } = dispatch(
      "file/copy",
      { instanceUuid: "i1", targets: [["ok.txt", "ok-copy.txt"]] },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.copy).toHaveBeenCalledWith("ok.txt", "ok-copy.txt");
    const pkt = packetsFor(socket, "file/copy")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data).toBe(true);
    release();
  });

  it("file/move: escaping destination -> {500} illegalAccess", async () => {
    const { socket } = dispatch(
      "file/move",
      { instanceUuid: "i1", targets: [["a.txt", "../evil.txt"]] },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "file/move")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("illegalAccess");
  });

  it("file/chmod: target escaping the workspace -> {500} illegalAccess", async () => {
    const { socket } = dispatch(
      "file/chmod",
      { instanceUuid: "i1", chmod: 755, target: "../evil.sh", deep: true },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "file/chmod")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("illegalAccess");
  });

  it("file/chmod_batch: escaping targets are aggregated into failed, not thrown", async () => {
    const { socket } = dispatch(
      "file/chmod_batch",
      {
        instanceUuid: "i1",
        chmod: 644,
        targets: ["ok.txt", "../evil.txt"],
        deep: false
      },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "file/chmod_batch")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.success).toBe(1);
    expect(pkt.data.failed).toBe(1);
    expect(pkt.data.results[0]).toEqual({ target: "ok.txt", success: true });
    expect(pkt.data.results[1]).toMatchObject({ target: "../evil.txt", success: false });
    expect(pkt.data.results[1].error).toContain("illegalAccess");
  });

  it("file/compress: escaping source -> {500} and fileLock counters stay balanced", async () => {
    const inst = getInstance("i1");
    const { socket } = dispatch(
      "file/compress",
      {
        instanceUuid: "i1",
        source: "../evil.zip",
        targets: ["a.txt"],
        type: 1,
        code: "utf-8"
      },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "file/compress")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("illegalAccess");
    expect(inst.info.fileLock).toBe(0);
    expect(globalEnv.fileTaskCount).toBe(0);
  });

  it("file/download_from_url: escaping fileName -> {500} and downloadFromUrl NOT called", async () => {
    const { socket } = dispatch(
      "file/download_from_url",
      {
        instanceUuid: "i1",
        url: "https://example.com/file.zip",
        fileName: "../evil.bin",
        fallbackUrl: ""
      },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.checkPath).toHaveBeenCalledWith("../evil.bin");
    expect(downloadManager.downloadFromUrl).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/download_from_url")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("illegalAccess");
  });

  it("file/download_from_url_stop: escaping fileName -> {500} and stop NOT called", async () => {
    const { socket } = dispatch(
      "file/download_from_url_stop",
      { instanceUuid: "i1", fileName: "../evil.bin" },
      { session: AUTHED() }
    );
    await flush();
    expect(downloadManager.stop).not.toHaveBeenCalled();
    expect(downloadManager.stopById).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/download_from_url_stop")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("illegalAccess");
  });

  // ---- file/delete vs in-flight upload/download tasks ----
  it("file/delete: path with an in-flight upload -> writer.stop() and no delete", async () => {
    const stop = vi.fn(async () => undefined);
    (uploadManager as any).getByPath.mockImplementation(() => ({ writer: { stop } }));
    const { socket } = dispatch(
      "file/delete",
      { instanceUuid: "i1", targets: ["old.txt"] },
      { session: AUTHED() }
    );
    await flush();
    expect(uploadManager.getByPath).toHaveBeenCalledWith("/tmp/inst-i1/old.txt");
    expect(stop).toHaveBeenCalled();
    expect(fm.delete).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/delete")[0];
    expect(pkt.status).toBe(200);
  });

  it("file/delete: path with an in-flight download -> downloadManager.stop(path) and no delete", async () => {
    (downloadManager as any).tasks = [
      {
        id: "d1",
        path: "/tmp/inst-i1/old.txt",
        total: 1,
        current: 0,
        status: "downloading",
        error: null
      }
    ];
    const { socket } = dispatch(
      "file/delete",
      { instanceUuid: "i1", targets: ["old.txt"] },
      { session: AUTHED() }
    );
    await flush();
    expect(downloadManager.stop).toHaveBeenCalledWith("/tmp/inst-i1/old.txt");
    expect(fm.delete).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/delete")[0];
    expect(pkt.status).toBe(200);
  });

  // ---- file/download_from_url safety gates ----
  it("file/download_from_url: checkSafeUrl rejects the url -> {500} and downloadFromUrl NOT called", async () => {
    (checkSafeUrl as any).mockImplementation(async () => false);
    const { socket } = dispatch(
      "file/download_from_url",
      {
        instanceUuid: "i1",
        url: "http://127.0.0.1/secret",
        fileName: "dl.zip",
        fallbackUrl: ""
      },
      { session: AUTHED() }
    );
    await flush();
    expect(checkSafeUrl).toHaveBeenCalledWith("http://127.0.0.1/secret");
    expect(downloadManager.downloadFromUrl).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/download_from_url")[0];
    expect(pkt.status).toBe(500);
  });

  it("file/download_from_url: maxDownloadFromUrlFileCount reached -> {500} and downloadFromUrl NOT called", async () => {
    globalConfiguration.config.maxDownloadFromUrlFileCount = 2;
    (downloadManager as any).downloadingCount = 2;
    const { socket } = dispatch(
      "file/download_from_url",
      {
        instanceUuid: "i1",
        url: "https://example.com/file.zip",
        fileName: "dl.zip",
        fallbackUrl: ""
      },
      { session: AUTHED() }
    );
    await flush();
    expect(downloadManager.downloadFromUrl).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/download_from_url")[0];
    expect(pkt.status).toBe(500);
  });

  it("file/download_from_url_stop: neither taskId nor fileName -> {500} (handler mode)", async () => {
    // No instanceUuid either: the file/* gate would reject this first, so the
    // handler's defensive "taskId or fileName is required" branch is exercised
    // through invoke() (gate skipped).
    const { socket } = invoke("file/download_from_url_stop", {}, { session: AUTHED() });
    await flush();
    expect(downloadManager.stop).not.toHaveBeenCalled();
    expect(downloadManager.stopById).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/download_from_url_stop")[0];
    expect(pkt.status).toBe(500);
    expect(pkt.data).toBe("taskId or fileName is required");
  });

  // ---- file/status download task scoping ----
  it("file/status: download tasks outside the instance workspace are filtered out by checkPath", async () => {
    fm.checkPath.mockImplementation((p: string) => String(p).startsWith("/tmp/inst-i1"));
    (downloadManager as any).tasks = [
      {
        id: "own",
        path: "/tmp/inst-i1/dl.zip",
        total: 1,
        current: 0,
        status: "downloading",
        error: null
      },
      {
        id: "foreign",
        path: "/tmp/inst-i2/other.zip",
        total: 1,
        current: 0,
        status: "downloading",
        error: null
      }
    ];
    const { socket } = dispatch("file/status", { instanceUuid: "i1" }, { session: AUTHED() });
    await flush();
    expect(fm.checkPath).toHaveBeenCalledWith("/tmp/inst-i2/other.zip");
    const pkt = packetsFor(socket, "file/status")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.downloadTasks).toHaveLength(1);
    expect(pkt.data.downloadTasks[0].taskId).toBe("own");
    expect(pkt.data.downloadTasks[0].path).toBe("/dl.zip");
  });

  // ---- file/compress task limits ----
  it("file/compress: instance fileLock at maxFileTask -> {500} and zip/unzip NOT called", async () => {
    getInstance("i1").info.fileLock = 4; // == globalConfiguration.config.maxFileTask
    const { socket } = dispatch(
      "file/compress",
      { instanceUuid: "i1", source: "out.zip", targets: ["a.txt"], type: 1, code: "utf-8" },
      { session: AUTHED() }
    );
    await flush();
    expect(fm.zip).not.toHaveBeenCalled();
    expect(fm.unzip).not.toHaveBeenCalled();
    const pkt = packetsFor(socket, "file/compress")[0];
    expect(pkt.status).toBe(500);
  });

  it("file/compress: zip failure still balances instance fileLock and global task count", async () => {
    fm.zip.mockImplementation(async () => {
      throw new Error("zip exploded");
    });
    const inst = getInstance("i1");
    const { socket } = dispatch(
      "file/compress",
      { instanceUuid: "i1", source: "out.zip", targets: ["a.txt"], type: 1, code: "utf-8" },
      { session: AUTHED() }
    );
    await flush();
    const pkt = packetsFor(socket, "file/compress")[0];
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).toContain("zip exploded");
    expect(inst.info.fileLock).toBe(0);
    expect(globalEnv.fileTaskCount).toBe(0);
  });
});
