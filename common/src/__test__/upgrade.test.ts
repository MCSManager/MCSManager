import { spawnSync } from "child_process";
import fs from "fs-extra";
import http from "http";
import os from "os";
import path from "path";
import zlib from "zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  compareVersions,
  DEFAULT_UPDATE_SOURCE_URL,
  extractArchive,
  extractTarGz,
  fetchJsonFromSources,
  isComparableVersion,
  LEGACY_DEFAULT_UPDATE_SOURCE_URL,
  migrateLegacyUpdateSourceUrl,
  normalizeVersion
} from "../upgrade";

function tmpDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

interface TarEntry {
  name: string;
  content?: string;
  type?: "file" | "directory" | "symlink" | "hardlink";
  linkname?: string;
}

// Minimal ustar writer (512-byte headers) supporting arbitrary entry names and
// types, so traversal/link guards can be tested against crafted archives.
function tarHeader(entry: TarEntry, size: number): Buffer {
  const buf = Buffer.alloc(512);
  buf.write(entry.name, 0, 100, "utf-8");
  buf.write("0000644\0", 100, 8, "utf-8");
  buf.write("0000000\0", 108, 8, "utf-8");
  buf.write("0000000\0", 116, 8, "utf-8");
  buf.write(size.toString(8).padStart(11, "0") + "\0", 124, 12, "utf-8");
  buf.write("00000000000\0", 136, 12, "utf-8");
  buf.write("        ", 148, 8, "utf-8");
  const typeflag =
    entry.type === "directory" ? "5" : entry.type === "symlink" ? "2" : entry.type === "hardlink" ? "1" : "0";
  buf.write(typeflag, 156, 1, "utf-8");
  if (entry.linkname) buf.write(entry.linkname, 157, 100, "utf-8");
  buf.write("ustar\0", 257, 6, "utf-8");
  buf.write("00", 263, 2, "utf-8");
  let sum = 0;
  for (const b of buf) sum += b;
  buf.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "utf-8");
  return buf;
}

function makeTarGz(filePath: string, entries: TarEntry[]): string {
  const parts: Buffer[] = [];
  for (const e of entries) {
    const data = e.type === "file" || !e.type ? Buffer.from(e.content ?? "", "utf-8") : Buffer.alloc(0);
    parts.push(tarHeader(e, data.length));
    if (data.length) {
      parts.push(data);
      const pad = (512 - (data.length % 512)) % 512;
      if (pad) parts.push(Buffer.alloc(pad));
    }
  }
  parts.push(Buffer.alloc(1024));
  fs.writeFileSync(filePath, zlib.gzipSync(Buffer.concat(parts)));
  return filePath;
}

// Minimal STORE-mode zip writer (dependency-free) for zip-compat coverage.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeZip(filePath: string, entries: { name: string; content: string }[]): string {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, "utf-8");
    const data = Buffer.from(e.content, "utf-8");
    const crc = crc32(data);
    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4);
    lfh.writeUInt16LE(0, 8);
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(data.length, 18);
    lfh.writeUInt32LE(data.length, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    parts.push(lfh, nameBuf, data);
    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0);
    cdh.writeUInt16LE(20, 4);
    cdh.writeUInt16LE(20, 6);
    cdh.writeUInt16LE(0, 8);
    cdh.writeUInt32LE(crc, 16);
    cdh.writeUInt32LE(data.length, 20);
    cdh.writeUInt32LE(data.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt32LE(offset, 42);
    central.push(cdh, nameBuf);
    offset += lfh.length + nameBuf.length + data.length;
  }
  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  fs.writeFileSync(filePath, Buffer.concat([...parts, centralBuf, eocd]));
  return filePath;
}

describe("compareVersions", () => {
  it("compares segment-wise numerically", () => {
    expect(compareVersions("4.18.4", "4.18.3")).toBe(1);
    expect(compareVersions("4.18.3", "4.18.4")).toBe(-1);
    expect(compareVersions("10.0.0", "9.9.9")).toBe(1);
    expect(compareVersions("1.2.3", "1.2.3")).toBe(0);
  });

  it("treats missing segments as 0", () => {
    expect(compareVersions("1.2", "1.2.0")).toBe(0);
    expect(compareVersions("1.2.0.1", "1.2")).toBe(1);
    expect(compareVersions(undefined, "0")).toBe(0);
  });

  it("treats non-numeric segments as 0", () => {
    expect(compareVersions("1.x.3", "1.0.3")).toBe(0);
  });
});

