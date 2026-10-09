import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { globalConfiguration, globalEnv } from "../../entity/config";
import { dispatch, packetsFor } from "../../../test/harness/router";
import { fakeInstance, mockInstanceSystem } from "../../../test/harness/mocks";

// Real-disk sandbox security tests for file_router.
//
// Unlike file_router.test.ts (fully stubbed FileManager), this suite wires the
// REAL FileManager + file_router_service and only fakes the outer boundaries
// (instance system, network, upload/download managers, compression binaries).
// Each instance gets a REAL temp workspace directory; the tests prove that a
// request for one instance can never read or modify anything outside its own
// workspace — through relative traversal, absolute path injection, sibling
// prefix confusion, symlink/junction escape or Zip Slip archives.

// Shared sandbox paths, created in beforeAll. vi.hoisted keeps them reachable
// from the hoisted vi.mock factories below (which run before the test body).
const sandbox = vi.hoisted(() => ({
  root: "",
  dirA: "",
  dirB: "",
  dirAB: ""
}));

// noOp logger (protocol.responseError warns through it).
vi.mock("../../service/log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// The file_router gate reads Instance.STATUS_* and GLOBAL_INSTANCE_UUID_KEY.
// Avoid the heavy real class chain (dispatcher / docker_stats).
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

// download_manager: file/status reads .tasks; download_from_url calls
// .downloadFromUrl (asserted NOT called on escapes); delete/stop paths use it.
vi.mock("../../service/download_manager", () => ({
  default: {
    tasks: [] as any[],
    downloadingCount: 0,
    downloadFromUrl: vi.fn(async () => undefined),
    stop: vi.fn(() => true),
    stopById: vi.fn(() => true)
  }
}));

// upload_manager: file/delete probes getByPath before deleting.
vi.mock("../../service/upload_manager", () => ({
  default: { getByPath: vi.fn(() => undefined) }
}));

// checkSafeUrl: pass so download_from_url reaches the path sandbox.
vi.mock("../../utils/url", () => ({ checkSafeUrl: vi.fn(async () => true) }));

// Compression runs external 7zip/golang-zip binaries — never spawn in tests.
// Escapes must be rejected BEFORE these are touched (asserted per test).
vi.mock("../../common/compress", () => ({
  compress: vi.fn(async () => undefined),
  decompress: vi.fn(async () => undefined),
  listArchiveEntries: vi.fn(async () => [])
}));

// The instance system is the only faked layer under the router: each fake
// instance's absoluteCwdPath() points at its REAL temp workspace directory, so
// getFileManager() (NOT mocked) builds a real FileManager sandboxed to it.
vi.mock("../../service/system_instance", () => {
  const instA = fakeInstance("a", {
    info: { fileLock: 0 },
    println: vi.fn(),
    status: vi.fn(() => 0),
    absoluteCwdPath: vi.fn(() => sandbox.dirA)
  });
  const instB = fakeInstance("b", {
    info: { fileLock: 0 },
    println: vi.fn(),
    status: vi.fn(() => 0),
    absoluteCwdPath: vi.fn(() => sandbox.dirB)
  });
  const base = mockInstanceSystem([instA, instB]);
  return { default: { ...base.default } };
});

// Register the top-level auth gate (auth_router) + file handlers on the singleton.
import "../auth_router";
import "../file_router";
import downloadManager from "../../service/download_manager";
import uploadManager from "../../service/upload_manager";
import { checkSafeUrl } from "../../utils/url";
import { compress, decompress, listArchiveEntries } from "../../common/compress";
import FileManager from "../../service/system_file";
import InstanceSubsystem from "../../service/system_instance";
import * as fileOwnership from "../../tools/file_ownership";

// symlinks/junctions need privileges on some systems (Windows without
// developer mode); fall back to skipping the link-escape tests.
let linkOk = false;

beforeAll(() => {
  sandbox.root = fs.mkdtempSync(path.join(os.tmpdir(), "mcs-fm-sandbox-"));
  sandbox.dirA = path.join(sandbox.root, "inst-a");
  sandbox.dirB = path.join(sandbox.root, "inst-b");
  sandbox.dirAB = path.join(sandbox.root, "inst-ab");
  for (const dir of [sandbox.dirA, sandbox.dirB, sandbox.dirAB]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(sandbox.dirA, "ok.txt"), "A-OK");
  fs.writeFileSync(path.join(sandbox.dirB, "secret.txt"), "SECRET-B");
  fs.writeFileSync(path.join(sandbox.dirAB, "secret.txt"), "SECRET-AB");
  // inst-a/link -> inst-b (junctions work unprivileged on win32; dir symlinks elsewhere).
  const linkPath = path.join(sandbox.dirA, "link");
  try {
    fs.symlinkSync(sandbox.dirB, linkPath, process.platform === "win32" ? "junction" : "dir");
    linkOk = true;
  } catch {
    linkOk = false;
  }
});

afterAll(() => {
  if (sandbox.root) fs.removeSync(sandbox.root);
});

beforeEach(() => {
  globalConfiguration.config.key = "test-key";
  globalConfiguration.config.maxFileTask = 4;
  globalConfiguration.config.maxGlobalFileTask = 8;
  globalConfiguration.config.maxDownloadFromUrlFileCount = 0;
  globalConfiguration.config.maxZipFileSize = 1;
  globalEnv.fileTaskCount = 0;
  vi.clearAllMocks();
  for (const id of ["a", "b"]) InstanceSubsystem.getInstance(id)!.info.fileLock = 0;
  (downloadManager as any).tasks = [];
  (downloadManager as any).downloadingCount = 0;
  (downloadManager as any).downloadFromUrl.mockImplementation(async () => undefined);
  (uploadManager as any).getByPath.mockImplementation(() => undefined);
  (checkSafeUrl as any).mockImplementation(async () => true);
  (compress as any).mockImplementation(async () => undefined);
  (decompress as any).mockImplementation(async () => undefined);
});

describe("background file copy quotas", () => {
  it("runs one batch sequentially and holds a reservation until completion", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const copy = vi
      .spyOn(FileManager.prototype, "copy")
      .mockImplementationOnce(() => pending)
      .mockResolvedValue(undefined);
    try {
      const packet = await call("file/copy", {
        instanceUuid: "a",
        targets: [
          ["ok.txt", "copy1"],
          ["ok.txt", "copy2"]
        ]
      });
      expect(packet.status).toBe(200);
      expect(copy).toHaveBeenCalledTimes(1);
      expect(InstanceSubsystem.getInstance("a")!.info.fileLock).toBe(1);
      expect(globalEnv.fileTaskCount).toBe(1);
      finish();
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(globalEnv.fileTaskCount).toBe(0);
      expect(copy).toHaveBeenCalledTimes(2);
    } finally {
      finish();
      copy.mockRestore();
    }
  });

  it("rejects new copies at the global quota before starting work", async () => {
    globalEnv.fileTaskCount = globalConfiguration.config.maxGlobalFileTask;
    const copy = vi.spyOn(FileManager.prototype, "copy");
    try {
      const packet = await call("file/copy", { instanceUuid: "a", targets: [["ok.txt", "copy"]] });
      expect(packet.status).toBe(500);
      expect(copy).not.toHaveBeenCalled();
      expect(InstanceSubsystem.getInstance("a")!.info.fileLock).toBe(0);
    } finally {
      copy.mockRestore();
    }
  });

  it("releases a failed copy and rejects malformed or oversized batches", async () => {
    const copy = vi
      .spyOn(FileManager.prototype, "copy")
      .mockRejectedValue(new Error("copy failed"));
    try {
      const packet = await call("file/copy", { instanceUuid: "a", targets: [["ok.txt", "copy"]] });
      expect(packet.status).toBe(200);
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(globalEnv.fileTaskCount).toBe(0);
      for (const targets of [[], [["ok.txt"]], Array(101).fill(["ok.txt", "copy"])]) {
        expect((await call("file/copy", { instanceUuid: "a", targets })).status).toBe(500);
      }
    } finally {
      copy.mockRestore();
    }
  });
});

