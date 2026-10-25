import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Contract pin: the default update source. Defined as a literal (NOT imported
// from mcsmanager-common) because a static import of that package would bind
// StorageSubsystem.DATA_PATH at collection time �?before this file's
// beforeAll() chdirs into the throw-away temp dir.
const DEFAULT_UPDATE_SOURCE_URL =
  "https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_update_manifest.json";
// Contract pin: the default BACKUP update source (legacy mcsmanager.com
// manifest hosting) — same no-import rule as above.
const LEGACY_DEFAULT_UPDATE_SOURCE_URL = "https://mcsmanager.com/upgrade/manifest.json";

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

describe("update source default (GitHub Release manifest)", () => {
  it("fresh config defaults to the official GitHub Release manifest", () => {
    globalConfiguration.load();
    expect(globalConfiguration.config.updateSourceUrl).toBe(DEFAULT_UPDATE_SOURCE_URL);
  });

  it("load() keeps the class default when the persisted config predates the field", () => {
    fs.mkdirsSync(path.dirname(configFile));
    fs.writeJsonSync(configFile, { version: 2, ip: "", port: 24444 });
    globalConfiguration.load();
    expect(globalConfiguration.config.updateSourceUrl).toBe(DEFAULT_UPDATE_SOURCE_URL);
  });

  it("load() preserves a persisted custom update source", () => {
    fs.mkdirsSync(path.dirname(configFile));
    fs.writeJsonSync(configFile, { updateSourceUrl: "https://mirror.example.com/manifest.json" });
    globalConfiguration.load();
    expect(globalConfiguration.config.updateSourceUrl).toBe(
      "https://mirror.example.com/manifest.json"
    );
  });
});

describe("backup update source default (legacy mcsmanager.com manifest)", () => {
  it("fresh config defaults to the legacy backup manifest", () => {
    globalConfiguration.load();
    expect(globalConfiguration.config.updateSourceUrlFallback).toBe(
      LEGACY_DEFAULT_UPDATE_SOURCE_URL
    );
    expect(globalConfiguration.config.updateSourceUrlFallback).toBe(
      "https://mcsmanager.com/upgrade/manifest.json"
    );
  });

  it("load() keeps the class default when the persisted config predates the field", () => {
    fs.mkdirsSync(path.dirname(configFile));
    fs.writeJsonSync(configFile, {
      version: 2,
      ip: "",
      port: 24444,
      updateSourceUrl: "https://mirror.example.com/manifest.json"
    });
    globalConfiguration.load();
    expect(globalConfiguration.config.updateSourceUrlFallback).toBe(
      LEGACY_DEFAULT_UPDATE_SOURCE_URL
    );
    expect(globalConfiguration.config.updateSourceUrl).toBe(
      "https://mirror.example.com/manifest.json"
    );
  });

  it("load() preserves a persisted custom backup source", () => {
    fs.mkdirsSync(path.dirname(configFile));
    fs.writeJsonSync(configFile, {
      updateSourceUrl: "https://mirror.example.com/manifest.json",
      updateSourceUrlFallback: "https://backup.example.com/manifest.json"
    });
    globalConfiguration.load();
    expect(globalConfiguration.config.updateSourceUrlFallback).toBe(
      "https://backup.example.com/manifest.json"
    );
  });

  it("load() preserves both source fields explicitly empty (feature disabled)", () => {
    fs.mkdirsSync(path.dirname(configFile));
    fs.writeJsonSync(configFile, { updateSourceUrl: "", updateSourceUrlFallback: "" });
    globalConfiguration.load();
    expect(globalConfiguration.config.updateSourceUrl).toBe("");
    expect(globalConfiguration.config.updateSourceUrlFallback).toBe("");
  });
});
