import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

let tmpDir: string;
let StorageSubsystem: InstanceType<typeof import("./system_storage").default>;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-storage-test-"));
  process.chdir(tmpDir);
  // DATA_PATH is derived from process.cwd() at import time, so the chdir
  // above must happen before this module is first loaded. It's a
  // module-level singleton - this import happens exactly once for the
  // whole file, and every describe block below shares this same instance
  // and tmpDir.
  // load()/store() are instance methods (every real consumer instantiates
  // via `new StorageSubsystem()` - see daemon/src/common/system_storage.ts
  // and panel/src/app/common/system_storage.ts), so we do the same here.
  const StorageSubsystemClass = (await import("./system_storage")).default;
  StorageSubsystem = new StorageSubsystemClass();
});

afterEach(() => {
  fs.removeSync(path.join(tmpDir, "data"));
});

class DummyConfig {
  public name = "default";
}

describe("StorageSubsystem.load", () => {
  it("returns null for a missing file", () => {
    const result = StorageSubsystem.load("dummy_category", DummyConfig, "missing-uuid");
    expect(result).toBeNull();
  });

  it("returns a hydrated instance for valid JSON", () => {
    StorageSubsystem.store("dummy_category", "valid-uuid", { name: "custom" });
    const result = StorageSubsystem.load("dummy_category", DummyConfig, "valid-uuid");
    expect(result).not.toBeNull();
    expect((result as DummyConfig).name).toBe("custom");
  });

  it("returns null instead of throwing when the file contains corrupted JSON", () => {
    const dirPath = path.join(tmpDir, "data", "dummy_category");
    fs.mkdirsSync(dirPath);
    // Simulate a crash-truncated write: valid JSON prefix, cut off mid-value.
    fs.writeFileSync(path.join(dirPath, "corrupt-uuid.json"), '{"name": "cu', {
      encoding: "utf-8"
    });

    expect(() => {
      const result = StorageSubsystem.load("dummy_category", DummyConfig, "corrupt-uuid");
      expect(result).toBeNull();
    }).not.toThrow();
  });
});
