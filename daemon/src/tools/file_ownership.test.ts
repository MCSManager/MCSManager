import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveInstanceFileOwnership, syncPathOwnershipWithinRoot } from "./file_ownership";
import { dockerFileOwnership } from "../service/docker_file_ownership";
import FileManager from "../service/system_file";
import type Instance from "../entity/instance/instance";

describe.skipIf(process.platform !== "linux")("descriptor-based file ownership", () => {
  let workspace: string;
  const ownership = { uid: process.getuid?.() ?? 0, gid: process.getgid?.() ?? 0 };

  beforeEach(async () => {
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-ownership-"));
    await fs.writeFile(path.join(workspace, "file"), "private", { mode: 0o600 });
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.remove(workspace);
  });

  it.skipIf(Boolean(process.env.MCSM_ROOTLESS_DOCKER_CONTAINER))(
    "edits, creates and copies Rootful files without contacting Docker",
    async () => {
      const resolve = vi
        .spyOn(dockerFileOwnership, "resolve")
        .mockRejectedValue(new Error("offline"));
      const instance = {
        config: { processType: "docker", runAs: "1000:1000", docker: { image: "game" } }
      } as Instance;
      const files = new FileManager(workspace, "utf-8", () =>
        resolveInstanceFileOwnership(instance, { rootlessOnly: true })
      );
      await files.edit("file", "edited");
      await files.mkdir("new");
      await files.copy("file", "new/copy");
      expect(await fs.readFile(path.join(workspace, "new/copy"), "utf8")).toBe("edited");
      expect(await resolveInstanceFileOwnership(instance)).toEqual({ uid: 1000, gid: 1000 });
      expect(resolve).not.toHaveBeenCalled();
    }
  );

  it("does not chown an already-correct 0600 file or directory", async () => {
    const chown = vi.spyOn(fs, "fchown");
    const open = vi.spyOn(fs, "open");
    await syncPathOwnershipWithinRoot(workspace, path.join(workspace, "file"), ownership);
    await syncPathOwnershipWithinRoot(workspace, workspace, ownership);
    expect(chown).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect((await fs.stat(path.join(workspace, "file"))).mode & 0o777).toBe(0o600);
  });

  it.each([0o000, 0o200])("does not open an already-owned mode %s file", async (mode) => {
    const target = path.join(workspace, "file");
    await fs.chmod(target, mode);
    const open = vi.spyOn(fs, "open").mockRejectedValue(new Error("No read permission"));
    await syncPathOwnershipWithinRoot(workspace, target, ownership);
    expect(open).not.toHaveBeenCalled();
    expect((await fs.lstat(target)).mode & 0o777).toBe(mode);
  });

  it.each(["EPERM", "EACCES"])("reports %s and closes the descriptor", async (code) => {
    vi.spyOn(fs, "fchown").mockRejectedValue(Object.assign(new Error("denied"), { code }));
    const close = vi.spyOn(fs, "close");
    await expect(
      syncPathOwnershipWithinRoot(workspace, path.join(workspace, "file"), {
        uid: ownership.uid + 1,
        gid: ownership.gid
      })
    ).rejects.toThrow();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("rejects lexical escape and a parent symlink outside the workspace", async () => {
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-outside-"));
    try {
      await fs.writeFile(path.join(outside, "other"), "other tenant");
      await fs.symlink(outside, path.join(workspace, "escape"));
      const chown = vi.spyOn(fs, "fchown");
      await expect(syncPathOwnershipWithinRoot(workspace, outside, ownership)).rejects.toThrow();
      await expect(
        syncPathOwnershipWithinRoot(workspace, path.join(workspace, "escape/other"), ownership)
      ).rejects.toThrow();
      expect(chown).not.toHaveBeenCalled();
    } finally {
      await fs.remove(outside);
    }
  });

  it("does not follow a final symlink or change its target", async () => {
    await fs.symlink("file", path.join(workspace, "link"));
    const chown = vi.spyOn(fs, "fchown");
    await syncPathOwnershipWithinRoot(workspace, path.join(workspace, "link"), {
      uid: ownership.uid + 1,
      gid: ownership.gid
    });
    expect(chown).not.toHaveBeenCalled();
    expect(await fs.readFile(path.join(workspace, "file"), "utf8")).toBe("private");
  });

  it("rejects a replaced inode after opening", async () => {
    const original = fs.fstat;
    vi.spyOn(fs, "fstat").mockImplementation(async (fd: number) => {
      const stat = await original(fd);
      return { ...stat, ino: stat.ino + 1 } as fs.Stats;
    });
    const chown = vi.spyOn(fs, "fchown");
    await expect(
      syncPathOwnershipWithinRoot(workspace, path.join(workspace, "file"), {
        uid: ownership.uid + 1,
        gid: ownership.gid
      })
    ).rejects.toThrow();
    expect(chown).not.toHaveBeenCalled();
  });
});
