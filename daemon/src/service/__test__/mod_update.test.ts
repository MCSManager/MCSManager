import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sandbox = { root: "" };
const download = vi.hoisted(() => ({ tasks: [] as any[], downloadFromUrl: vi.fn() }));
vi.mock("../system_instance", () => ({
  default: {
    getInstance: () => ({ absoluteCwdPath: () => sandbox.root, config: { type: "minecraft/java" } })
  }
}));
vi.mock("../download_manager", () => ({
  default: download,
  DOWNLOAD_STATUS: { DOWNLOADING: 0, COMPLETED: 1, ERROR: 2 }
}));
import { ModService } from "../mod_service";

function update(fileName: string, oldFileName = "old.jar", type = "mod") {
  return new ModService().installMod(
    "instance",
    "https://example.com/mod.jar",
    fileName,
    type as any,
    { oldFileName } as any
  );
}
async function complete(_url: string, target: string) {
  await fs.outputFile(target, "replacement");
  download.tasks.push({ path: target, status: 1 });
}
beforeEach(async () => {
  sandbox.root = await fs.mkdtemp(path.join(os.tmpdir(), "mod-update-"));
  await fs.outputFile(path.join(sandbox.root, "mods/old.jar"), "working");
  download.tasks = [];
  download.downloadFromUrl.mockReset().mockImplementation(complete);
});
afterEach(() => fs.remove(sandbox.root));

describe("mod version replacement", () => {
  it("keeps a same-name working jar intact while the download is pending", async () => {
    let finish!: () => Promise<void>;
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    download.downloadFromUrl.mockImplementation(
      (_url: string, target: string) =>
        new Promise<void>((resolve) => {
          fs.outputFile(target, "partial").then(() => {
            finish = async () => {
              await complete(_url, target);
              resolve();
            };
            started();
          });
        })
    );
    const pending = update("old.jar");
    await ready;
    const whileDownloading = await fs.readFile(path.join(sandbox.root, "mods/old.jar"), "utf8");
    await finish();
    await pending;
    expect(whileDownloading).toBe("working");
    expect(await fs.readFile(path.join(sandbox.root, "mods/old.jar"), "utf8")).toBe("replacement");
  });

  it("retains the old version and removes a partial download after failure", async () => {
    download.downloadFromUrl.mockImplementation(async (_url: string, target: string) => {
      await fs.outputFile(target, "partial");
      throw new Error("download failed");
    });
    await expect(update("new.jar")).rejects.toThrow("download failed");
    expect(await fs.readFile(path.join(sandbox.root, "mods/old.jar"), "utf8")).toBe("working");
    expect(await fs.readdir(path.join(sandbox.root, "mods"))).toEqual(["old.jar"]);
  });

  it("does not replace the working jar when cancellation resolves the download promise", async () => {
    download.downloadFromUrl.mockImplementation(async (_url: string, target: string) => {
      await fs.outputFile(target, "partial");
      download.tasks = [];
    });
    await expect(update("old.jar")).rejects.toThrow();
    expect(await fs.readFile(path.join(sandbox.root, "mods/old.jar"), "utf8")).toBe("working");
    expect(await fs.readdir(path.join(sandbox.root, "mods"))).toEqual(["old.jar"]);
  });

  it("removes the old version only after installing the completed replacement", async () => {
    await update("new.jar");
    expect(await fs.readdir(path.join(sandbox.root, "mods"))).toEqual(["new.jar"]);
    expect(await fs.readFile(path.join(sandbox.root, "mods/new.jar"), "utf8")).toBe("replacement");
  });

  it("does not remove a mod when updating a plugin with the same filename", async () => {
    await fs.outputFile(path.join(sandbox.root, "plugins/old.jar"), "plugin");
    await update("new.jar", "old.jar", "plugin");
    expect(await fs.readFile(path.join(sandbox.root, "mods/old.jar"), "utf8")).toBe("working");
    expect(await fs.readdir(path.join(sandbox.root, "plugins"))).toEqual(["new.jar"]);
  });

  it.each(["../outside.jar", "plugins/../../outside.jar", "config/config.json"])(
    "rejects an invalid old file path: %s",
    async (oldFile) => {
      await expect(update("new.jar", oldFile)).rejects.toThrow();
      expect(download.downloadFromUrl).not.toHaveBeenCalled();
    }
  );

  it("keeps the old version if installing the staged replacement fails", async () => {
    const rename = vi.spyOn(fs, "rename").mockRejectedValueOnce(new Error("file locked"));
    try {
      await expect(update("old.jar")).rejects.toThrow("file locked");
      expect(await fs.readFile(path.join(sandbox.root, "mods/old.jar"), "utf8")).toBe("working");
    } finally {
      rename.mockRestore();
    }
  });
});
