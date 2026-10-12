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
    await expect(files.move("existing", "new/nested/file")).rejects.toThrow("unsupported mapping");
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

  const currentOwnership = async () => ({ uid: process.getuid!(), gid: process.getgid!() });

  it("moves files into owned nested parents while preserving private mode", async () => {
    const chown = vi.spyOn(fs, "fchown").mockResolvedValue(undefined);
    const files = new FileManager(workspace, "utf-8", async () => ({
      uid: process.getuid!() + 1,
      gid: process.getgid!(),
      rootless: true
    }));
    await files.move("existing", "new/nested/file");
    expect(await fs.pathExists(path.join(workspace, "existing"))).toBe(false);
    expect(await fs.readFile(path.join(workspace, "new/nested/file"), "utf8")).toBe("original");
    expect((await fs.stat(path.join(workspace, "new/nested/file"))).mode & 0o777).toBe(0o600);
    expect(chown).toHaveBeenCalledTimes(3);
  });

  it("uses bounded ownership-aware copy on EXDEV and removes the source after success", async () => {
    await fs.outputFile(path.join(workspace, "source/deep/file"), "copied", { mode: 0o600 });
    const files = new FileManager(workspace, "utf-8", currentOwnership);
    vi.spyOn(fs, "rename").mockRejectedValue(
      Object.assign(new Error("cross-device"), { code: "EXDEV" })
    );
    const copy = vi.spyOn(fs, "copy");
    await files.move("source", "new/nested/tree");
    expect(await fs.pathExists(path.join(workspace, "source"))).toBe(false);
    expect(await fs.readFile(path.join(workspace, "new/nested/tree/deep/file"), "utf8")).toBe(
      "copied"
    );
    expect(copy).toHaveBeenCalledTimes(1);
    expect(copy.mock.calls[0][2]).toMatchObject({ overwrite: false, errorOnExist: true });
    expect((await fs.stat(path.join(workspace, "new/nested/tree/deep/file"))).mode & 0o777).toBe(
      0o600
    );
  });

  it.each(["copy", "ownership"])("keeps the EXDEV source when %s fails", async (failure) => {
    const files = new FileManager(workspace, "utf-8", async () => ({
      ...(await currentOwnership()),
      uid: process.getuid!() + (failure === "ownership" ? 1 : 0)
    }));
    vi.spyOn(fs, "rename").mockRejectedValue(
      Object.assign(new Error("cross-device"), { code: "EXDEV" })
    );
    if (failure === "copy") vi.spyOn(fs, "copy").mockRejectedValue(new Error("copy failed"));
    else
      vi.spyOn(fs, "open").mockRejectedValue(
        Object.assign(new Error("denied"), { code: "EACCES" })
      );
    await expect(files.move("existing", "moved")).rejects.toThrow();
    expect(await fs.readFile(path.join(workspace, "existing"), "utf8")).toBe("original");
  });

  it("rejects existing destinations, workspace moves and source-to-child moves", async () => {
    const files = new FileManager(workspace, "utf-8", currentOwnership);
    await fs.mkdir(path.join(workspace, "source"));
    await fs.symlink("missing", path.join(workspace, "broken"));
    const rename = vi.spyOn(fs, "rename");
    await expect(files.move("existing", "source")).rejects.toThrow();
    await expect(files.move("existing", "broken")).rejects.toThrow();
    await expect(files.move("source", "source/child")).rejects.toThrow();
    await expect(files.move(".", "new-root")).rejects.toThrow();
    expect(rename).not.toHaveBeenCalled();
    expect(await fs.readFile(path.join(workspace, "existing"), "utf8")).toBe("original");
  });

  it("rechecks move containment after asynchronous ownership resolution", async () => {
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-move-other-"));
    try {
      await fs.mkdir(path.join(workspace, "nested"));
      const files = new FileManager(workspace, "utf-8", async () => {
        await fs.remove(path.join(workspace, "nested"));
        await fs.symlink(outside, path.join(workspace, "nested"));
        return currentOwnership();
      });
      await expect(files.move("existing", "nested/escaped")).rejects.toThrow();
      expect(await fs.readdir(outside)).toEqual([]);
      expect(await fs.readFile(path.join(workspace, "existing"), "utf8")).toBe("original");
    } finally {
      await fs.remove(outside);
    }
  });

  it("does not rename the source when parent ownership cannot be corrected", async () => {
    const files = new FileManager(workspace, "utf-8", async () => ({
      uid: process.getuid!() + 1,
      gid: process.getgid!()
    }));
    vi.spyOn(fs, "fchown").mockRejectedValue(Object.assign(new Error("denied"), { code: "EPERM" }));
    const rename = vi.spyOn(fs, "rename");
    await expect(files.move("existing", "new/nested/file")).rejects.toThrow();
    expect(rename).not.toHaveBeenCalled();
    expect(await fs.readFile(path.join(workspace, "existing"), "utf8")).toBe("original");
  });

  it.each(["copy", "move"] as const)(
    "rejects deep-to-shallow symlink relocation during %s",
    async (operation) => {
      await fs.mkdirp(path.join(workspace, "a/b"));
      await fs.writeFile(path.join(workspace, "inside"), "safe");
      await fs.symlink("../../inside", path.join(workspace, "a/b/link"));
      const files = new FileManager(workspace, "utf-8", currentOwnership);
      await expect(files[operation]("a/b", "d")).rejects.toThrow();
      expect(await fs.readlink(path.join(workspace, "a/b/link"))).toBe("../../inside");
      expect(await fs.pathExists(path.join(workspace, "d/link"))).toBe(false);
    }
  );

  it.each(["copy", "move"] as const)(
    "preserves internal relative symlinks during %s",
    async (operation) => {
      await fs.mkdirp(path.join(workspace, "source"));
      await fs.writeFile(path.join(workspace, "source/file"), "linked");
      await fs.symlink("file", path.join(workspace, "source/link"));
      const files = new FileManager(workspace, "utf-8", currentOwnership);
      await files[operation]("source", "destination");
      expect(await fs.readlink(path.join(workspace, "destination/link"))).toBe("file");
      expect(await fs.readFile(path.join(workspace, "destination/link"), "utf8")).toBe("linked");
    }
  );

  it("retains the existing fs-extra move path when ownership is disabled", async () => {
    const move = vi.spyOn(fs, "move");
    await new FileManager(workspace).move("existing", "new/file");
    expect(move).toHaveBeenCalledTimes(1);
    expect(await fs.readFile(path.join(workspace, "new/file"), "utf8")).toBe("original");
  });

  it.each(["copy", "move"] as const)(
    "preserves read-only directory modes during %s",
    async (operation) => {
      await fs.outputFile(path.join(workspace, "readonly/file"), "private");
      await fs.chmod(path.join(workspace, "readonly"), 0o500);
      if (operation === "move")
        vi.spyOn(fs, "rename").mockRejectedValue(
          Object.assign(new Error("cross-device"), { code: "EXDEV" })
        );
      try {
        const files = new FileManager(workspace, "utf-8", currentOwnership);
        if (operation === "move") {
          // An unprivileged owner cannot unlink children from a read-only source directory.
          await expect(files.move("readonly", "destination")).rejects.toMatchObject({
            code: "EACCES"
          });
          expect(await fs.readFile(path.join(workspace, "readonly/file"), "utf8")).toBe("private");
        } else await files.copy("readonly", "destination");
        expect(await fs.readFile(path.join(workspace, "destination/file"), "utf8")).toBe("private");
        expect((await fs.stat(path.join(workspace, "destination"))).mode & 0o777).toBe(0o500);
      } finally {
        for (const entry of ["readonly", "destination"])
          if (await fs.pathExists(path.join(workspace, entry)))
            await fs.chmod(path.join(workspace, entry), 0o700);
      }
    }
  );

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

  it("closes an unverified destination descriptor without changing its mode", async () => {
    await fs.outputFile(path.join(workspace, "source/file"), "data");
    const fstat = fs.fstat.bind(fs);
    vi.spyOn(fs, "fstat").mockImplementation(async (fd) => {
      const info = await fstat(fd);
      info.ino++;
      return info;
    });
    const chmod = vi.spyOn(fs, "fchmod");
    const close = vi.spyOn(fs, "close");
    await expect(
      new FileManager(workspace, "utf-8", currentOwnership).copy("source", "destination")
    ).rejects.toThrow();
    expect(chmod).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
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
