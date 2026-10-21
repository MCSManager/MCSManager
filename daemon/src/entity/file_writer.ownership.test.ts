import fs from "fs-extra";
import os from "os";
import path from "path";
import * as lockfile from "proper-lockfile";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../service/log", () => ({ default: { info: vi.fn(), error: vi.fn() } }));
vi.mock("../service/upload_manager", () => ({ default: { delete: vi.fn() } }));
vi.mock("proper-lockfile", async () => {
  const actual = await vi.importActual<typeof import("proper-lockfile")>("proper-lockfile");
  return { ...actual, lock: vi.fn(actual.lock) };
});
vi.mock("../tools/file_ownership", async () => ({
  ...(await vi.importActual<object>("../tools/file_ownership")),
  resolveInstanceFileOwnership: vi.fn(async () => ({
    uid: process.getuid!(),
    gid: process.getgid!(),
    rootless: true
  }))
}));

import FileWriter from "./file_writer";
import type Instance from "./instance/instance";
import uploadManager from "../service/upload_manager";

describe.skipIf(process.platform !== "linux")("owned chunked uploads", () => {
  let workspace: string;
  let writers: FileWriter[];
  beforeEach(async () => {
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-chunk-owner-"));
    writers = [];
    vi.mocked(uploadManager.delete).mockClear();
    await fs.writeFile(path.join(workspace, "actual"), "original");
    await fs.symlink("actual", path.join(workspace, "link"));
  });
  afterEach(async () => {
    for (const writer of writers) await writer.stop();
    vi.restoreAllMocks();
    await fs.remove(workspace);
  });
  function create(filename: string) {
    const instance = { absoluteCwdPath: () => workspace } as Instance;
    const writer = new FileWriter(
      instance,
      filename,
      4,
      false,
      "utf-8",
      path.join(workspace, filename)
    );
    writer.id = filename;
    writers.push(writer);
    return writer;
  }

  it("writes the real target and preserves the link after completion and stop", async () => {
    const writer = create("link");
    await writer.init();
    await writer.write(0, Buffer.from("done"));
    await writer.stop();
    expect(await fs.readFile(path.join(workspace, "actual"), "utf8")).toBe("done");
    expect((await fs.lstat(path.join(workspace, "link"))).isSymbolicLink()).toBe(true);
    expect(uploadManager.delete).toHaveBeenCalledWith("link");
  });

  it("locks aliases to the same inode before truncating", async () => {
    const writer = create("link");
    await writer.init();
    await writer.write(0, Buffer.from("ok"));
    const alias = create("actual");
    await expect(alias.init()).rejects.toThrow();
    expect((await fs.readFile(path.join(workspace, "actual"))).subarray(0, 2).toString()).toBe(
      "ok"
    );
    await writer.write(2, Buffer.from("ay"));
    expect(await fs.readFile(path.join(workspace, "actual"), "utf8")).toBe("okay");
  });

  it("creates private files without changing existing file modes", async () => {
    const writer = create("new-upload");
    await writer.init();
    await writer.write(0, Buffer.from("done"));
    expect((await fs.stat(path.join(workspace, "new-upload"))).mode & 0o777).toBe(0o600);
    await fs.chmod(path.join(workspace, "actual"), 0o640);
    const existing = create("actual");
    await existing.init();
    await existing.write(0, Buffer.from("done"));
    expect((await fs.stat(path.join(workspace, "actual"))).mode & 0o777).toBe(0o640);
  });

  it.each(["lock", "truncate"])("cleans newly created files after %s failure", async (failure) => {
    if (failure === "lock") vi.spyOn(lockfile, "lock").mockRejectedValue(new Error("lock failed"));
    else vi.spyOn(fs, "ftruncate").mockRejectedValue(new Error("truncate failed"));
    await expect(create("new/nested/upload").init()).rejects.toThrow();
    expect(await fs.pathExists(path.join(workspace, "new"))).toBe(false);
    await expect(create("link").init()).rejects.toThrow();
    expect(await fs.readFile(path.join(workspace, "actual"), "utf8")).toBe("original");
  });

  it("does not report success when a game process unlinks the pinned target", async () => {
    const writer = create("link");
    await writer.init();
    await fs.unlink(path.join(workspace, "actual"));
    await expect(writer.write(0, Buffer.from("done"))).rejects.toThrow();
  });

  it("never writes or removes the target of a replaced symlink", async () => {
    const writer = create("link");
    await writer.init();
    await fs.writeFile(path.join(workspace, "other"), "keep");
    await fs.unlink(path.join(workspace, "link"));
    await fs.symlink("other", path.join(workspace, "link"));
    await writer.write(0, Buffer.from("ok"));
    await writer.stop();
    expect(await fs.pathExists(path.join(workspace, "actual"))).toBe(false);
    expect(await fs.readFile(path.join(workspace, "other"), "utf8")).toBe("keep");
    expect(uploadManager.delete).toHaveBeenCalledWith("link");
  });
});
