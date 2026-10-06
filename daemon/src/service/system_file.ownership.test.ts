import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FileManager from "./system_file";

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
});
