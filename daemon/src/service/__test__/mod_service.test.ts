import compressing from "compressing";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const sandbox = { root: "", instanceCwd: "" };

vi.mock("../system_instance", () => ({
  default: {
    getInstance: () => ({
      absoluteCwdPath: () => sandbox.instanceCwd,
      config: { type: "minecraft/java" }
    })
  }
}));
vi.mock("../download_manager", () => ({ default: {} }));

import { ModService } from "../mod_service";

// Linux-only: count this process's open descriptors that point at a file
function openFdsFor(filePath: string) {
  return fs.readdirSync("/proc/self/fd").filter((fd) => {
    try {
      return fs.readlinkSync(`/proc/self/fd/${fd}`) === filePath;
    } catch {
      return false;
    }
  }).length;
}

beforeAll(async () => {
  sandbox.root = fs.mkdtempSync(path.join(os.tmpdir(), "mcs-mod-"));
  sandbox.instanceCwd = path.join(sandbox.root, "instance");
  const plugins = path.join(sandbox.instanceCwd, "plugins");
  fs.mkdirSync(plugins, { recursive: true });

  const yml = path.join(sandbox.root, "plugin.yml");
  fs.writeFileSync(yml, "name: Demo\nversion: 1.2.3\n");
  await compressing.zip.compressFile(yml, path.join(plugins, "good.jar"));
  // What a browser upload looks like before all pieces are written
  fs.writeFileSync(path.join(plugins, "zeros.jar"), Buffer.alloc(64 * 1024));
  fs.writeFileSync(path.join(plugins, "empty.jar"), "");
});

afterAll(() => {
  if (sandbox.root) fs.removeSync(sandbox.root);
});

describe("ModService.parseJarMetadata", () => {
  it("reads metadata from a valid jar", async () => {
    const service = new ModService() as any;
    const info = await service.parseJarMetadata(
      path.join(sandbox.instanceCwd, "plugins", "good.jar")
    );
    expect(info).toMatchObject({ name: "Demo", version: "1.2.3", type: "plugin" });
  });

  it.skipIf(process.platform !== "linux")(
    "does not leak file descriptors for unreadable jars",
    async () => {
      const service = new ModService() as any;
      for (const name of ["good.jar", "zeros.jar", "empty.jar"]) {
        const jar = path.join(sandbox.instanceCwd, "plugins", name);
        await service.parseJarMetadata(jar);
        await service.parseJarMetadata(jar);
        expect(openFdsFor(jar), name).toBe(0);
      }
    }
  );
});

describe("ModService.listMods", () => {
  it("scans a directory only once when two names resolve to it", async () => {
    // On a case-insensitive file system (Windows, macOS) "Plugins" already is "plugins";
    // elsewhere a junction stands in for it
    const alias = path.join(sandbox.instanceCwd, "Plugins");
    if (!fs.existsSync(alias)) {
      fs.symlinkSync(path.join(sandbox.instanceCwd, "plugins"), alias, "junction");
    }
    const service = new ModService() as any;
    const spy = vi.spyOn(service, "parseJarMetadata");
    const result = await service.listMods("uuid");
    expect(result.total).toBe(3);
    expect(spy).toHaveBeenCalledTimes(3);
  });
});
