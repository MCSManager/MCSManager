import fs from "fs-extra";
import path from "path";
import {
  DEFAULT_UPDATE_SOURCE_URL,
  LEGACY_DEFAULT_UPDATE_SOURCE_URL,
  StorageSubsystem
} from "mcsmanager-common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import StorageSystem from "../app/common/system_storage";
import SystemConfig, { DataPlaneMode } from "../app/entity/setting";

// Install-aware default contract for `SystemConfig.dataPlane`.
//
// The upgrade half of the contract lives in `StorageSubsystem.load`'s
// `new classz()` + deep-copy semantics: a persisted config that predates the
// `dataPlane` field keeps the class-level default. The fresh-install half
// (`initSystemConfig` overriding to Proxy when no config file exists) is
// covered end-to-end by `common/test/integration/suites/dataplane.test.ts`
// ("fresh-install default dataPlane mode must be proxy").
//
// This file pins the upgrade half so a future flip of the class-level default
// (or a change to the loader's merge semantics) is caught here rather than
// silently changing the data-plane topology of every upgraded deployment.
//
// The round-trip cases write into a throwaway Storage category under the real
// `DATA_PATH` (panel's vitest runs in worker threads where `process.chdir` is
// unsupported, so the cwd-derived DATA_PATH cannot be redirected) and remove
// it in `afterAll`.

const CATEGORY = "SystemConfigDefaultTest";
const STORED = path.join(StorageSubsystem.DATA_PATH, CATEGORY);

beforeAll(() => {
  fs.mkdirsSync(STORED);
});

afterAll(() => {
  fs.removeSync(STORED);
});

function writeConfig(json: Record<string, unknown>) {
  fs.writeFileSync(path.join(STORED, "config.json"), JSON.stringify(json, null, 2));
}

describe("SystemConfig.dataPlane �?install-aware default", () => {
  it("class-level default is Direct (upgrade-safe for a config that predates the field)", () => {
    const cfg = new SystemConfig();
    expect(cfg.dataPlane).toBe(DataPlaneMode.Direct);
    expect(cfg.dataPlane).toBe("direct");
  });

  it("upgrade: a persisted config with no dataPlane key falls back to Direct", () => {
    // Shape of a config written before the `dataPlane` field existed.
    writeConfig({ httpPort: 23333, httpIp: "", prefix: "", gatewaySecret: "legacy" });
    const loaded = StorageSystem.load(CATEGORY, SystemConfig, "config");
    expect(loaded, "config must load").toBeTruthy();
    expect(loaded.dataPlane).toBe(DataPlaneMode.Direct);
    // Unrelated fields still round-trip through the loader.
    expect(loaded.gatewaySecret).toBe("legacy");
  });

  it("upgrade: an explicit direct value is preserved", () => {
    writeConfig({ httpPort: 23333, dataPlane: "direct" });
    const loaded = StorageSystem.load(CATEGORY, SystemConfig, "config");
    expect(loaded, "config must load").toBeTruthy();
    expect(loaded.dataPlane).toBe(DataPlaneMode.Direct);
  });

  it("upgrade: an explicit proxy value is preserved", () => {
    writeConfig({ httpPort: 23333, dataPlane: "proxy" });
    const loaded = StorageSystem.load(CATEGORY, SystemConfig, "config");
    expect(loaded, "config must load").toBeTruthy();
    expect(loaded.dataPlane).toBe(DataPlaneMode.Proxy);
  });

  it("enum wire values are the persisted strings", () => {
    expect(DataPlaneMode.Direct).toBe("direct");
    expect(DataPlaneMode.Proxy).toBe("proxy");
  });
});

describe("SystemConfig.updateSourceUrl �?GitHub Release default", () => {
  it("class-level default points at the official GitHub Release manifest", () => {
    const cfg = new SystemConfig();
    expect(cfg.updateSourceUrl).toBe(DEFAULT_UPDATE_SOURCE_URL);
    expect(cfg.updateSourceUrl).toBe(
      "https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_update_manifest.json"
    );
  });

  it("upgrade: a persisted config with no updateSourceUrl key falls back to the new default", () => {
    writeConfig({ httpPort: 23333 });
    const loaded = StorageSystem.load(CATEGORY, SystemConfig, "config");
    expect(loaded, "config must load").toBeTruthy();
    expect(loaded.updateSourceUrl).toBe(DEFAULT_UPDATE_SOURCE_URL);
  });

  it("upgrade: an explicit custom update source is preserved", () => {
    writeConfig({ httpPort: 23333, updateSourceUrl: "https://mirror.example.com/manifest.json" });
    const loaded = StorageSystem.load(CATEGORY, SystemConfig, "config");
    expect(loaded, "config must load").toBeTruthy();
    expect(loaded.updateSourceUrl).toBe("https://mirror.example.com/manifest.json");
  });
});

describe("SystemConfig.updateSourceUrlFallback �?legacy backup default", () => {
  it("class-level default points at the legacy mcsmanager.com manifest", () => {
    const cfg = new SystemConfig();
    expect(cfg.updateSourceUrlFallback).toBe(LEGACY_DEFAULT_UPDATE_SOURCE_URL);
    expect(cfg.updateSourceUrlFallback).toBe("https://mcsmanager.com/upgrade/manifest.json");
  });

  it("upgrade: a persisted config with no updateSourceUrlFallback key keeps the default", () => {
    writeConfig({ httpPort: 23333, updateSourceUrl: "https://mirror.example.com/manifest.json" });
    const loaded = StorageSystem.load(CATEGORY, SystemConfig, "config");
    expect(loaded, "config must load").toBeTruthy();
    expect(loaded.updateSourceUrlFallback).toBe(LEGACY_DEFAULT_UPDATE_SOURCE_URL);
  });

  it("upgrade: an explicit custom backup source is preserved", () => {
    writeConfig({
      httpPort: 23333,
      updateSourceUrl: "https://mirror.example.com/manifest.json",
      updateSourceUrlFallback: "https://backup.example.com/manifest.json"
    });
    const loaded = StorageSystem.load(CATEGORY, SystemConfig, "config");
    expect(loaded, "config must load").toBeTruthy();
    expect(loaded.updateSourceUrlFallback).toBe("https://backup.example.com/manifest.json");
    expect(loaded.updateSourceUrl).toBe("https://mirror.example.com/manifest.json");
  });

  it("upgrade: both source fields explicitly empty are preserved (feature disabled)", () => {
    writeConfig({ httpPort: 23333, updateSourceUrl: "", updateSourceUrlFallback: "" });
    const loaded = StorageSystem.load(CATEGORY, SystemConfig, "config");
    expect(loaded, "config must load").toBeTruthy();
    expect(loaded.updateSourceUrl).toBe("");
    expect(loaded.updateSourceUrlFallback).toBe("");
  });
});
