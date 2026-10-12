import fs from "fs-extra";
import os from "os";
import path from "path";
import zlib from "zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LOG_DIR_MODE,
  LOG_FILE_MODE,
  LOG_RETENTION_DAYS,
  MAX_LOG_SIZE,
  archiveLogFile,
  compressPlainArchives,
  ensureLogDir,
  formatLogTimestamp,
  pruneOldLogs,
  restrictPermission,
  rotatingFileAppender,
  runLogMaintenance
} from "../log_rotation";

let tmpDir: string;
let logsDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-log-rotation-test-"));
  logsDir = path.join(tmpDir, "logs");
});

afterEach(() => {
  fs.removeSync(tmpDir);
});

describe("constants", () => {
  it("match the application-logging contract", () => {
    expect(MAX_LOG_SIZE).toBe(10 * 1024 * 1024);
    expect(LOG_RETENTION_DAYS).toBe(30);
    expect(LOG_FILE_MODE).toBe(0o700);
    expect(LOG_DIR_MODE).toBe(0o700);
  });
});

describe("formatLogTimestamp", () => {
  it("zero-pads every component", () => {
    const date = new Date(2026, 9, 12, 15, 3, 4);
    expect(formatLogTimestamp(date)).toBe("2026-10-12_15-03-04");
  });
});

describe("ensureLogDir", () => {
  it("creates the log directory when missing", () => {
    ensureLogDir(logsDir);
    expect(fs.statSync(logsDir).isDirectory()).toBe(true);
  });

  it("is idempotent for an existing directory", () => {
    ensureLogDir(logsDir);
    expect(() => ensureLogDir(logsDir)).not.toThrow();
  });

  it("applies mode 0700 to the directory on POSIX", () => {
    ensureLogDir(logsDir);
    if (process.platform !== "win32") {
      expect(fs.statSync(logsDir).mode & 0o777).toBe(0o700);
    }
  });
});

describe("restrictPermission", () => {
  it("applies mode 0700 to a file on POSIX", () => {
    ensureLogDir(logsDir);
    const active = path.join(logsDir, "current.log");
    fs.writeFileSync(active, "line\n", { encoding: "utf8", mode: 0o644 });
    restrictPermission(active);
    if (process.platform !== "win32") {
      expect(fs.statSync(active).mode & 0o777).toBe(0o700);
    }
  });

  it("reports failure through onWarn without throwing", () => {
    const warn = vi.fn();
    const spy = vi.spyOn(fs, "chmodSync").mockImplementation(() => {
      throw new Error("EPERM");
    });
    expect(() => restrictPermission("any-file", warn)).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("EPERM");
    spy.mockRestore();
  });
});

