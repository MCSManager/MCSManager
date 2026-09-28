import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

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
  vi.restoreAllMocks();
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

// fs.chmod on Windows only toggles the read-only bit, so POSIX mode
// assertions are meaningless there and are skipped.
const itPosix = process.platform === "win32" ? it.skip : it;

function modeOf(p: string) {
  return fs.statSync(p).mode & 0o777;
}

describe("StorageSubsystem private permissions", () => {
  itPosix("store() writes secret category files as 0600 and directories as 0700", () => {
    StorageSubsystem.store("User", "user-uuid", { apiKey: "secret" });
    const dirPath = path.join(tmpDir, "data", "User");
    const filePath = path.join(dirPath, "user-uuid.json");
    expect(modeOf(filePath)).toBe(0o600);
    expect(modeOf(dirPath)).toBe(0o700);
  });

  itPosix("store() also restricts the daemon Config category (communication key)", () => {
    StorageSubsystem.store("Config", "global", { key: "secret" });
    const filePath = path.join(tmpDir, "data", "Config", "global.json");
    expect(modeOf(filePath)).toBe(0o600);
    expect(modeOf(path.dirname(filePath))).toBe(0o700);
  });

  itPosix("writeFile() restricts secret paths used by version adapters", () => {
    fs.mkdirsSync(path.join(tmpDir, "data", "User"));
    StorageSubsystem.writeFile("User/rewrite-uuid.json", "{}");
    expect(modeOf(path.join(tmpDir, "data", "User", "rewrite-uuid.json"))).toBe(0o600);
  });

  itPosix("non-secret categories keep the normal umask-derived mode", () => {
    StorageSubsystem.store("dummy_category", "open-uuid", { name: "value" });
    const filePath = path.join(tmpDir, "data", "dummy_category", "open-uuid.json");
    expect(modeOf(filePath)).toBe(0o666 & ~process.umask());
  });

  itPosix("hardenPrivatePermissions() fixes world-readable files left by older versions", () => {
    for (const dir of ["User", "Config"]) {
      fs.mkdirsSync(path.join(tmpDir, "data", dir));
    }
    const userFile = path.join(tmpDir, "data", "User", "legacy-uuid.json");
    const configFile = path.join(tmpDir, "data", "Config", "global.json");
    const staleTmp = path.join(tmpDir, "data", "User", "legacy-uuid.json.tmp");
    for (const f of [userFile, configFile, staleTmp]) fs.writeFileSync(f, "{}", "utf-8");
    for (const f of [userFile, configFile, staleTmp]) fs.chmodSync(f, 0o644);
    for (const dir of ["User", "Config"]) fs.chmodSync(path.join(tmpDir, "data", dir), 0o755);

    StorageSubsystem.hardenPrivatePermissions();

    for (const f of [userFile, configFile, staleTmp]) expect(modeOf(f)).toBe(0o600);
    for (const dir of ["User", "Config"])
      expect(modeOf(path.join(tmpDir, "data", dir))).toBe(0o700);
  });

  itPosix("hardenPrivatePermissions() leaves non-secret categories alone", () => {
    const dirPath = path.join(tmpDir, "data", "dummy_category");
    fs.mkdirsSync(dirPath);
    const filePath = path.join(dirPath, "open-uuid.json");
    fs.writeFileSync(filePath, "{}", "utf-8");
    fs.chmodSync(filePath, 0o644);
    fs.chmodSync(dirPath, 0o755);

    StorageSubsystem.hardenPrivatePermissions();

    expect(modeOf(filePath)).toBe(0o644);
    expect(modeOf(dirPath)).toBe(0o755);
  });

  it("hardenPrivatePermissions() is a safe no-op when data directories are missing", () => {
    expect(() => StorageSubsystem.hardenPrivatePermissions()).not.toThrow();
  });

  it("store()/load()/writeFile()/readFile() still work for secret categories", () => {
    StorageSubsystem.store("User", "roundtrip-uuid", { name: "stored" });
    const loaded = StorageSubsystem.load("User", DummyConfig, "roundtrip-uuid");
    expect((loaded as DummyConfig).name).toBe("stored");
    StorageSubsystem.writeFile("User/roundtrip-uuid.json", '{"name":"rewritten"}');
    expect(JSON.parse(StorageSubsystem.readFile("User/roundtrip-uuid.json")).name).toBe(
      "rewritten"
    );
  });
});