describe("file move quotas", () => {
  it("holds one reservation for the entire sequential move batch", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const move = vi
      .spyOn(FileManager.prototype, "move")
      .mockImplementationOnce(() => pending)
      .mockResolvedValue(undefined);
    const operation = call("file/move", {
      instanceUuid: "a",
      targets: [
        ["ok.txt", "move1"],
        ["ok.txt", "move2"]
      ]
    });
    try {
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(move).toHaveBeenCalledTimes(1);
      expect(InstanceSubsystem.getInstance("a")!.info.fileLock).toBe(1);
      expect(globalEnv.fileTaskCount).toBe(1);
      finish();
      expect((await operation).status).toBe(200);
      expect(move).toHaveBeenCalledTimes(2);
      expect(globalEnv.fileTaskCount).toBe(0);
      expect(InstanceSubsystem.getInstance("a")!.info.fileLock).toBe(0);
    } finally {
      finish();
      await operation;
      move.mockRestore();
    }
  });

  it.each(["instance", "global"])(
    "rejects moves at the %s quota before mutation",
    async (quota) => {
      if (quota === "instance") InstanceSubsystem.getInstance("a")!.info.fileLock = 4;
      else globalEnv.fileTaskCount = 8;
      const move = vi.spyOn(FileManager.prototype, "move");
      try {
        expect(
          (await call("file/move", { instanceUuid: "a", targets: [["ok.txt", "moved"]] })).status
        ).toBe(500);
        expect(move).not.toHaveBeenCalled();
      } finally {
        move.mockRestore();
      }
    }
  );

  it("releases failed moves and rejects malformed batches", async () => {
    const move = vi
      .spyOn(FileManager.prototype, "move")
      .mockRejectedValue(new Error("move failed"));
    try {
      expect(
        (await call("file/move", { instanceUuid: "a", targets: [["ok.txt", "moved"]] })).status
      ).toBe(500);
      expect(globalEnv.fileTaskCount).toBe(0);
      expect(InstanceSubsystem.getInstance("a")!.info.fileLock).toBe(0);
      move.mockClear();
      for (const targets of [
        undefined,
        [],
        [["ok.txt"]],
        [["ok.txt", ""]],
        Array(101).fill(["ok.txt", "moved"])
      ])
        expect((await call("file/move", { instanceUuid: "a", targets })).status).toBe(500);
      expect(move).not.toHaveBeenCalled();
    } finally {
      move.mockRestore();
    }
  });
});