describe("archiveLogFile", () => {
  it("returns null when the file does not exist", () => {
    expect(archiveLogFile(path.join(logsDir, "missing.log"))).toBeNull();
  });

  it("names the archive <base>_<YYYY-MM-DD_HH-mm-ss>.log.gz and removes the plaintext source", () => {
    ensureLogDir(logsDir);
    const active = path.join(logsDir, "current.log");
    fs.writeFileSync(active, "hello rotation\n", "utf8");
    const now = new Date(2026, 9, 12, 15, 3, 4);
    const archivePath = archiveLogFile(active, undefined, now);
    expect(archivePath).toBe(path.join(logsDir, "current_2026-10-12_15-03-04.log.gz"));
    expect(fs.existsSync(archivePath!)).toBe(true);
    expect(fs.existsSync(active)).toBe(false);
    expect(fs.readdirSync(logsDir).filter((name) => name.endsWith(".log"))).toEqual([]);
  });

  it("round-trips the rotated content exactly through gzip, including multibyte text", () => {
    ensureLogDir(logsDir);
    const active = path.join(logsDir, "sysinfo.log");
    const content = "MEM: 100MB 中文测试\nsecond line\n";
    fs.writeFileSync(active, content, "utf8");
    const archivePath = archiveLogFile(active)!;
    const restored = zlib.gunzipSync(fs.readFileSync(archivePath)).toString("utf8");
    expect(restored).toBe(content);
  });

  it("applies mode 0700 to the archive on POSIX", () => {
    ensureLogDir(logsDir);
    const active = path.join(logsDir, "current.log");
    fs.writeFileSync(active, "secret\n", "utf8");
    const archivePath = archiveLogFile(active)!;
    if (process.platform !== "win32") {
      expect(fs.statSync(archivePath).mode & 0o777).toBe(0o700);
    }
  });

  it("disambiguates same-second collisions with a numeric suffix", () => {
    ensureLogDir(logsDir);
    const active = path.join(logsDir, "current.log");
    const now = new Date(2026, 9, 12, 15, 3, 4);
    fs.writeFileSync(active, "first\n", "utf8");
    const first = archiveLogFile(active, undefined, now)!;
    fs.writeFileSync(active, "second\n", "utf8");
    const second = archiveLogFile(active, undefined, now)!;
    expect(first).toBe(path.join(logsDir, "current_2026-10-12_15-03-04.log.gz"));
    expect(second).toBe(path.join(logsDir, "current_2026-10-12_15-03-04_01.log.gz"));
    expect(zlib.gunzipSync(fs.readFileSync(first)).toString("utf8")).toBe("first\n");
    expect(zlib.gunzipSync(fs.readFileSync(second)).toString("utf8")).toBe("second\n");
  });

  it("suffixes the next stem when a plaintext intermediate collides", () => {
    ensureLogDir(logsDir);
    const now = new Date(2026, 9, 12, 15, 3, 4);
    const stranded = path.join(logsDir, "current_2026-10-12_15-03-04.log");
    fs.writeFileSync(stranded, "stranded mid-crash\n", "utf8");
    const active = path.join(logsDir, "current.log");
    fs.writeFileSync(active, "new content\n", "utf8");
    const archivePath = archiveLogFile(active, undefined, now)!;
    expect(archivePath).toBe(path.join(logsDir, "current_2026-10-12_15-03-04_01.log.gz"));
    expect(zlib.gunzipSync(fs.readFileSync(archivePath)).toString("utf8")).toBe("new content\n");
    expect(fs.readFileSync(stranded, "utf8")).toBe("stranded mid-crash\n");
  });

  it("returns null, warns, and keeps the source when the rename fails", () => {
    ensureLogDir(logsDir);
    const active = path.join(logsDir, "current.log");
    fs.writeFileSync(active, "keep me\n", "utf8");
    const warn = vi.fn();
    const spy = vi.spyOn(fs, "renameSync").mockImplementation(() => {
      throw new Error("EBUSY");
    });
    try {
      expect(archiveLogFile(active, warn)).toBeNull();
    } finally {
      spy.mockRestore();
    }
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("Failed to archive");
    expect(fs.readFileSync(active, "utf8")).toBe("keep me\n");
    expect(fs.readdirSync(logsDir).filter((name) => name.endsWith(".log.gz"))).toEqual([]);
  });
});

describe("compressPlainArchives", () => {
  it("gzip-compresses legacy plaintext archives and removes the plaintext copy", () => {
    ensureLogDir(logsDir);
    const legacy = path.join(logsDir, "2026-10-12_15-3-4.log");
    fs.writeFileSync(legacy, "legacy content\n", "utf8");
    compressPlainArchives(logsDir, ["current.log", "sysinfo.log"]);
    expect(fs.existsSync(legacy)).toBe(false);
    const compressed = path.join(logsDir, "2026-10-12_15-3-4.log.gz");
    expect(fs.existsSync(compressed)).toBe(true);
    expect(zlib.gunzipSync(fs.readFileSync(compressed)).toString("utf8")).toBe("legacy content\n");
    if (process.platform !== "win32") {
      expect(fs.statSync(compressed).mode & 0o777).toBe(0o700);
    }
  });

  it("never touches active files or non-log files", () => {
    ensureLogDir(logsDir);
    const active = path.join(logsDir, "current.log");
    const other = path.join(logsDir, "notes.txt");
    fs.writeFileSync(active, "live\n", "utf8");
    fs.writeFileSync(other, "keep\n", "utf8");
    compressPlainArchives(logsDir, ["current.log"]);
    expect(fs.readFileSync(active, "utf8")).toBe("live\n");
    expect(fs.readFileSync(other, "utf8")).toBe("keep\n");
  });
});