describe("normalizeVersion", () => {
  it("strips a single leading v/V marker before a digit", () => {
    expect(normalizeVersion("v10.21.2")).toBe("10.21.2");
    expect(normalizeVersion("V4.19.2")).toBe("4.19.2");
    expect(normalizeVersion("v4")).toBe("4");
  });

  it("keeps plain versions and non-marker text unchanged", () => {
    expect(normalizeVersion("10.21.2")).toBe("10.21.2");
    expect(normalizeVersion("version")).toBe("version");
    expect(normalizeVersion("vv1.2.3")).toBe("vv1.2.3");
  });

  it("trims whitespace and tolerates empty input", () => {
    expect(normalizeVersion("  10.21.2  ")).toBe("10.21.2");
    expect(normalizeVersion("")).toBe("");
    expect(normalizeVersion(undefined)).toBe("");
  });
});

describe("isComparableVersion", () => {
  it("accepts dotted-numeric versions with an optional v prefix", () => {
    expect(isComparableVersion("10.21.2")).toBe(true);
    expect(isComparableVersion("v10.21.2")).toBe(true);
    expect(isComparableVersion("4")).toBe(true);
    expect(isComparableVersion("  4.19.2  ")).toBe(true);
    expect(isComparableVersion("1.2.3 ")).toBe(true);
  });

  it("rejects malformed versions (fail-closed input for update checks)", () => {
    expect(isComparableVersion("")).toBe(false);
    expect(isComparableVersion(undefined)).toBe(false);
    expect(isComparableVersion("abc")).toBe(false);
    expect(isComparableVersion("1.2.3-beta")).toBe(false);
    expect(isComparableVersion("1..2")).toBe(false);
    expect(isComparableVersion("1.2.")).toBe(false);
    expect(isComparableVersion("10.21.2.")).toBe(false);
    expect(isComparableVersion("latest")).toBe(false);
    expect(isComparableVersion("vv1.2.3")).toBe(false);
    expect(isComparableVersion("v")).toBe(false);
  });
});

describe("migrateLegacyUpdateSourceUrl", () => {
  it("rewrites the deprecated mcsmanager.com default to the GitHub Release manifest", () => {
    expect(migrateLegacyUpdateSourceUrl(LEGACY_DEFAULT_UPDATE_SOURCE_URL)).toBe(
      DEFAULT_UPDATE_SOURCE_URL
    );
    expect(migrateLegacyUpdateSourceUrl(`  ${LEGACY_DEFAULT_UPDATE_SOURCE_URL}  `)).toBe(
      DEFAULT_UPDATE_SOURCE_URL
    );
    expect(DEFAULT_UPDATE_SOURCE_URL).toBe(
      "https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_update_manifest.json"
    );
  });

  it("leaves operator-customized URLs and empty values untouched", () => {
    expect(migrateLegacyUpdateSourceUrl("https://mirror.example.com/manifest.json")).toBe(
      "https://mirror.example.com/manifest.json"
    );
    expect(migrateLegacyUpdateSourceUrl(DEFAULT_UPDATE_SOURCE_URL)).toBe(DEFAULT_UPDATE_SOURCE_URL);
    expect(migrateLegacyUpdateSourceUrl("")).toBe("");
    expect(migrateLegacyUpdateSourceUrl(undefined)).toBe("");
  });

  it("pins the legacy URL as the default backup source value", () => {
    expect(LEGACY_DEFAULT_UPDATE_SOURCE_URL).toBe("https://mcsmanager.com/upgrade/manifest.json");
  });
});

