import fs from "fs-extra";
import promises from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openOwnedWriteFile } from "./owned_write_file";
import FileManager from "../service/system_file";

describe.skipIf(process.platform !== "linux")("owned content writes", () => {
  let workspace: string;
  let outside: string;
  const ownership = { uid: process.getuid?.() ?? 0, gid: process.getgid?.() ?? 0, rootless: true };

  beforeEach(async () => {
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-owned-write-"));
    outside = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-owned-outside-"));
    await fs.writeFile(path.join(workspace, "config"), "original");
    await fs.writeFile(path.join(outside, "config"), "other tenant");
    await fs.symlink("config", path.join(workspace, "link"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.remove(workspace);
    await fs.remove(outside);
  });

  it("edits the internal target and preserves the symlink", async () => {
    const files = new FileManager(workspace, "utf-8", async () => ownership);
    await files.edit("link", "edited");
    expect(await fs.readFile(path.join(workspace, "config"), "utf8")).toBe("edited");
    expect((await fs.lstat(path.join(workspace, "link"))).isSymbolicLink()).toBe(true);
  });

  it("keeps writes and cleanup anchored when a parent is replaced", async () => {
    await fs.mkdir(path.join(workspace, "parent"));
    const target = await openOwnedWriteFile(
      workspace,
      path.join(workspace, "parent/config"),
      ownership
    );
    try {
      await fs.rename(path.join(workspace, "parent"), path.join(workspace, "moved"));
      await fs.symlink(outside, path.join(workspace, "parent"));
      await target.file.writeFile("owned");
      expect(await fs.readFile(path.join(workspace, "moved/config"), "utf8")).toBe("owned");
      await target.remove();
      expect(await fs.pathExists(path.join(workspace, "moved/config"))).toBe(false);
      expect(await fs.readFile(path.join(outside, "config"), "utf8")).toBe("other tenant");
    } finally {
      await target.close();
    }
  });

  it("does not remove a replacement inode during cancellation", async () => {
    const filename = path.join(workspace, "config");
    const target = await openOwnedWriteFile(workspace, filename, ownership);
    try {
      await fs.rename(filename, path.join(workspace, "old"));
      await fs.writeFile(filename, "replacement");
      await target.remove();
      expect(await fs.readFile(filename, "utf8")).toBe("replacement");
    } finally {
      await target.close();
    }
    await target.close();
    await expect(target.remove()).rejects.toThrow();
  });

  it("rejects external links, lexical escapes, cycles and non-files", async () => {
    await fs.symlink(path.join(outside, "config"), path.join(workspace, "escape"));
    await fs.symlink("cycle", path.join(workspace, "cycle"));
    await fs.mkdir(path.join(workspace, "directory"));
    for (const filename of ["escape", "cycle", "directory", "../outside"]) {
      await expect(
        openOwnedWriteFile(workspace, path.join(workspace, filename), ownership)
      ).rejects.toThrow();
    }
    expect(await fs.readFile(path.join(outside, "config"), "utf8")).toBe("other tenant");
  });

  it.each(["parent", "leaf"])(
    "rejects a %s swapped to an external link before opening",
    async (swap) => {
      const parent = path.join(workspace, "parent");
      await fs.mkdir(parent);
      await fs.writeFile(path.join(parent, "config"), "private");
      const originalOpen = promises.open;
      let replaced = false;
      vi.spyOn(promises, "open").mockImplementation(async (filename, ...args) => {
        if (
          !replaced &&
          String(filename).endsWith(swap === "parent" ? "/parent" : "/config") &&
          String(filename).startsWith("/proc/self/fd/")
        ) {
          replaced = true;
          if (swap === "parent") {
            await fs.rename(parent, path.join(workspace, "old"));
            await fs.symlink(outside, parent);
          } else {
            await fs.unlink(path.join(parent, "config"));
            await fs.symlink(path.join(outside, "config"), path.join(parent, "config"));
          }
        }
        return originalOpen(filename, ...args);
      });
      await expect(
        openOwnedWriteFile(workspace, path.join(parent, "config"), ownership)
      ).rejects.toThrow();
      expect(replaced).toBe(true);
      expect(await fs.readFile(path.join(outside, "config"), "utf8")).toBe("other tenant");
    }
  );

  it("closes descriptors and preserves contents after an ownership failure", async () => {
    const sample = await promises.open(path.join(workspace, "config"), "r");
    const prototype = Object.getPrototypeOf(sample);
    await sample.close();
    vi.spyOn(prototype, "chown").mockRejectedValue(
      Object.assign(new Error("denied"), { code: "EPERM" })
    );
    const open = promises.open;
    const handles: import("fs/promises").FileHandle[] = [];
    vi.spyOn(promises, "open").mockImplementation(async (...args) => {
      const handle = await open(...args);
      handles.push(handle);
      return handle;
    });
    await expect(
      openOwnedWriteFile(workspace, path.join(workspace, "link"), {
        ...ownership,
        uid: ownership.uid + 1
      })
    ).rejects.toThrow();
    expect(handles.length).toBeGreaterThan(0);
    expect(handles.every((handle) => handle.fd === -1)).toBe(true);
    expect(await fs.readFile(path.join(workspace, "config"), "utf8")).toBe("original");
  });

  it("creates owned parents for a dangling internal link", async () => {
    await fs.symlink("new/nested/config", path.join(workspace, "dangling"));
    const target = await openOwnedWriteFile(workspace, path.join(workspace, "dangling"), ownership);
    try {
      await target.file.writeFile("new");
      expect(await fs.readFile(path.join(workspace, "new/nested/config"), "utf8")).toBe("new");
      for (const name of ["new", "new/nested", "new/nested/config"]) {
        expect(await fs.stat(path.join(workspace, name))).toMatchObject({
          uid: ownership.uid,
          gid: ownership.gid
        });
      }
    } finally {
      await target.close();
    }
  });

  it.skipIf(process.getuid?.() === 0)(
    "does not truncate when ownership cannot be corrected",
    async () => {
      await expect(
        openOwnedWriteFile(workspace, path.join(workspace, "link"), {
          ...ownership,
          uid: ownership.uid + 1
        })
      ).rejects.toThrow();
      expect(await fs.readFile(path.join(workspace, "config"), "utf8")).toBe("original");
    }
  );
});