describe("pruneOldLogs", () => {
  function ageFile(filePath: string, days: number) {
    const stamp = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    fs.utimesSync(filePath, stamp, stamp);
  }

  it("deletes archives older than 30 days and keeps newer ones", () => {
    ensureLogDir(logsDir);
    const oldGz = path.join(logsDir, "current_2026-01-01_00-00-00.log.gz");
    const recentGz = path.join(logsDir, "current_2026-02-01_00-00-00.log.gz");
    const oldPlain = path.join(logsDir, "2026-01-01_0-0-0.log");
    fs.writeFileSync(oldGz, "old\n", "utf8");
    fs.writeFileSync(recentGz, "recent\n", "utf8");
    fs.writeFileSync(oldPlain, "old plain\n", "utf8");
    ageFile(oldGz, 31);
    ageFile(recentGz, 29);
    ageFile(oldPlain, 31);
    pruneOldLogs(logsDir, ["current.log"]);
    expect(fs.existsSync(oldGz)).toBe(false);
    expect(fs.existsSync(oldPlain)).toBe(false);
    expect(fs.existsSync(recentGz)).toBe(true);
  });

  it("keeps active files and non-log files regardless of age", () => {
    ensureLogDir(logsDir);
    const active = path.join(logsDir, "current.log");
    const other = path.join(logsDir, "notes.txt");
    fs.writeFileSync(active, "live\n", "utf8");
    fs.writeFileSync(other, "keep\n", "utf8");
    ageFile(active, 60);
    ageFile(other, 60);
    pruneOldLogs(logsDir, ["current.log"]);
    expect(fs.existsSync(active)).toBe(true);
    expect(fs.existsSync(other)).toBe(true);
  });
});

describe("runLogMaintenance", () => {
  it("archives leftover active logs, compresses legacy plaintext, and prunes over-age archives", () => {
    ensureLogDir(logsDir);
    fs.writeFileSync(path.join(logsDir, "current.log"), "leftover\n", "utf8");
    fs.writeFileSync(path.join(logsDir, "sysinfo.log"), "samples\n", "utf8");
    fs.writeFileSync(path.join(logsDir, "2026-01-01_0-0-0.log"), "legacy\n", "utf8");
    const stale = path.join(logsDir, "current_2025-01-01_00-00-00.log.gz");
    fs.writeFileSync(stale, "stale\n", "utf8");
    const stamp = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    fs.utimesSync(stale, stamp, stamp);

    runLogMaintenance(logsDir, ["current.log", "sysinfo.log"]);

    const names = fs.readdirSync(logsDir).sort();
    expect(names.filter((name) => name.endsWith(".log"))).toEqual([]);
    const archives = names.filter((name) => name.endsWith(".log.gz"));
    expect(archives).toContain("2026-01-01_0-0-0.log.gz");
    expect(archives.filter((name) => /^current_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log\.gz$/.test(name))).toHaveLength(1);
    expect(archives.filter((name) => /^sysinfo_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log\.gz$/.test(name))).toHaveLength(1);
    expect(fs.existsSync(stale)).toBe(false);
  });

  it("creates the log directory when it is missing", () => {
    const nested = path.join(tmpDir, "nested", "logs");
    runLogMaintenance(nested, ["current.log"]);
    expect(fs.statSync(nested).isDirectory()).toBe(true);
    expect(fs.readdirSync(nested)).toEqual([]);
  });

  it("re-applies owner-only mode to pre-existing archives", () => {
    ensureLogDir(logsDir);
    const legacyGz = path.join(logsDir, "2026-01-01_0-0-0.log.gz");
    fs.writeFileSync(legacyGz, zlib.gzipSync(Buffer.from("old\n", "utf8")), { mode: 0o644 });
    runLogMaintenance(logsDir, ["current.log"]);
    if (process.platform !== "win32") {
      expect(fs.statSync(legacyGz).mode & 0o777).toBe(0o700);
    }
  });
});