describe("download ownership completion", () => {
  it.each(["success", "failure", "cancellation"])(
    "synchronizes %s downloads once",
    async (outcome) => {
      const ownership = {
        uid: process.getuid?.() ?? 0,
        gid: process.getgid?.() ?? 0,
        rootless: true
      };
      const resolver = vi
        .spyOn(fileOwnership, "resolveInstanceFileOwnership")
        .mockResolvedValue(ownership);
      const sync = vi.spyOn(FileManager.prototype, "syncOwnership").mockResolvedValue(undefined);
      vi.mocked(downloadManager.downloadFromUrl).mockImplementationOnce(
        async (_url, _target, _fallback, onDownloaded) => {
          if (outcome === "success") await onDownloaded?.();
          else if (outcome === "failure") throw new Error("download failed");
          // Cancellation can resolve without running onDownloaded.
        }
      );
      try {
        expect(
          (
            await call("file/download_from_url", {
              instanceUuid: "a",
              url: "https://example.com/file",
              fileName: "download.bin"
            })
          ).status
        ).toBe(200);
        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(
          sync.mock.calls.filter(([target]) => target === path.join(sandbox.dirA, "download.bin"))
        ).toHaveLength(1);
      } finally {
        resolver.mockRestore();
        sync.mockRestore();
      }
    }
  );
});

const AUTHED = (id = "sx") => ({
  key: "test-key",
  login: true,
  id,
  type: "TOP_LEVEL",
  stream: {}
});

// Dispatch through the full middleware chain and wait for the handler's
// response packet. The real FileManager does actual fs/stream I/O which lands
// on the thread pool — a single setImmediate is not enough — so poll until the
// packet shows up.
async function call(event: string, data: any) {
  const { socket } = dispatch(event, data, { session: AUTHED() });
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const pkts = packetsFor(socket, event);
    if (pkts.length > 0) return pkts[0];
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error(`timed out waiting for response to ${event}`);
}

const secretB = () => fs.readFileSync(path.join(sandbox.dirB, "secret.txt"), "utf-8");

