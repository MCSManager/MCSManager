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

describe("StorageSubsystem.store atomicity", () => {
  it("never leaves a .tmp file behind after a successful store", () => {
    StorageSubsystem.store("dummy_category", "atomic-uuid", { name: "value" });
    const dirPath = path.join(tmpDir, "data", "dummy_category");
    const files = fs.readdirSync(dirPath);
    expect(files).toEqual(["atomic-uuid.json"]);
  });

  it("writes via a temp file then renames into place", () => {
    // Directly exercise writeFile too, since it has its own temp-then-rename path.
    // writeFile() doesn't create its parent directory (neither before nor after
    // the atomic-write change), and the shared afterEach removes tmpDir/data
    // entirely between tests, so recreate it here as this test's own precondition.
    fs.mkdirsSync(path.join(tmpDir, "data"));
    StorageSubsystem.writeFile("plain.txt", "hello");
    const files = fs.readdirSync(path.join(tmpDir, "data"));
    expect(files).toContain("plain.txt");
    expect(files.some((f) => f.endsWith(".tmp"))).toBe(false);
  });
});