describe("rotatingFileAppender", () => {
  const fakeLayouts = {
    basicLayout: (event: unknown) => String((event as { data: unknown[] }).data[0]),
    layout: () => (event: unknown) => String((event as { data: unknown[] }).data[0])
  };

  function createApp(filePath: string, maxLogSize: number, activeNames?: string[]) {
    return rotatingFileAppender.configure(
      {
        filename: filePath,
        maxLogSize,
        activeNames,
        layout: { type: "pattern", pattern: "%m" }
      },
      fakeLayouts
    );
  }

  function emit(app: ReturnType<typeof createApp>, count: number) {
    for (let i = 0; i < count; i++) {
      app({ data: [`entry-${String(i).padStart(2, "0")}`] });
    }
  }

  function readAllEntries(dir: string, activeName: string): string[] {
    const base = activeName.replace(/\.log$/, "");
    const archives = fs
      .readdirSync(dir)
      .filter((name) => name.startsWith(`${base}_`) && name.endsWith(".log.gz"))
      .sort();
    let text = "";
    for (const name of archives) {
      text += zlib.gunzipSync(fs.readFileSync(path.join(dir, name))).toString("utf8");
    }
    const active = path.join(dir, activeName);
    if (fs.existsSync(active)) text += fs.readFileSync(active, "utf8");
    return text.split(/\r?\n/).filter((line) => line.length > 0);
  }

  it("rotates into a timestamped gzip archive when a write crosses the size threshold", () => {
    const filePath = path.join(logsDir, "current.log");
    const app = createApp(filePath, 100);
    emit(app, 30);
    const archives = fs.readdirSync(logsDir).filter((name) => name.endsWith(".log.gz"));
    expect(archives.length).toBeGreaterThanOrEqual(1);
    expect(archives[0]).toMatch(/^current_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}(_\d+)?\.log\.gz$/);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(
      fs.readdirSync(logsDir).filter((name) => name.startsWith("current_") && name.endsWith(".log"))
    ).toEqual([]);
  });

  it("keeps every entry across rotations in order with no loss", () => {
    const filePath = path.join(logsDir, "current.log");
    const app = createApp(filePath, 100);
    emit(app, 30);
    const expected = Array.from({ length: 30 }, (_, i) => `entry-${String(i).padStart(2, "0")}`);
    expect(readAllEntries(logsDir, "current.log")).toEqual(expected);
  });

  it("does not rotate while the file stays at or below the threshold", () => {
    const filePath = path.join(logsDir, "current.log");
    const app = createApp(filePath, 1024);
    emit(app, 5);
    expect(fs.readdirSync(logsDir).filter((name) => name.endsWith(".log.gz"))).toEqual([]);
    expect(readAllEntries(logsDir, "current.log")).toHaveLength(5);
  });

  it("rotates two appender files independently", () => {
    const currentApp = createApp(path.join(logsDir, "current.log"), 100);
    const sysinfoApp = createApp(path.join(logsDir, "sysinfo.log"), 1024 * 1024);
    emit(currentApp, 30);
    for (let i = 0; i < 5; i++) sysinfoApp({ data: [`sample-${i}`] });
    const archives = fs.readdirSync(logsDir).filter((name) => name.endsWith(".log.gz"));
    expect(archives.every((name) => name.startsWith("current_"))).toBe(true);
    expect(archives.length).toBeGreaterThanOrEqual(1);
    expect(readAllEntries(logsDir, "sysinfo.log")).toEqual(
      Array.from({ length: 5 }, (_, i) => `sample-${i}`)
    );
  });

  it("reports permission failures through the log itself without breaking rotation", () => {
    const filePath = path.join(logsDir, "current.log");
    const spy = vi.spyOn(fs, "chmodSync").mockImplementation(() => {
      throw new Error("EPERM");
    });
    const app = createApp(filePath, 100);
    emit(app, 30);
    spy.mockRestore();
    const text = readAllEntries(logsDir, "current.log").join("\n");
    expect(text).toContain("[log-rotation]");
    expect(text).toContain("EPERM");
    expect(text).toContain("entry-29");
  });

  it("calls the shutdown hook synchronously", () => {
    const app = createApp(path.join(logsDir, "current.log"), 100);
    let done = false;
    app.shutdown?.(() => {
      done = true;
    });
    expect(done).toBe(true);
  });

  it("prunes over-age archives after a rotation and keeps fresh ones", () => {
    ensureLogDir(logsDir);
    const stale = path.join(logsDir, "current_2025-01-01_00-00-00.log.gz");
    const staleSibling = path.join(logsDir, "sysinfo_2025-01-01_00-00-00.log.gz");
    const fresh = path.join(logsDir, "current_2026-06-01_00-00-00.log.gz");
    for (const file of [stale, staleSibling, fresh]) {
      fs.writeFileSync(file, zlib.gzipSync(Buffer.from("x\n", "utf8")));
    }
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    fs.utimesSync(stale, old, old);
    fs.utimesSync(staleSibling, old, old);
    const app = createApp(path.join(logsDir, "current.log"), 100);
    emit(app, 30);
    expect(fs.existsSync(stale)).toBe(false);
    expect(fs.existsSync(staleSibling)).toBe(false);
    expect(fs.existsSync(fresh)).toBe(true);
  });

  it("never deletes sibling active files during rotation retention", () => {
    ensureLogDir(logsDir);
    const sibling = path.join(logsDir, "sysinfo.log");
    fs.writeFileSync(sibling, "sibling sample\n", "utf8");
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    fs.utimesSync(sibling, old, old);
    const app = createApp(path.join(logsDir, "current.log"), 100, ["current.log", "sysinfo.log"]);
    emit(app, 30);
    expect(fs.existsSync(sibling)).toBe(true);
    expect(fs.readFileSync(sibling, "utf8")).toBe("sibling sample\n");
  });

  it("rotates eagerly at configure when the existing file already exceeds the threshold", () => {
    const filePath = path.join(logsDir, "current.log");
    ensureLogDir(logsDir);
    fs.writeFileSync(filePath, "oversized leftover\n", "utf8");
    createApp(filePath, 10);
    const archives = fs.readdirSync(logsDir).filter((name) => name.endsWith(".log.gz"));
    expect(archives).toHaveLength(1);
    expect(zlib.gunzipSync(fs.readFileSync(path.join(logsDir, archives[0]))).toString("utf8")).toBe(
      "oversized leftover\n"
    );
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it("resumes byte accounting from an existing file", () => {
    const filePath = path.join(logsDir, "current.log");
    ensureLogDir(logsDir);
    fs.writeFileSync(filePath, "p".repeat(79) + "\n", "utf8");
    const app = createApp(filePath, 100);
    expect(fs.readdirSync(logsDir).filter((name) => name.endsWith(".log.gz"))).toEqual([]);
    app({ data: ["thirty-bytes-entry-of-text!!"] });
    const archives = fs.readdirSync(logsDir).filter((name) => name.endsWith(".log.gz"));
    expect(archives).toHaveLength(1);
    const restored = zlib.gunzipSync(fs.readFileSync(path.join(logsDir, archives[0]))).toString(
      "utf8"
    );
    expect(restored.startsWith("p".repeat(79))).toBe(true);
    expect(restored).toContain("thirty-bytes-entry-of-text!!");
  });

  it("keeps the file at exactly the threshold and rotates only once it is exceeded", () => {
    const filePath = path.join(logsDir, "current.log");
    const entry = "aaaaa" + os.EOL;
    const app = createApp(filePath, Buffer.byteLength(entry, "utf8") * 3);
    for (let i = 0; i < 3; i++) app({ data: ["aaaaa"] });
    expect(fs.readdirSync(logsDir).filter((name) => name.endsWith(".log.gz"))).toEqual([]);
    expect(fs.existsSync(filePath)).toBe(true);
    app({ data: ["aaaaa"] });
    expect(fs.readdirSync(logsDir).filter((name) => name.endsWith(".log.gz")).length).toBe(1);
  });

  it("keeps accepting entries without loss when rotation fails", () => {
    const filePath = path.join(logsDir, "current.log");
    const app = createApp(filePath, 100);
    const spy = vi.spyOn(fs, "renameSync").mockImplementation(() => {
      throw new Error("EBUSY");
    });
    try {
      emit(app, 30);
    } finally {
      spy.mockRestore();
    }
    const text = fs.readFileSync(filePath, "utf8");
    let cursor = -1;
    for (let i = 0; i < 30; i++) {
      cursor = text.indexOf(`entry-${String(i).padStart(2, "0")}`, cursor + 1);
      expect(cursor).toBeGreaterThan(-1);
    }
    expect(text).toContain("[log-rotation]");
    expect(text).toContain("EBUSY");
  });
});
