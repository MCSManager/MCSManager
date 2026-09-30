import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { mockMissionPassport } from "../../../test/harness/mocks";
import { createHttpApp } from "../../../test/harness/http";
import { DAEMON_INDEX_HTML } from "../../const/index_html";

// --- Inline mocks for the heavy deps http_router / initKoa pull in ---

// noOp logger (precheck + http_router both read `../service/log`).
vi.mock("../../service/log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// mission_passport: seed a download + an upload mission for known keys.
vi.mock("../../service/mission_passport", () =>
  mockMissionPassport({
    dlKey: { name: "download", parameter: { instanceUuid: "i1", fileName: "test.txt" } },
    dlBadInst: { name: "download", parameter: { instanceUuid: "nope", fileName: "test.txt" } },
    upKey: { name: "upload", parameter: { instanceUuid: "i1", uploadDir: "uploads" } }
  })
);

// InstanceSubsystem: only getInstance + absoluteCwdPath are read by http_router.
const fakeInst = { absoluteCwdPath: () => "/tmp/inst-i1" };
vi.mock("../../service/system_instance", () => ({
  default: { getInstance: (uuid: string) => (uuid === "i1" ? fakeInst : undefined) }
}));

// uploadManager: used by upload-new (stop + create) and upload-piece.
const fakeWriter = { stop: vi.fn(async () => undefined), id: "writer1" };
vi.mock("../../service/upload_manager", () => ({
  default: {
    get: vi.fn((id: string) => (id === "writer1" ? fakeWriter : undefined)),
    getByPath: vi.fn(() => undefined),
    delete: vi.fn(),
    add: vi.fn(() => "new-id"),
    getUploads: vi.fn(() => new Map())
  }
}));

// FileManager: stub the workspace/sandbox surface so no real FS path checks run.
vi.mock("../../service/system_file", () => ({
  default: class FileManager {
    constructor(public topPath: string = "") {}
    public static checkFileName(name?: string): boolean {
      return !!name && !/[\/\\|?*><;"]/.test(name);
    }
    public check(): boolean {
      return true;
    }
    public checkPath(): boolean {
      return true;
    }
    public toAbsolutePath(p = ""): string {
      return this.topPath ? `${this.topPath}/${p}` : `/tmp/${p}`;
    }
    public unzip() {}
  }
}));

// FileWriter: the upload-new happy path constructs + inits one; stub it.
vi.mock("../../entity/file_writer", () => ({
  default: class FileWriter {
    public received: any[] = [];
    public size = 0;
    public path = "/tmp/out";
    public id = "new-id";
    public static async getPath(): Promise<string> {
      return "/tmp/out";
    }
    public async init(): Promise<void> {}
    public async completeIfCovered(): Promise<void> {}
    public async stop(): Promise<void> {}
  }
}));

vi.mock("../../tools/filepath", () => ({ clearUploadFiles: vi.fn() }));

// speed_limit.sendFile is the download boundary; mock it so no real stream is
// created. Also export proxyIncomingMessage/ThrottleTransform for precheck.
vi.mock("../../utils/speed_limit", () => ({
  sendFile: vi.fn(async (ctx: any, _fileAbsPath: string) => {
    ctx.body = "sent";
    ctx.status = 200;
  }),
  proxyIncomingMessage: vi.fn(),
  ThrottleTransform: class {}
}));

// fs-extra: avoid the upload handler's existsSync/move touching the disk.
vi.mock("fs-extra", () => {
  const mod: any = {
    existsSync: vi.fn(() => false),
    move: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    mkdirSync: vi.fn(),
    createFile: vi.fn(async () => undefined)
  };
  return { ...mod, default: mod };
});

import { sendFile } from "../../utils/speed_limit";

let request: any;
beforeAll(async () => {
  request = await createHttpApp();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("http_router GET /", () => {
  it("returns DAEMON_INDEX_HTML with status 200", async () => {
    const res = await request.get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe(DAEMON_INDEX_HTML);
  });
});

describe("http_router GET /download/:key/:fileName", () => {
  it("valid mission -> sendFile called with the absolute path -> 200", async () => {
    const res = await request.get("/download/dlKey/test.txt");
    expect(res.status).toBe(200);
    expect(vi.mocked(sendFile)).toHaveBeenCalledWith(expect.anything(), "/tmp/inst-i1/test.txt");
  });

  it("invalid key -> mission null -> 500", async () => {
    const res = await request.get("/download/NOPE/test.txt");
    expect(res.status).toBe(500);
  });

  it("instance not found -> 500", async () => {
    const res = await request.get("/download/dlBadInst/test.txt");
    expect(res.status).toBe(500);
  });
});

describe("http_router POST /upload/:key (legacy)", () => {
  // Real multipart body parsing is intentionally not covered here; the mission
  // gate is the same branch upload-new exercises below with a full happy path.
  it("invalid key (non-multipart) -> 500 No task found", async () => {
    const res = await request.post("/upload/NOPE").send({});
    expect(res.status).toBe(500);
  });
});

describe("http_router POST /upload-new/:key", () => {
  it("invalid key -> 500", async () => {
    const res = await request.post("/upload-new/NOPE").send({});
    expect(res.status).toBe(500);
  });

  it("?stop=true with a live writer -> writer.stop() + 200 OK", async () => {
    const res = await request.post("/upload-new/writer1").query({ stop: true });
    expect(res.status).toBe(200);
    expect(res.text).toBe("OK");
    expect(fakeWriter.stop).toHaveBeenCalled();
  });

  it("?stop=true without a writer -> 500", async () => {
    const res = await request.post("/upload-new/nopewriter").query({ stop: true });
    expect(res.status).toBe(500);
  });

  it("valid mission + filename/size -> creates writer + 200 with id/received", async () => {
    const res = await request
      .post("/upload-new/upKey")
      .query({ filename: "f.txt", size: 0 });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("new-id");
    expect(res.body.data.received).toEqual([]);
  });
});

describe("http_router POST /upload-piece/:id", () => {
  // Real multipart piece writes require formidable fixtures; here we assert the
  // file-presence gating that runs before the writer lookup + write.
  it("no file body -> 500 (gating, no writer touched)", async () => {
    const res = await request.post("/upload-piece/writer1").send({});
    expect(res.status).toBe(500);
  });
});