describe("fetchJsonFromSources", () => {
  const hits: Record<string, number> = {};
  let server: http.Server;
  let base = "";

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const url = String(req.url || "");
      hits[url] = (hits[url] || 0) + 1;
      if (url === "/ok") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: 1 }));
      } else if (url === "/badjson") {
        res.writeHead(200, { "content-type": "text/html" });
        res.end("<html>not json</html>");
      } else if (url === "/hang") {
        // never respond: exercises the socket-inactivity timeout
      } else {
        res.writeHead(404);
        res.end("missing");
      }
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const addr = server.address();
    if (typeof addr === "object" && addr) base = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const deadUrl = (p: string) => `http://127.0.0.1:1${p}`;

  it("returns the primary payload without touching the fallback", async () => {
    const r = await fetchJsonFromSources(`${base}/ok`, deadUrl("/backup"), 2000);
    expect(r.data).toEqual({ ok: 1 });
    expect(r.sourceUrl).toBe(`${base}/ok`);
    expect(r.usedFallback).toBe(false);
  });

  it("falls back after a connection error on the primary", async () => {
    const r = await fetchJsonFromSources(deadUrl("/primary"), `${base}/ok`, 2000);
    expect(r.data).toEqual({ ok: 1 });
    expect(r.sourceUrl).toBe(`${base}/ok`);
    expect(r.usedFallback).toBe(true);
  });

  it("falls back after an HTTP error on the primary", async () => {
    const r = await fetchJsonFromSources(`${base}/missing`, `${base}/ok`, 2000);
    expect(r.data).toEqual({ ok: 1 });
    expect(r.sourceUrl).toBe(`${base}/ok`);
    expect(r.usedFallback).toBe(true);
  });

  it("falls back after invalid JSON on the primary", async () => {
    const r = await fetchJsonFromSources(`${base}/badjson`, `${base}/ok`, 2000);
    expect(r.data).toEqual({ ok: 1 });
    expect(r.sourceUrl).toBe(`${base}/ok`);
    expect(r.usedFallback).toBe(true);
  });

  it("falls back after a timeout on the primary", async () => {
    const r = await fetchJsonFromSources(`${base}/hang`, `${base}/ok`, 250);
    expect(r.data).toEqual({ ok: 1 });
    expect(r.sourceUrl).toBe(`${base}/ok`);
    expect(r.usedFallback).toBe(true);
  });

  it("uses the backup directly when the primary is empty", async () => {
    const r = await fetchJsonFromSources("   ", `${base}/ok`, 2000);
    expect(r.data).toEqual({ ok: 1 });
    expect(r.sourceUrl).toBe(`${base}/ok`);
    expect(r.usedFallback).toBe(false);
  });

  it("tries a duplicated candidate only once", async () => {
    const before = hits["/ok"] || 0;
    const r = await fetchJsonFromSources(`${base}/ok`, `${base}/ok`, 2000);
    expect(r.data).toEqual({ ok: 1 });
    expect(r.usedFallback).toBe(false);
    expect((hits["/ok"] || 0) - before).toBe(1);
  });

  it("aggregates every attempt when all sources fail", async () => {
    const err = await fetchJsonFromSources(deadUrl("/primary"), `${base}/missing`, 2000).then(
      () => null,
      (e: Error) => e
    );
    expect(err).toBeTruthy();
    expect(err!.message).toContain("All update sources failed");
    expect(err!.message).toContain(deadUrl("/primary"));
    expect(err!.message).toContain(`${base}/missing`);
  });

  it("rejects when no source is configured", async () => {
    const err = await fetchJsonFromSources("", "  ", 2000).then(
      () => null,
      (e: Error) => e
    );
    expect(err?.message).toBe("No update source configured");
  });
});

