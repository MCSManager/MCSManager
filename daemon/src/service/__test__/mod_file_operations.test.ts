import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sandbox = { root: "" };
vi.mock("../system_instance", () => ({
  default: {
    getInstance: () => ({
      absoluteCwdPath: () => sandbox.root,
      config: { type: "minecraft/java" }
    })
  }
}));
vi.mock("../download_manager", () => ({ default: {} }));

import { ModService } from "../mod_service";

beforeEach(async () => {
  sandbox.root = await fs.mkdtemp(path.join(os.tmpdir(), "mod-files-"));
  await fs.outputFile(path.join(sandbox.root, "mods/shared.jar"), "mod");
  await fs.outputFile(path.join(sandbox.root, "plugins/shared.jar"), "plugin");
});
afterEach(() => fs.remove(sandbox.root));

describe("mod file operations", () => {
  it("returns the relative path of each listed file", async () => {
    const result = await new ModService().listMods("instance");
    expect(result.mods.map((mod) => (mod as any).path).sort()).toEqual([
      "mods/shared.jar",
      "plugins/shared.jar"
    ]);
  });

  it("deletes the selected plugin without deleting the mod with the same name", async () => {
    await new ModService().deleteMod("instance", "plugins/shared.jar");
    expect(await fs.readFile(path.join(sandbox.root, "mods/shared.jar"), "utf8")).toBe("mod");
    expect(await fs.pathExists(path.join(sandbox.root, "plugins/shared.jar"))).toBe(false);
  });

  it("toggles only the selected plugin and can enable it again", async () => {
    const service = new ModService();
    await service.toggleMod("instance", "plugins/shared.jar");
    expect(await fs.pathExists(path.join(sandbox.root, "mods/shared.jar"))).toBe(true);
    expect(await fs.readFile(path.join(sandbox.root, "plugins/shared.jar.disabled"), "utf8")).toBe(
      "plugin"
    );
    await service.toggleMod("instance", "plugins/shared.jar.disabled");
    expect(await fs.readFile(path.join(sandbox.root, "plugins/shared.jar"), "utf8")).toBe("plugin");
  });

  it("retains support for legacy bare filenames", async () => {
    await new ModService().deleteMod("instance", "shared.jar");
    expect(await fs.pathExists(path.join(sandbox.root, "mods/shared.jar"))).toBe(false);
    expect(await fs.pathExists(path.join(sandbox.root, "plugins/shared.jar"))).toBe(true);
  });

  it("preserves the directory spelling returned by the scan", async () => {
    await fs.remove(path.join(sandbox.root, "plugins"));
    await fs.outputFile(path.join(sandbox.root, "Plugins/upper.jar"), "upper");
    const service = new ModService();
    const result = await service.listMods("instance");
    const plugin = result.mods.find((mod) => mod.file === "upper.jar") as any;
    await service.deleteMod("instance", plugin.path);
    expect(await fs.pathExists(path.join(sandbox.root, "Plugins/upper.jar"))).toBe(false);
  });

  it.each([
    "../outside.jar",
    "plugins/../server.jar",
    "config/server.jar",
    "plugins/nested/file.jar",
    "plugins\\shared.jar"
  ])("rejects invalid mod paths: %s", async (file) => {
    await expect(new ModService().deleteMod("instance", file)).rejects.toThrow();
  });

  it("rejects a mod directory linked outside the workspace", async () => {
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), "outside-mods-"));
    try {
      await fs.outputFile(path.join(outside, "outside.jar"), "outside");
      await fs.remove(path.join(sandbox.root, "plugins"));
      await fs.symlink(outside, path.join(sandbox.root, "plugins"), "junction");
      await expect(new ModService().deleteMod("instance", "plugins/outside.jar")).rejects.toThrow();
      expect(await fs.readFile(path.join(outside, "outside.jar"), "utf8")).toBe("outside");
    } finally {
      await fs.remove(outside);
    }
  });
});