describe("file_router security: per-instance workspace isolation (real FileManager)", () => {
  // ---- positive controls: each instance only ever writes into its own dir ----
  it("file/touch via a and via b creates two separate files, one per workspace", async () => {
    const pa = await call("file/touch", { instanceUuid: "a", target: "touched.txt" });
    const pb = await call("file/touch", { instanceUuid: "b", target: "touched.txt" });
    expect(pa.status).toBe(200);
    expect(pb.status).toBe(200);
    expect(fs.existsSync(path.join(sandbox.dirA, "touched.txt"))).toBe(true);
    expect(fs.existsSync(path.join(sandbox.dirB, "touched.txt"))).toBe(true);
  });

  it("file/edit of the same relative name only modifies the requesting instance's file", async () => {
    fs.writeFileSync(path.join(sandbox.dirA, "shared.txt"), "IN-A");
    fs.writeFileSync(path.join(sandbox.dirB, "shared.txt"), "IN-B");
    const pkt = await call("file/edit", {
      instanceUuid: "a",
      target: "shared.txt",
      text: "A-EDITED"
    });
    expect(pkt.status).toBe(200);
    expect(fs.readFileSync(path.join(sandbox.dirA, "shared.txt"), "utf-8")).toBe("A-EDITED");
    expect(fs.readFileSync(path.join(sandbox.dirB, "shared.txt"), "utf-8")).toBe("IN-B");
  });

  it("file/list via a reports inst-a as absolutePath and never lists inst-b names", async () => {
    const pkt = await call("file/list", {
      instanceUuid: "a",
      page: 0,
      pageSize: 100,
      target: "",
      fileName: ""
    });
    expect(pkt.status).toBe(200);
    expect(pkt.data.absolutePath).toBe(path.normalize(sandbox.dirA));
    const names = pkt.data.items.map((i: any) => i.name);
    expect(names).toContain("ok.txt");
    expect(names).not.toContain("secret.txt");
  });

  it("file/download_from_url via a stores the download target inside inst-a", async () => {
    const pkt = await call("file/download_from_url", {
      instanceUuid: "a",
      url: "https://example.com/file.zip",
      fileName: "dl.bin",
      fallbackUrl: ""
    });
    expect(pkt.status).toBe(200);
    expect(downloadManager.downloadFromUrl).toHaveBeenCalledWith(
      "https://example.com/file.zip",
      path.join(sandbox.dirA, "dl.bin"),
      "",
      expect.any(Function)
    );
  });

  it("checks the download quota after asynchronous directory preparation", async () => {
    globalConfiguration.config.maxDownloadFromUrlFileCount = 1;
    let release!: () => void;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    let prepared = 0;
    const mkdir = vi.spyOn(FileManager.prototype, "mkdir").mockImplementation(async () => {
      if (++prepared === 2) release();
      await ready;
    });
    vi.mocked(downloadManager.downloadFromUrl).mockImplementation(async () => {
      (downloadManager as any).downloadingCount++;
    });
    try {
      const packets = await Promise.all(
        ["a", "b"].map((instanceUuid) =>
          call("file/download_from_url", {
            instanceUuid,
            url: "https://example.com/file.zip",
            fileName: "quota.bin"
          })
        )
      );
      expect(packets.map((packet) => packet.status).sort()).toEqual([200, 500]);
      expect(downloadManager.downloadFromUrl).toHaveBeenCalledTimes(1);
    } finally {
      release();
      mkdir.mockRestore();
    }
  });

  // ---- relative traversal: '../inst-b/...' must never reach inst-b ----
  it("file/touch: '../inst-b/pwn.txt' escapes -> {500} and inst-b is not written", async () => {
    const pkt = await call("file/touch", {
      instanceUuid: "a",
      target: path.join("..", "inst-b", "pwn.txt")
    });
    expect(pkt.status).toBe(500);
    expect(fs.existsSync(path.join(sandbox.dirB, "pwn.txt"))).toBe(false);
  });

  it("file/edit: write to '../inst-b/secret.txt' escapes -> {500} and content unchanged", async () => {
    const pkt = await call("file/edit", {
      instanceUuid: "a",
      target: path.join("..", "inst-b", "secret.txt"),
      text: "PWNED"
    });
    expect(pkt.status).toBe(500);
    expect(secretB()).toBe("SECRET-B");
  });

  it("file/delete: '../inst-b/secret.txt' escapes -> {500} and the file survives", async () => {
    const pkt = await call("file/delete", {
      instanceUuid: "a",
      targets: [path.join("..", "inst-b", "secret.txt")]
    });
    expect(pkt.status).toBe(500);
    expect(uploadManager.getByPath).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(sandbox.dirB, "secret.txt"))).toBe(true);
    expect(secretB()).toBe("SECRET-B");
  });

  it("file/mkdir: '../inst-b/sub' escapes -> {500} and the directory is not created", async () => {
    const pkt = await call("file/mkdir", {
      instanceUuid: "a",
      target: path.join("..", "inst-b", "sub")
    });
    expect(pkt.status).toBe(500);
    expect(fs.existsSync(path.join(sandbox.dirB, "sub"))).toBe(false);
  });

  it("FileManager.copy rejects an escaping destination and never writes into inst-b", async () => {
    // file/copy is fire-and-forget at the route (deliberately not awaited), so
    // the sandbox contract is asserted directly on the real FileManager rather
    // than through the router response.
    const fileManager = new FileManager(sandbox.dirA);
    await expect(
      fileManager.copy("ok.txt", path.join("..", "inst-b", "copied.txt"))
    ).rejects.toThrow();
    expect(fs.existsSync(path.join(sandbox.dirB, "copied.txt"))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.dirA, "ok.txt"))).toBe(true);
  });

  it("file/move into inst-b escapes -> {500} and the source stays in inst-a", async () => {
    fs.writeFileSync(path.join(sandbox.dirA, "moveme.txt"), "MOVE");
    const pkt = await call("file/move", {
      instanceUuid: "a",
      targets: [["moveme.txt", path.join("..", "inst-b", "moved.txt")]]
    });
    expect(pkt.status).toBe(500);
    expect(fs.existsSync(path.join(sandbox.dirB, "moved.txt"))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.dirA, "moveme.txt"))).toBe(true);
  });

  it("file/list: target '../inst-b' escapes -> {500} and inst-b names are not listed", async () => {
    const pkt = await call("file/list", {
      instanceUuid: "a",
      page: 0,
      pageSize: 100,
      target: path.join("..", "inst-b"),
      fileName: ""
    });
    expect(pkt.status).toBe(500);
    expect(pkt.data.items).toBeUndefined();
    expect(String(pkt.data)).not.toContain("SECRET-B");
  });

  it("file/download_from_url: escaping fileName -> {500} and downloadFromUrl NOT called", async () => {
    const pkt = await call("file/download_from_url", {
      instanceUuid: "a",
      url: "https://example.com/evil.bin",
      fileName: path.join("..", "inst-b", "evil.bin"),
      fallbackUrl: ""
    });
    expect(pkt.status).toBe(500);
    expect(downloadManager.downloadFromUrl).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(sandbox.dirB, "evil.bin"))).toBe(false);
  });

  it("file/compress type=1: escaping source -> {500} and compress NOT called", async () => {
    const pkt = await call("file/compress", {
      instanceUuid: "a",
      source: path.join("..", "inst-b", "out.zip"),
      targets: ["ok.txt"],
      type: 1,
      code: "utf-8"
    });
    expect(pkt.status).toBe(500);
    expect(compress).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(sandbox.dirB, "out.zip"))).toBe(false);
  });

  it("file/compress type=0: escaping source -> {500} and decompress NOT called", async () => {
    const pkt = await call("file/compress", {
      instanceUuid: "a",
      source: path.join("..", "inst-b", "in.zip"),
      targets: "out/",
      type: 0,
      code: "utf-8"
    });
    expect(pkt.status).toBe(500);
    expect(decompress).not.toHaveBeenCalled();
  });

  it("file/chmod: escaping target -> {500} before any chmod process runs", async () => {
    const pkt = await call("file/chmod", {
      instanceUuid: "a",
      chmod: 777,
      target: path.join("..", "inst-b", "secret.txt"),
      deep: true
    });
    expect(pkt.status).toBe(500);
    expect(secretB()).toBe("SECRET-B");
  });

  // ---- absolute path injection into another instance's workspace ----
  it("file/edit: inst-b's absolute secret path -> {500} and content unchanged", async () => {
    const pkt = await call("file/edit", {
      instanceUuid: "a",
      target: path.join(sandbox.dirB, "secret.txt"),
      text: "PWNED"
    });
    expect(pkt.status).toBe(500);
    expect(secretB()).toBe("SECRET-B");
  });

  it("file/delete: inst-b's absolute secret path never deletes the file", async () => {
    const pkt = await call("file/delete", {
      instanceUuid: "a",
      targets: [path.join(sandbox.dirB, "secret.txt")]
    });
    // win32 rejects the absolute foreign path outright ({500}); POSIX folds it
    // under the requesting workspace where nothing exists ({200}, nothing to
    // delete). Either way inst-b must stay intact.
    expect([200, 500]).toContain(pkt.status);
    expect(fs.existsSync(path.join(sandbox.dirB, "secret.txt"))).toBe(true);
    expect(secretB()).toBe("SECRET-B");
  });

  it("file/touch: inst-b's absolute path never creates a file inside inst-b", async () => {
    const pkt = await call("file/touch", {
      instanceUuid: "a",
      target: path.join(sandbox.dirB, "pwn-abs.txt")
    });
    // Same platform difference as above: win32 {500}; POSIX contains the write
    // inside inst-a's own workspace ({200}). inst-b is never touched either way.
    expect([200, 500]).toContain(pkt.status);
    expect(fs.existsSync(path.join(sandbox.dirB, "pwn-abs.txt"))).toBe(false);
  });

  it("file/edit: sibling-prefix absolute path (inst-ab) -> {500} and content unchanged", async () => {
    // inst-ab's path string starts with inst-a's — a plain prefix check would
    // wrongly accept it; the real path comparison must reject it.
    const pkt = await call("file/edit", {
      instanceUuid: "a",
      target: path.join(sandbox.dirAB, "secret.txt"),
      text: "PWNED"
    });
    expect(pkt.status).toBe(500);
    expect(fs.readFileSync(path.join(sandbox.dirAB, "secret.txt"), "utf-8")).toBe("SECRET-AB");
  });

  // ---- symlink/junction escape: link inside the workspace pointing outside ----
  it("file/edit via inst-a/link escapes -> {500} and inst-b content unchanged", async () => {
    if (!linkOk) return;
    const pkt = await call("file/edit", {
      instanceUuid: "a",
      target: path.join("link", "secret.txt"),
      text: "PWNED"
    });
    expect(pkt.status).toBe(500);
    expect(secretB()).toBe("SECRET-B");
  });

  it("file/touch via inst-a/link escapes -> {500} and inst-b is not written", async () => {
    if (!linkOk) return;
    const pkt = await call("file/touch", {
      instanceUuid: "a",
      target: path.join("link", "pwn.txt")
    });
    expect(pkt.status).toBe(500);
    expect(fs.existsSync(path.join(sandbox.dirB, "pwn.txt"))).toBe(false);
  });

  it("file/list on inst-a/link escapes -> {500} instead of listing inst-b", async () => {
    if (!linkOk) return;
    const pkt = await call("file/list", {
      instanceUuid: "a",
      page: 0,
      pageSize: 100,
      target: "link",
      fileName: ""
    });
    expect(pkt.status).toBe(500);
    expect(String(pkt.data)).not.toContain("SECRET-B");
  });

  // ---- symlink + '..': the value checked must be the value handed to fs ----
  // path.join() would collapse 'link/..' lexically and hide the bug; only raw
  // concatenation preserves the shape a client can send and the kernel
  // resolves physically (link first, then '..' against the link's target).
  it("does not let a symlink followed by '..' escape the workspace", async () => {
    if (!linkOk) return;
    const raw = (...segs: string[]) => [sandbox.dirA, ...segs].join(path.sep);
    // inst-a/link resolves to inst-b, so the PHYSICAL meaning of
    // '<dirA>/link/../escape-marker.txt' is '<root>/escape-marker.txt' (inst-b's parent).
    const outsideMarker = path.join(sandbox.root, "escape-marker.txt");
    const outsideCreated = path.join(sandbox.root, "created-by-test.txt");
    fs.writeFileSync(outsideMarker, "OUTSIDE-MARKER");
    const fm = new FileManager(sandbox.dirA);
    const escapeTarget = raw("link", "..", "escape-marker.txt");

    // 1) the value handed to fs must never be the un-normalized 'link/..' shape
    let returned: string | null = null;
    try {
      returned = fm.toAbsolutePath(escapeTarget);
    } catch {
      returned = null;
    }
    if (returned) {
      expect(returned).toBe(path.normalize(returned));
      expect(fs.existsSync(returned)).toBe(false);
    }

    // 2) read/write through the escape shape must fail
    await expect(fm.readFile(escapeTarget)).rejects.toThrow();
    await expect(fm.edit(escapeTarget, "pwned")).rejects.toThrow();
    expect(fs.readFileSync(outsideMarker, "utf8")).toBe("OUTSIDE-MARKER");

    // 3) the same shape must not read a sibling instance's files either
    await expect(fm.readFile(raw("link", "..", "inst-b", "secret.txt"))).rejects.toThrow();
    expect(secretB()).toBe("SECRET-B");

    // 4) create through the escape shape must stay inside the workspace
    await fm.newFile(raw("link", "..", "created-by-test.txt")).catch(() => undefined);
    expect(fs.existsSync(outsideCreated)).toBe(false);

    fs.removeSync(outsideMarker);
    fs.removeSync(path.join(sandbox.dirA, "created-by-test.txt"));
    fs.removeSync(outsideCreated);
  });

  it("file/edit: symlink followed by '..' in an absolute target -> {500} and outside file unchanged", async () => {
    if (!linkOk) return;
    const outsideMarker = path.join(sandbox.root, "escape-marker-e2e.txt");
    fs.writeFileSync(outsideMarker, "OUTSIDE-MARKER");
    const target = [sandbox.dirA, "link", "..", "escape-marker-e2e.txt"].join(path.sep);
    const pkt = await call("file/edit", { instanceUuid: "a", target, text: "PWNED" });
    expect(pkt.status).toBe(500);
    expect(fs.readFileSync(outsideMarker, "utf8")).toBe("OUTSIDE-MARKER");
    fs.removeSync(outsideMarker);
  });

  // ---- Zip Slip: archive entries must not escape the destination directory ----
  it("file/compress type=0: zip with '../' entries -> {500} and decompress NOT called", async () => {
    fs.writeFileSync(
      path.join(sandbox.dirA, "evil.zip"),
      makeStoredZip(["../evil.txt", "../../evil2.txt", "ok-entry.txt"])
    );
    const pkt = await call("file/compress", {
      instanceUuid: "a",
      source: "evil.zip",
      targets: "out/",
      type: 0,
      code: "utf-8"
    });
    expect(pkt.status).toBe(500);
    expect(decompress).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(sandbox.dirA, "evil.txt"))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.root, "evil2.txt"))).toBe(false);
  });

  // ---- Zip Slip via symlink + '..': kernel-physical meaning vs lexical check ----
  // Non-zip archives are listed through listArchiveEntries (raw names, no
  // node-stream-zip name validation), so this is the path that must enforce
  // containment itself. '<dest>/link/../x' collapses to '<dest>/x' under
  // path.resolve() but means '<outside-parent>/x' to the extractor whenever a
  // pre-existing 'link' points outside the workspace.
  const nonZipEntries = async (
    entries: Array<{ name: string; isDirectory: boolean; linkTarget?: string }>
  ) => {
    fs.writeFileSync(path.join(sandbox.dirA, "evil.7z"), "not-a-real-archive");
    (listArchiveEntries as any).mockImplementation(async () => entries);
  };
  const resetNonZipEntries = () => {
    fs.removeSync(path.join(sandbox.dirA, "evil.7z"));
    (listArchiveEntries as any).mockImplementation(async () => []);
  };

  it("rejects ordinary entries through existing outward symlinks and absolute archive paths", async () => {
    if (!linkOk) return;
    for (const name of ["link/secret.txt", path.join(sandbox.dirB, "secret.txt")]) {
      await nonZipEntries([{ name, isDirectory: false }]);
      const packet = await call("file/compress", {
        instanceUuid: "a",
        source: "evil.7z",
        targets: ".",
        type: 0,
        code: "utf-8"
      });
      expect(packet.status).toBe(500);
      expect(decompress).not.toHaveBeenCalled();
    }
    resetNonZipEntries();
  });

  it("file/compress type=0: entry 'link/../x' + pre-existing outward link -> {500} and decompress NOT called", async () => {
    if (!linkOk) return;
    await nonZipEntries([{ name: "link/../escape.txt", isDirectory: false }]);
    const pkt = await call("file/compress", {
      instanceUuid: "a",
      source: "evil.7z",
      targets: ".",
      type: 0,
      code: "utf-8"
    });
    expect(pkt.status).toBe(500);
    expect(decompress).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(sandbox.root, "escape.txt"))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.dirB, "escape.txt"))).toBe(false);
    resetNonZipEntries();
  });

  it("file/compress type=0: entry 'sub/link/../x' (outward link inside a real dir) -> {500} and decompress NOT called", async () => {
    if (!linkOk) return;
    fs.mkdirSync(path.join(sandbox.dirA, "sub"), { recursive: true });
    fs.symlinkSync(
      sandbox.dirB,
      path.join(sandbox.dirA, "sub", "link"),
      process.platform === "win32" ? "junction" : "dir"
    );
    await nonZipEntries([{ name: "sub/link/../escape2.txt", isDirectory: false }]);
    const pkt = await call("file/compress", {
      instanceUuid: "a",
      source: "evil.7z",
      targets: ".",
      type: 0,
      code: "utf-8"
    });
    expect(pkt.status).toBe(500);
    expect(decompress).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(sandbox.root, "escape2.txt"))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.dirB, "escape2.txt"))).toBe(false);
    fs.removeSync(path.join(sandbox.dirA, "sub"));
    resetNonZipEntries();
  });

  it("file/compress type=0: entry '..\\..\\evil.txt' (extractors treat '\\' as separator) -> {500}", async () => {
    await nonZipEntries([{ name: "..\\..\\evil-back.txt", isDirectory: false }]);
    const pkt = await call("file/compress", {
      instanceUuid: "a",
      source: "evil.7z",
      targets: ".",
      type: 0,
      code: "utf-8"
    });
    expect(pkt.status).toBe(500);
    expect(decompress).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(sandbox.root, "evil-back.txt"))).toBe(false);
    resetNonZipEntries();
  });

  it("file/compress type=0: symlink entry with an escaping target -> {500} and decompress NOT called", async () => {
    if (!linkOk) return;
    // 1) relative target that resolves outside the workspace
    await nonZipEntries([{ name: "evil-link", isDirectory: false, linkTarget: ".." }]);
    let pkt = await call("file/compress", {
      instanceUuid: "a",
      source: "evil.7z",
      targets: ".",
      type: 0,
      code: "utf-8"
    });
    expect(pkt.status).toBe(500);
    expect(decompress).not.toHaveBeenCalled();
    // 2) target that chains through the pre-existing outward link
    await nonZipEntries([{ name: "chain-link", isDirectory: false, linkTarget: "link" }]);
    pkt = await call("file/compress", {
      instanceUuid: "a",
      source: "evil.7z",
      targets: ".",
      type: 0,
      code: "utf-8"
    });
    expect(pkt.status).toBe(500);
    expect(decompress).not.toHaveBeenCalled();
    resetNonZipEntries();
  });

  it("file/compress type=0: benign entries and an INTERNAL symlink target still extract", async () => {
    fs.writeFileSync(path.join(sandbox.dirA, "ok-target.txt"), "OK");
    await nonZipEntries([
      { name: "plain.txt", isDirectory: false },
      { name: "ln", isDirectory: false, linkTarget: "ok-target.txt" }
    ]);
    const pkt = await call("file/compress", {
      instanceUuid: "a",
      source: "evil.7z",
      targets: ".",
      type: 0,
      code: "utf-8"
    });
    expect(pkt.status).toBe(200);
    expect(decompress).toHaveBeenCalled();
    fs.removeSync(path.join(sandbox.dirA, "ok-target.txt"));
    resetNonZipEntries();
  });

  // ---- Zip Slip via ARCHIVE symlink chain: s1 -> ., s2 -> s1/.., s2/Config/global.json ----
  // At check time s1/s2 do not exist on disk yet, so resolvePhysicalPath does
  // lexical folding (s1/.. collapses to .) and every entry looks safe.  During
  // extraction the kernel creates s1 and s2 first, then follows s2's chain when
  // writing s2/Config/global.json — escaping the workspace.  hasZipSlip must
  // simulate the ordered extraction and resolve through pending archive links.
  it("file/compress type=0: archive symlink chain s1->. / s2->s1/.. / s2/Config/global.json -> {500}", async () => {
    if (!linkOk) return;
    await nonZipEntries([
      { name: "s1", isDirectory: false, linkTarget: "." },
      { name: "s2", isDirectory: false, linkTarget: "s1/.." },
      { name: "s2/Config/global.json", isDirectory: false }
    ]);
    const pkt = await call("file/compress", {
      instanceUuid: "a",
      source: "evil.7z",
      targets: ".",
      type: 0,
      code: "utf-8"
    });
    expect(pkt.status).toBe(500);
    expect(decompress).not.toHaveBeenCalled();
    resetNonZipEntries();
  });

  it("file/compress type=0: archive symlink chain s1->.. / s2->s1/../.. -> {500}", async () => {
    if (!linkOk) return;
    await nonZipEntries([
      { name: "s1", isDirectory: false, linkTarget: ".." },
      { name: "s2", isDirectory: false, linkTarget: "s1/../.." },
      { name: "s2/Config/global.json", isDirectory: false }
    ]);
    const pkt = await call("file/compress", {
      instanceUuid: "a",
      source: "evil.7z",
      targets: ".",
      type: 0,
      code: "utf-8"
    });
    expect(pkt.status).toBe(500);
    expect(decompress).not.toHaveBeenCalled();
    resetNonZipEntries();
  });

  // ---- file/status task scoping with the real sandbox ----
  it("file/status: own download task is listed with a workspace-relative path", async () => {
    (downloadManager as any).tasks = [
      {
        id: "t1",
        path: path.join(sandbox.dirA, "dl.zip"),
        total: 1,
        current: 0,
        status: "downloading",
        error: null
      }
    ];
    const pkt = await call("file/status", { instanceUuid: "a" });
    expect(pkt.status).toBe(200);
    expect(pkt.data.downloadTasks).toHaveLength(1);
    expect(pkt.data.downloadTasks[0].taskId).toBe("t1");
    expect(pkt.data.downloadTasks[0].path).toBe("/dl.zip");
  });
});

// Minimal ZIP writer (stored entries, no compression) so tests can build a
// malicious archive without spawning external tools. node-stream-zip rejects
// entry names with '..' segments ("Malicious entry"), which FileManager.hasZipSlip
// treats as a Zip Slip attempt.
function makeStoredZip(entryNames: string[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const name of entryNames) {
    const nameBuf = Buffer.from(name, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(0, 14);
    local.writeUInt32LE(0, 18);
    local.writeUInt32LE(0, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(0, 16);
    central.writeUInt32LE(0, 20);
    central.writeUInt32LE(0, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += 30 + nameBuf.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entryNames.length, 8);
  eocd.writeUInt16LE(entryNames.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralBuf, eocd]);
}
