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
    status: vi.fn(() => 0),
    absoluteCwdPath: vi.fn(() => sandbox.dirA)
  });
  const instB = fakeInstance("b", {
    info: { fileLock: 0 },
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
import { compress, decompress } from "../../common/compress";
import FileManager from "../../service/system_file";

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
  globalConfiguration.config.maxDownloadFromUrlFileCount = 0;
  globalConfiguration.config.maxZipFileSize = 1;
  globalEnv.fileTaskCount = 0;
  vi.clearAllMocks();
  (downloadManager as any).tasks = [];
  (downloadManager as any).downloadingCount = 0;
  (downloadManager as any).downloadFromUrl.mockImplementation(async () => undefined);
  (uploadManager as any).getByPath.mockImplementation(() => undefined);
  (checkSafeUrl as any).mockImplementation(async () => true);
  (compress as any).mockImplementation(async () => undefined);
  (decompress as any).mockImplementation(async () => undefined);
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
      ""
    );
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
