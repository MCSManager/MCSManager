import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { world } from "./world";

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// List panel user file names on disk (panel/data/User/*.json => userName field).
export function diskUsers(): string[] {
  const dir = path.join(world.workDir, "panel/data/User");
  if (!dir || !fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const f of fs.readdirSync(dir)) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      if (j.userName) out.push(j.userName);
    } catch {
      /* skip */
    }
  }
  return out;
}

export interface WaitOpts {
  timeout?: number;
  interval?: number;
  msg?: string;
}

export async function waitFor<T>(fn: () => T | Promise<T>, opts: WaitOpts = {}): Promise<T> {
  const timeout = opts.timeout ?? 60000;
  const interval = opts.interval ?? 500;
  const end = Date.now() + timeout;
  let lastErr: any;
  while (Date.now() < end) {
    try {
      const r = await fn();
      if (r) return r;
    } catch (e) {
      lastErr = e;
    }
    await sleep(interval);
  }
  throw new Error((opts.msg || "waitFor timeout") + (lastErr ? ` last=${lastErr?.message}` : ""));
}

// ---- minimal STORE-mode zip builder (no deps; supports arbitrary entry names
//      including "../" for zip-slip tests) ----
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

export interface ZipEntry {
  name: string;
  content: Buffer | string;
}

// Build a standard zip for FLAT entry names. Prefers the system `zip` command
// (deflate); when `zip` is not installed it falls back to a dependency-free
// deflate writer. The daemon's golang file_zip binary reliably extracts both.
// For malicious `../` entries (zip-slip) use buildZip (hasZipSlip rejects
// before extraction).
export function buildZipSystem(outPath: string, entries: ZipEntry[]): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-zip-"));
  try {
    for (const e of entries) {
      const data = Buffer.isBuffer(e.content) ? e.content : Buffer.from(String(e.content), "utf-8");
      fs.writeFileSync(path.join(tmp, e.name), data);
    }
    const res = spawnSync("zip", ["-r", "-X", "-q", outPath, ...entries.map((e) => e.name)], { cwd: tmp });
    // res.error is set (ENOENT) when the `zip` binary is not installed; in that
    // case (or any non-zero exit) build the archive ourselves.
    if (!res.error && res.status === 0) return outPath;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return buildZip(outPath, entries, 8);
}

// Build a valid zip at outPath. Reproducible, zero dependencies.
// method 0 = STORE, 8 = DEFLATE (zlib).
export function buildZip(outPath: string, entries: ZipEntry[], method: 0 | 8 = 0): string {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, "utf8");
    const data = Buffer.isBuffer(e.content) ? e.content : Buffer.from(String(e.content), "utf-8");
    const comp = method === 8 ? zlib.deflateRawSync(data) : data;
    const crc = crc32(data);
    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4);
    lfh.writeUInt16LE(0, 6);
    lfh.writeUInt16LE(method, 8);
    lfh.writeUInt16LE(0, 10);
    lfh.writeUInt16LE(0, 12);
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(comp.length, 18);
    lfh.writeUInt32LE(data.length, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28);
    const localOffset = offset;
    parts.push(lfh, nameBuf, comp);
    offset += lfh.length + nameBuf.length + comp.length;
    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0);
    cdh.writeUInt16LE(20, 4);
    cdh.writeUInt16LE(20, 6);
    cdh.writeUInt16LE(0, 8);
    cdh.writeUInt16LE(method, 10);
    cdh.writeUInt16LE(0, 12);
    cdh.writeUInt16LE(0, 14);
    cdh.writeUInt32LE(crc, 16);
    cdh.writeUInt32LE(comp.length, 20);
    cdh.writeUInt32LE(data.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt16LE(0, 30);
    cdh.writeUInt16LE(0, 32);
    cdh.writeUInt16LE(0, 34);
    cdh.writeUInt16LE(0, 36);
    cdh.writeUInt32LE(0, 38);
    cdh.writeUInt32LE(localOffset, 42);
    central.push(cdh, nameBuf);
  }
  const centralOffset = offset;
  let centralSize = 0;
  for (const c of central) centralSize += c.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);
  fs.writeFileSync(outPath, Buffer.concat([...parts, ...central, eocd]));
  return outPath;
}
