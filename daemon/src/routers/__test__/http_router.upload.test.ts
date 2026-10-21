import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../service/log", () => ({ default: { info: vi.fn(), error: vi.fn() } }));
vi.mock("../../service/system_instance", () => ({ default: { getInstance: vi.fn() } }));
vi.mock("../../service/mission_passport", () => ({
  missionPassport: { getMission: vi.fn(), deleteMission: vi.fn() }
}));
vi.mock("../../service/upload_manager", () => ({ default: { delete: vi.fn() } }));
vi.mock("../../tools/file_ownership", async () => ({
  ...(await vi.importActual<object>("../../tools/file_ownership")),
  resolveInstanceFileOwnership: vi.fn()
}));

import router from "../http_router";
import InstanceSubsystem from "../../service/system_instance";
import { missionPassport } from "../../service/mission_passport";
import { resolveInstanceFileOwnership } from "../../tools/file_ownership";
import FileWriter from "../../entity/file_writer";
import type Instance from "../../entity/instance/instance";

describe.skipIf(process.platform !== "linux")("legacy upload ownership", () => {
  let root: string;
  let workspace: string;
  let instance: Instance;
  const ownership = { uid: process.getuid?.() ?? 0, gid: process.getgid?.() ?? 0, rootless: true };
  const handler = router.stack.find((layer) => layer.path === "/upload/:key")!.stack[0];

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-legacy-owner-"));
    workspace = path.join(root, "workspace");
    await fs.mkdir(workspace);
    await fs.writeFile(path.join(workspace, "actual"), "original");
    await fs.symlink("actual", path.join(workspace, "link"));
    instance = { absoluteCwdPath: () => workspace } as Instance;
    vi.mocked(InstanceSubsystem.getInstance).mockReturnValue(instance);
    vi.mocked(missionPassport.getMission).mockReturnValue({
      parameter: { instanceUuid: "test", uploadDir: "." }
    } as any);
    vi.mocked(missionPassport.deleteMission).mockClear();
    vi.mocked(resolveInstanceFileOwnership).mockResolvedValue(ownership);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.remove(root);
  });

  async function upload(filename: string, data: Buffer, size = data.length) {
    const temporary = path.join(root, "parser-upload");
    await fs.writeFile(temporary, data);
    const ctx = {
      params: { key: "test-passport" },
      query: {},
      request: { files: { file: { originalFilename: filename, filepath: temporary, size } } },
      body: undefined,
      status: 200
    };
    await handler(ctx as any, async () => {});
    return ctx;
  }

  it.each([0, 4, 200000])("preserves an internal link for a %s-byte upload", async (size) => {
    const data = Buffer.alloc(size, "x");
    expect((await upload("link", data)).body).toBe("OK");
    expect(await fs.readFile(path.join(workspace, "actual"))).toEqual(data);
    expect((await fs.lstat(path.join(workspace, "link"))).isSymbolicLink()).toBe(true);
    expect(missionPassport.deleteMission).toHaveBeenCalledWith("test-passport", "upload");
  });

  it("retains Rootful replacement semantics", async () => {
    vi.mocked(resolveInstanceFileOwnership).mockResolvedValue(undefined);
    expect((await upload("link", Buffer.from("new"))).body).toBe("OK");
    expect((await fs.lstat(path.join(workspace, "link"))).isSymbolicLink()).toBe(false);
    expect(await fs.readFile(path.join(workspace, "actual"), "utf8")).toBe("original");
  });

  it("keeps new uploads private", async () => {
    expect((await upload("new-upload", Buffer.from("private"))).body).toBe("OK");
    expect((await fs.stat(path.join(workspace, "new-upload"))).mode & 0o777).toBe(0o600);
  });

  it("shares the chunked-upload inode lock without truncating an active upload", async () => {
    const writer = new FileWriter(
      instance,
      "actual",
      4,
      false,
      "utf-8",
      path.join(workspace, "actual")
    );
    try {
      await writer.init();
      await writer.write(0, Buffer.from("ok"));
      expect((await upload("link", Buffer.from("fail"))).status).toBe(500);
      expect(missionPassport.deleteMission).not.toHaveBeenCalled();
      await writer.write(2, Buffer.from("ay"));
      expect(await fs.readFile(path.join(workspace, "actual"), "utf8")).toBe("okay");
    } finally {
      await writer.stop();
    }
  });

  it("rejects an external link without modifying its target", async () => {
    await fs.writeFile(path.join(root, "outside"), "other instance");
    await fs.symlink(path.join(root, "outside"), path.join(workspace, "escape"));
    expect((await upload("escape", Buffer.from("fail"))).status).toBe(500);
    expect(await fs.readFile(path.join(root, "outside"), "utf8")).toBe("other instance");
    expect(missionPassport.deleteMission).not.toHaveBeenCalled();
  });

  it("rejects incomplete source data and removes only the partial target", async () => {
    expect((await upload("link", Buffer.from("short"), 10)).status).toBe(500);
    expect(await fs.pathExists(path.join(workspace, "actual"))).toBe(false);
    expect((await fs.lstat(path.join(workspace, "link"))).isSymbolicLink()).toBe(true);
    expect(missionPassport.deleteMission).not.toHaveBeenCalled();
  });
});