describe("extractTarGz", () => {
  it("extracts files and nested directories", async () => {
    const dir = tmpDir("mcsm-tgz-src-");
    const dest = tmpDir("mcsm-tgz-dest-");
    try {
      const tgz = makeTarGz(path.join(dir, "pkg.tar.gz"), [
        { name: "app.js", content: "console.log(1);" },
        { name: "package.json", content: '{"version":"1.0.0"}' },
        { name: "public/", type: "directory" },
        { name: "public/index.html", content: "<html></html>" }
      ]);
      await extractTarGz(tgz, dest);
      expect(fs.readFileSync(path.join(dest, "app.js"), "utf-8")).toBe("console.log(1);");
      expect(JSON.parse(fs.readFileSync(path.join(dest, "package.json"), "utf-8")).version).toBe(
        "1.0.0"
      );
      expect(fs.readFileSync(path.join(dest, "public", "index.html"), "utf-8")).toBe("<html></html>");
    } finally {
      fs.removeSync(dir);
      fs.removeSync(dest);
    }
  });

  it("interoperates with system tar archives (GNU tar / bsdtar)", async () => {
    const dir = tmpDir("mcsm-tgz-sys-");
    const dest = tmpDir("mcsm-tgz-sys-dest-");
    try {
      fs.writeFileSync(path.join(dir, "app.js"), "sys-tar-marker");
      fs.mkdirSync(path.join(dir, "public"));
      fs.writeFileSync(path.join(dir, "public", "index.html"), "sys-public");
      const tgz = path.join(dir, "sys.tar.gz");
      const res = spawnSync("tar", ["-czf", tgz, "-C", dir, "app.js", "public"], {
        encoding: "utf-8"
      });
      expect(res.error ?? res.stderr ?? "").toBe("");
      await extractTarGz(tgz, dest);
      expect(fs.readFileSync(path.join(dest, "app.js"), "utf-8")).toBe("sys-tar-marker");
      expect(fs.readFileSync(path.join(dest, "public", "index.html"), "utf-8")).toBe("sys-public");
    } finally {
      fs.removeSync(dir);
      fs.removeSync(dest);
    }
  });

  it("rejects traversal entries and writes nothing outside destDir", async () => {
    const dir = tmpDir("mcsm-tgz-slip-");
    const dest = path.join(dir, "dest");
    fs.mkdirSync(dest);
    try {
      const tgz = makeTarGz(path.join(dir, "evil.tar.gz"), [
        { name: "app.js", content: "innocent" },
        { name: "../evil.txt", content: "pwned" }
      ]);
      await expect(extractTarGz(tgz, dest)).rejects.toThrow(/tar-slip|escape/i);
      expect(fs.existsSync(path.join(dir, "evil.txt"))).toBe(false);
      expect(fs.existsSync(path.join(dest, "..", "evil.txt"))).toBe(false);
    } finally {
      fs.removeSync(dir);
    }
  });

  it("rejects absolute-path entries", async () => {
    const dir = tmpDir("mcsm-tgz-abs-");
    const dest = path.join(dir, "dest");
    fs.mkdirSync(dest);
    try {
      const tgz = makeTarGz(path.join(dir, "abs.tar.gz"), [
        { name: "/etc/evil.txt", content: "pwned" }
      ]);
      await expect(extractTarGz(tgz, dest)).rejects.toThrow(/tar-slip|escape/i);
    } finally {
      fs.removeSync(dir);
    }
  });

  it("rejects symlink and hardlink entries", async () => {
    const dir = tmpDir("mcsm-tgz-link-");
    const dest = path.join(dir, "dest");
    fs.mkdirSync(dest);
    try {
      const sym = makeTarGz(path.join(dir, "sym.tar.gz"), [
        { name: "app.js", content: "x" },
        { name: "link", type: "symlink", linkname: "/etc/passwd" }
      ]);
      await expect(extractTarGz(sym, dest)).rejects.toThrow(/unsupported tar entry/i);
      const hard = makeTarGz(path.join(dir, "hard.tar.gz"), [
        { name: "app.js", content: "x" },
        { name: "link", type: "hardlink", linkname: "../outside" }
      ]);
      await expect(extractTarGz(hard, dest)).rejects.toThrow(/unsupported tar entry/i);
    } finally {
      fs.removeSync(dir);
    }
  });
});

describe("extractArchive", () => {
  it("dispatches .tar.gz/.tgz to tar extraction", async () => {
    const dir = tmpDir("mcsm-arc-tgz-");
    const dest = path.join(dir, "dest");
    fs.mkdirSync(dest);
    try {
      for (const name of ["pkg.tar.gz", "pkg.tgz"]) {
        const tgz = makeTarGz(path.join(dir, name), [{ name: "app.js", content: name }]);
        await extractArchive(tgz, dest);
        expect(fs.readFileSync(path.join(dest, "app.js"), "utf-8")).toBe(name);
      }
    } finally {
      fs.removeSync(dir);
    }
  });

  it("dispatches .zip to zip extraction", async () => {
    const dir = tmpDir("mcsm-arc-zip-");
    const dest = path.join(dir, "dest");
    fs.mkdirSync(dest);
    try {
      const zip = makeZip(path.join(dir, "pkg.zip"), [
        { name: "app.js", content: "zip-marker" },
        { name: "package.json", content: '{"version":"2.0.0"}' }
      ]);
      await extractArchive(zip, dest);
      expect(fs.readFileSync(path.join(dest, "app.js"), "utf-8")).toBe("zip-marker");
      expect(JSON.parse(fs.readFileSync(path.join(dest, "package.json"), "utf-8")).version).toBe(
        "2.0.0"
      );
    } finally {
      fs.removeSync(dir);
    }
  });

  it("rejects unknown archive extensions", async () => {
    const dir = tmpDir("mcsm-arc-unk-");
    try {
      await expect(extractArchive(path.join(dir, "pkg.7z"), dir)).rejects.toThrow(
        /unsupported update package format/i
      );
    } finally {
      fs.removeSync(dir);
    }
  });
});
