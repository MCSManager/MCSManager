import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prepareRootlessBindSource } from "./docker_bind_mount";

describe.skipIf(process.platform !== "linux")("Rootless extra bind ownership", () => {
  let root: string;
  let workspace: string;
  const ownership = { uid: process.getuid!(), gid: process.getgid!(), rootless: true };

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-bind-"));
    workspace = path.join(root, "workspace");
    await fs.mkdir(workspace);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.remove(root);
  });

  it("creates nested internal directories with the requested owner", async () => {
    const target = path.join(workspace, "new/nested/config");
    await prepareRootlessBindSource(workspace, target, ownership);
    for (const entry of ["new", "new/nested", "new/nested/config"]) {
      const info = await fs.stat(path.join(workspace, entry));
      expect(info.isDirectory()).toBe(true);
      expect([info.uid, info.gid]).toEqual([ownership.uid, ownership.gid]);
    }
  });

  it("synchronizes every created parent and the bind root, not its children", async () => {
    const target = path.join(workspace, "new/nested/config");
    const chown = vi.spyOn(fs, "fchown").mockResolvedValue(undefined);
    await prepareRootlessBindSource(workspace, target, {
      ...ownership,
      uid: ownership.uid + 1
    });
    expect(chown).toHaveBeenCalledTimes(3);
    for (const args of chown.mock.calls)
      expect(args.slice(1)).toEqual([ownership.uid + 1, ownership.gid]);
    await fs.writeFile(path.join(target, "child"), "untouched");
    chown.mockClear();
    await prepareRootlessBindSource(workspace, target, { ...ownership, uid: ownership.uid + 1 });
    expect(chown).toHaveBeenCalledTimes(3);
  });

  it("handles an existing internal file without changing its mode", async () => {
    const target = path.join(workspace, "config");
    await fs.writeFile(target, "private", { mode: 0o600 });
    await prepareRootlessBindSource(workspace, target, ownership);
    expect(await fs.readFile(target, "utf8")).toBe("private");
    expect((await fs.stat(target)).mode & 0o777).toBe(0o600);
  });

  it("preserves external directories, files and aliases without any mutation", async () => {
    const external = path.join(root, "admin-owned");
    await fs.mkdir(external, { mode: 0o700 });
    await fs.writeFile(path.join(external, "file"), "admin", { mode: 0o600 });
    const alias = path.join(root, "alias");
    await fs.symlink(workspace, alias);
    const chown = vi.spyOn(fs, "fchown");
    const mkdir = vi.spyOn(fs, "mkdir");
    const chmod = vi.spyOn(fs, "chmod");
    const differentOwner = { ...ownership, uid: ownership.uid + 1 };
    for (const source of [external, path.join(external, "file"), alias]) {
      const before = await fs.stat(source);
      await prepareRootlessBindSource(workspace, source, differentOwner);
      const after = await fs.stat(source);
      expect([after.uid, after.gid, after.mode]).toEqual([before.uid, before.gid, before.mode]);
    }
    expect(chown).not.toHaveBeenCalled();
    expect(mkdir).not.toHaveBeenCalled();
    expect(chmod).not.toHaveBeenCalled();
  });

  it("rejects a missing external source without creating even its parents", async () => {
    const source = path.join(root, "missing/nested");
    await expect(prepareRootlessBindSource(workspace, source, ownership)).rejects.toThrow();
    expect(await fs.pathExists(path.join(root, "missing"))).toBe(false);
  });

  it("rejects outward and dangling internal symlinks before mkdir or chown", async () => {
    await fs.mkdir(path.join(root, "external"));
    await fs.symlink(path.join(root, "external"), path.join(workspace, "outward"));
    await fs.symlink("missing", path.join(workspace, "dangling"));
    const mkdir = vi.spyOn(fs, "mkdir");
    const chown = vi.spyOn(fs, "fchown");
    for (const source of ["outward", "outward/new", "dangling", "dangling/new"]) {
      await expect(
        prepareRootlessBindSource(workspace, path.join(workspace, source), ownership)
      ).rejects.toThrow();
    }
    expect(mkdir).not.toHaveBeenCalled();
    expect(chown).not.toHaveBeenCalled();
    expect(await fs.pathExists(path.join(root, "external/new"))).toBe(false);
  });

  it("synchronizes an internal alias's actual directory and new parents", async () => {
    await fs.mkdir(path.join(workspace, "actual"));
    await fs.symlink("actual", path.join(workspace, "alias"));
    const chown = vi.spyOn(fs, "fchown").mockResolvedValue(undefined);
    await prepareRootlessBindSource(workspace, path.join(workspace, "alias/nested"), {
      ...ownership,
      uid: ownership.uid + 1
    });
    expect(chown).toHaveBeenCalledTimes(2);
    expect((await fs.lstat(path.join(workspace, "alias"))).isSymbolicLink()).toBe(true);
    expect((await fs.stat(path.join(workspace, "actual/nested"))).isDirectory()).toBe(true);
  });

  it("rejects an alias replaced during directory preparation", async () => {
    const actual = path.join(workspace, "actual");
    const alias = path.join(workspace, "alias");
    const external = path.join(root, "external");
    await fs.mkdir(actual);
    await fs.mkdir(external);
    await fs.symlink("actual", alias);
    const originalMkdir = fs.mkdir;
    vi.spyOn(fs, "mkdir").mockImplementation(async (...args: Parameters<typeof fs.mkdir>) => {
      const result = await originalMkdir(...args);
      await fs.unlink(alias);
      await fs.symlink(external, alias);
      return result;
    });
    await expect(prepareRootlessBindSource(workspace, alias, ownership)).rejects.toThrow();
    expect(await fs.readdir(external)).toEqual([]);
  });

  it.each(["EPERM", "EACCES"])("reports ownership failure %s", async (code) => {
    vi.spyOn(fs, "fchown").mockRejectedValue(Object.assign(new Error("denied"), { code }));
    await expect(
      prepareRootlessBindSource(workspace, path.join(workspace, "new"), {
        ...ownership,
        uid: ownership.uid + 1
      })
    ).rejects.toThrow();
  });

  it("rejects relative and symlink/.. source syntax", async () => {
    for (const source of ["relative", workspace + "/alias/../config"]) {
      await expect(prepareRootlessBindSource(workspace, source, ownership)).rejects.toThrow();
    }
  });
});
