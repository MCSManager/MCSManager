import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncPathOwnershipWithinRoot } from "./file_ownership";

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

  it("does not chown an already-correct 0600 file or directory", async () => {
    const chown = vi.spyOn(fs, "fchown");
    await syncPathOwnershipWithinRoot(workspace, path.join(workspace, "file"), ownership);
    await syncPathOwnershipWithinRoot(workspace, workspace, ownership);
    expect(chown).not.toHaveBeenCalled();
    expect((await fs.stat(path.join(workspace, "file"))).mode & 0o777).toBe(0o600);
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
      syncPathOwnershipWithinRoot(workspace, path.join(workspace, "file"), ownership)
    ).rejects.toThrow();
    expect(chown).not.toHaveBeenCalled();
  });
});
