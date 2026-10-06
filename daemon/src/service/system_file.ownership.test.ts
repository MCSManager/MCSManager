import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FileManager from "./system_file";
import { decompress } from "../common/compress";

vi.mock("../common/compress", () => ({
  decompress: vi.fn(async () => true),
  compress: vi.fn(async () => true),
  listArchiveEntries: vi.fn(async () => [])
}));

describe.skipIf(process.platform !== "linux")("file manager ownership boundaries", () => {
  let workspace: string;
  beforeEach(async () => {
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-files-owner-"));
    await fs.writeFile(path.join(workspace, "existing"), "original", { mode: 0o600 });
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.remove(workspace);
  });

  it("resolves ownership before creating files, directories, copies or editing", async () => {
    const resolver = vi.fn(async () => {
      throw new Error("unsupported mapping");
    });
    const files = new FileManager(workspace, "utf-8", resolver);
    await expect(files.newFile("nested/new")).rejects.toThrow("unsupported mapping");
    await expect(files.mkdir("new-directory")).rejects.toThrow("unsupported mapping");
    await expect(files.copy("existing", "copy")).rejects.toThrow("unsupported mapping");
    await expect(files.edit("existing", "overwritten")).rejects.toThrow("unsupported mapping");
    expect(await fs.readdir(workspace)).toEqual(["existing"]);
    expect(await fs.readFile(path.join(workspace, "existing"), "utf8")).toBe("original");
  });

  it("preserves private file mode when editing and handles nested creation and copy", async () => {
    const resolver = vi.fn(async () => ({ uid: process.getuid!(), gid: process.getgid!() }));
    const files = new FileManager(workspace, "utf-8", resolver);
    await files.edit("existing", "edited");
    await files.newFile("nested/new");
    await files.copy("nested", "copy");
    await files.mkdir("another/nested");
    expect(await fs.readFile(path.join(workspace, "existing"), "utf8")).toBe("edited");
    expect((await fs.stat(path.join(workspace, "existing"))).mode & 0o777).toBe(0o600);
    expect(await fs.pathExists(path.join(workspace, "copy/new"))).toBe(true);
    expect(resolver).toHaveBeenCalledTimes(4);
  });

  it("rechecks containment after asynchronous ownership verification", async () => {
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-other-tenant-"));
    try {
      await fs.mkdir(path.join(workspace, "nested"));
      const files = new FileManager(workspace, "utf-8", async () => {
        await fs.remove(path.join(workspace, "nested"));
        await fs.symlink(outside, path.join(workspace, "nested"));
        return { uid: process.getuid!(), gid: process.getgid!() };
      });
      await expect(files.newFile("nested/escaped")).rejects.toThrow();
      expect(await fs.readdir(outside)).toEqual([]);
    } finally {
      await fs.remove(outside);
    }
  });

  it("copies a wide directory without walking existing destination-only entries", async () => {
    await fs.mkdir(path.join(workspace, "source"));
    await fs.mkdir(path.join(workspace, "destination"));
    await fs.writeFile(path.join(workspace, "destination/untouched"), "keep");
    for (let i = 0; i < 128; i++)
      await fs.writeFile(path.join(workspace, "source", String(i)), "data");
    const files = new FileManager(workspace, "utf-8", async () => ({
      uid: process.getuid!(),
      gid: process.getgid!()
    }));
    const copy = vi.spyOn(fs, "copy");
    await files.copy("source", "destination");
    expect(copy).toHaveBeenCalledTimes(128);
    expect(await fs.readdir(path.join(workspace, "destination"))).toHaveLength(129);
    expect(await fs.readFile(path.join(workspace, "destination/untouched"), "utf8")).toBe("keep");
    expect(copy.mock.calls.every(([, , options]) => options === undefined)).toBe(true);
  });

  it("rejects source-to-child copies and outward links without writing outside", async () => {
    await fs.mkdir(path.join(workspace, "source"));
    const files = new FileManager(workspace, "utf-8", async () => ({
      uid: process.getuid!(),
      gid: process.getgid!()
    }));
    await expect(files.copy("source", "source/child")).rejects.toThrow();
    await fs.symlink(os.tmpdir(), path.join(workspace, "source/outward"));
    await expect(files.copy("source", "destination")).rejects.toThrow();
    expect(await fs.pathExists(path.join(workspace, "destination/outward"))).toBe(false);
  });

  it("rejects ambiguous archive paths before invoking any extractor", async () => {
    const files = new FileManager(workspace);
    await fs.writeFile(path.join(workspace, "archive.7z"), "fixture");
    vi.spyOn(files as any, "getArchiveEntries").mockResolvedValue([
      { name: "mods\\config\\data.json", isDirectory: false }
    ]);
    const extractor = vi.mocked(decompress);
    extractor.mockClear();
    await expect(
      files.unzip("archive.7z", ".", "utf-8", {
        uid: process.getuid!(),
        gid: process.getgid!(),
        rootless: true
      })
    ).rejects.toThrow();
    expect(extractor).not.toHaveBeenCalled();
  });

  it("preserves literal backslash ownership paths for non-Rootless extraction", async () => {
    const files = new FileManager(workspace);
    await fs.writeFile(path.join(workspace, "archive.7z"), "fixture");
    const name = "mods\\config\\data.json";
    vi.spyOn(files as any, "getArchiveEntries").mockResolvedValue([{ name, isDirectory: false }]);
    vi.mocked(decompress).mockImplementationOnce(async () => {
      await fs.writeFile(path.join(workspace, name), "literal");
      return true;
    });
    await files.unzip("archive.7z", ".", "utf-8", {
      uid: process.getuid!(),
      gid: process.getgid!()
    });
    expect((await fs.stat(path.join(workspace, name))).uid).toBe(process.getuid!());
  });

  it("synchronizes extracted partial files and parents even when the extractor fails", async () => {
    const files = new FileManager(workspace);
    await fs.writeFile(path.join(workspace, "archive.7z"), "fixture");
    vi.spyOn(files as any, "getArchiveEntries").mockResolvedValue([
      { name: "mods/config/data.json", isDirectory: false }
    ]);
    vi.mocked(decompress).mockImplementationOnce(async () => {
      await fs.outputFile(path.join(workspace, "mods/config/data.json"), "partial");
      throw new Error("extractor failed");
    });
    const chown = vi.spyOn(fs, "fchown").mockResolvedValue(undefined);
    await expect(
      files.unzip("archive.7z", ".", "utf-8", {
        uid: process.getuid!() + 1,
        gid: process.getgid!(),
        rootless: true
      })
    ).rejects.toThrow("extractor failed");
    expect(chown).toHaveBeenCalledTimes(3);
    expect(chown.mock.calls.every(([, uid]) => uid === process.getuid!() + 1)).toBe(true);
  });
});
