import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// noOp logger: config.ts warns through it when chmod fails (must never throw).
vi.mock("../../service/log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

// GlobalConfiguration persists to data/Config/global.json under the process
// cwd (StorageSubsystem.DATA_PATH is captured at import time), so we chdir
// into a throw-away temp dir BEFORE importing the module — same pattern as
// Instance_router.integration.test.ts (vitest threads:false => chdir works).
let globalConfiguration: typeof import("../config").globalConfiguration;
let tmpDir = "";
let originalCwd = "";
let configFile = "";
let chmodSpy: any;

beforeAll(async () => {
  originalCwd = process.cwd();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-config-test-"));
  process.chdir(tmpDir);
  ({ globalConfiguration } = await import("../config"));
  configFile = path.join(tmpDir, "data", "Config", "global.json");
  chmodSpy = vi.spyOn(fs, "chmodSync");
});

afterAll(() => {
  process.chdir(originalCwd);
  fs.removeSync(tmpDir);
});

beforeEach(() => {
  chmodSpy.mockClear();
});

describe("config file permission (access key lives in data/Config/global.json)", () => {
  it("load() creates the config file and restricts it to owner-only (0700)", () => {
    globalConfiguration.load();

    expect(fs.existsSync(configFile)).toBe(true);
    expect(chmodSpy).toHaveBeenCalledWith(configFile, 0o700);
    if (process.platform !== "win32") {
      expect(fs.statSync(configFile).mode & 0o777).toBe(0o700);
    }
  });

  it("load() tightens an existing world-readable config file", () => {
    fs.chmodSync(configFile, 0o644);
    chmodSpy.mockClear();

    globalConfiguration.load();

    expect(chmodSpy).toHaveBeenCalledWith(configFile, 0o700);
    if (process.platform !== "win32") {
      expect(fs.statSync(configFile).mode & 0o777).toBe(0o700);
    }
  });

  it("store() re-applies 0700 after the file is rewritten", () => {
    fs.chmodSync(configFile, 0o644);
    chmodSpy.mockClear();

    globalConfiguration.store();

    expect(chmodSpy).toHaveBeenCalledWith(configFile, 0o700);
    if (process.platform !== "win32") {
      expect(fs.statSync(configFile).mode & 0o777).toBe(0o700);
    }
  });

  it("store() still writes the config when chmod fails", () => {
    chmodSpy.mockImplementationOnce(() => {
      throw new Error("simulated EACCES");
    });

    expect(() => globalConfiguration.store()).not.toThrow();
    expect(fs.readJsonSync(configFile)).toBeTruthy();
  });
});