// Mocked fs.chmodSync: asserts the chmod policy by call arguments instead of
// real file modes, so these tests run meaningfully on every platform
// (including Windows where chmod cannot express POSIX permissions).
describe("StorageSubsystem chmod policy (mocked fs.chmodSync)", () => {
  it("store() hardens secret categories: directory 0700, tmp file 0600", () => {
    const chmodSpy = vi.spyOn(fs, "chmodSync").mockImplementation(() => {});
    StorageSubsystem.store("User", "user-uuid", { apiKey: "secret" });
    const dirPath = path.join(tmpDir, "data", "User");
    expect(chmodSpy).toHaveBeenCalledWith(dirPath, 0o700);
    expect(chmodSpy).toHaveBeenCalledWith(path.join(dirPath, "user-uuid.json") + ".tmp", 0o600);
    expect(chmodSpy).toHaveBeenCalledTimes(2);
  });

  it("store() hardens the daemon Config category (communication key)", () => {
    const chmodSpy = vi.spyOn(fs, "chmodSync").mockImplementation(() => {});
    StorageSubsystem.store("Config", "global", { key: "secret" });
    const dirPath = path.join(tmpDir, "data", "Config");
    expect(chmodSpy).toHaveBeenCalledWith(dirPath, 0o700);
    expect(chmodSpy).toHaveBeenCalledWith(path.join(dirPath, "global.json") + ".tmp", 0o600);
    expect(chmodSpy).toHaveBeenCalledTimes(2);
  });

  it("store() never chmods non-secret categories", () => {
    const chmodSpy = vi.spyOn(fs, "chmodSync").mockImplementation(() => {});
    StorageSubsystem.store("dummy_category", "open-uuid", { name: "value" });
    expect(chmodSpy).not.toHaveBeenCalled();
  });

  it("writeFile() hardens secret paths with 0600 (version adapter rewrite path)", () => {
    fs.mkdirsSync(path.join(tmpDir, "data", "User"));
    const chmodSpy = vi.spyOn(fs, "chmodSync").mockImplementation(() => {});
    StorageSubsystem.writeFile("User/rewrite-uuid.json", "{}");
    expect(chmodSpy).toHaveBeenCalledWith(
      path.join(tmpDir, "data", "User", "rewrite-uuid.json") + ".tmp",
      0o600
    );
    expect(chmodSpy).toHaveBeenCalledTimes(1);
  });

  it("writeFile() never chmods non-secret paths", () => {
    fs.mkdirsSync(path.join(tmpDir, "data"));
    const chmodSpy = vi.spyOn(fs, "chmodSync").mockImplementation(() => {});
    StorageSubsystem.writeFile("layout.json", "{}");
    expect(chmodSpy).not.toHaveBeenCalled();
  });

  it("secret tmp files are created with mode 0600 (writeFileSync option)", () => {
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    StorageSubsystem.store("User", "user-uuid", { name: "x" });
    expect(writeSpy).toHaveBeenCalledWith(
      path.join(tmpDir, "data", "User", "user-uuid.json") + ".tmp",
      expect.any(String),
      expect.objectContaining({ encoding: "utf-8", mode: 0o600 })
    );
  });

  it("hardenPrivatePermissions() chmods secret dirs 0700 and every file inside 0600", () => {
    const userDir = path.join(tmpDir, "data", "User");
    const configDir = path.join(tmpDir, "data", "Config");
    fs.mkdirsSync(userDir);
    fs.mkdirsSync(configDir);
    const userFile = path.join(userDir, "legacy-uuid.json");
    const staleTmp = path.join(userDir, "legacy-uuid.json.tmp");
    const configFile = path.join(configDir, "global.json");
    for (const f of [userFile, staleTmp, configFile]) fs.writeFileSync(f, "{}", "utf-8");

    const chmodSpy = vi.spyOn(fs, "chmodSync").mockImplementation(() => {});
    StorageSubsystem.hardenPrivatePermissions();

    expect(chmodSpy).toHaveBeenCalledWith(userDir, 0o700);
    expect(chmodSpy).toHaveBeenCalledWith(configDir, 0o700);
    for (const f of [userFile, staleTmp, configFile])
      expect(chmodSpy).toHaveBeenCalledWith(f, 0o600);
    expect(chmodSpy).toHaveBeenCalledTimes(5);
  });

  it("hardenPrivatePermissions() ignores non-secret categories", () => {
    const dirPath = path.join(tmpDir, "data", "dummy_category");
    fs.mkdirsSync(dirPath);
    fs.writeFileSync(path.join(dirPath, "open-uuid.json"), "{}", "utf-8");

    const chmodSpy = vi.spyOn(fs, "chmodSync").mockImplementation(() => {});
    StorageSubsystem.hardenPrivatePermissions();
    expect(chmodSpy).not.toHaveBeenCalled();
  });

  it("chmod failures never break persistence (best-effort hardening)", () => {
    vi.spyOn(fs, "chmodSync").mockImplementation(() => {
      throw new Error("EPERM: operation not permitted");
    });
    expect(() => StorageSubsystem.store("User", "user-uuid", { name: "x" })).not.toThrow();
    expect(() => StorageSubsystem.hardenPrivatePermissions()).not.toThrow();
    expect(fs.existsSync(path.join(tmpDir, "data", "User", "user-uuid.json"))).toBe(true);
  });
});
