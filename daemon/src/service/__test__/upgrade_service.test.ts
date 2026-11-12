import fs from "fs-extra";
import http from "http";
import os from "os";
import path from "path";
import zlib from "zlib";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

function tarHeader(name: string, size: number): Buffer {
  const buf = Buffer.alloc(512);
  buf.write(name, 0, 100, "utf-8");
  buf.write("0000644\0", 100, 8, "utf-8");
  buf.write("0000000\0", 108, 8, "utf-8");
  buf.write("0000000\0", 116, 8, "utf-8");
  buf.write(size.toString(8).padStart(11, "0") + "\0", 124, 12, "utf-8");
  buf.write("00000000000\0", 136, 12, "utf-8");
  buf.write("        ", 148, 8, "utf-8");
  buf.write("0", 156, 1, "utf-8");
  buf.write("ustar\0", 257, 6, "utf-8");
  buf.write("00", 263, 2, "utf-8");
  let sum = 0;
  for (const b of buf) sum += b;
  buf.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "utf-8");
  return buf;
}

function makeDaemonTarGz(filePath: string, version: string): void {
  const files = [
    { name: "app.js", content: `// daemon ${version}\n` },
    { name: "package.json", content: JSON.stringify({ name: "mcsmanager-daemon", version }) }
  ];
  const parts: Buffer[] = [];
  for (const f of files) {
    const data = Buffer.from(f.content, "utf-8");
    parts.push(tarHeader(f.name, data.length));
    parts.push(data);
    const pad = (512 - (data.length % 512)) % 512;
    if (pad) parts.push(Buffer.alloc(pad));
  }
  parts.push(Buffer.alloc(1024));
  fs.writeFileSync(filePath, zlib.gzipSync(Buffer.concat(parts)));
}

let tmpDir = "";
let originalCwd = "";
let server: http.Server;
let baseUrl = "";
let globalConfiguration: typeof import("../../entity/config").globalConfiguration;
let initVersionManager: typeof import("../version").initVersionManager;
let getVersion: typeof import("../version").getVersion;
let getUpgradeInfo: typeof import("../upgrade_service").getUpgradeInfo;
let performUpgrade: typeof import("../upgrade_service").performUpgrade;
let runStartupAutoUpdateIfEnabled: typeof import("../upgrade_service").runStartupAutoUpdateIfEnabled;

beforeAll(async () => {
  originalCwd = process.cwd();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-daemon-upgrade-test-"));
  process.chdir(tmpDir);

  const pkgTgz = path.join(tmpDir, "daemon_4.19.3.tar.gz");
  makeDaemonTarGz(pkgTgz, "4.19.3");

  server = http.createServer((req, res) => {
    if (req.url === "/manifest.json") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          daemon: {
            version: "4.19.3",
            url: `${baseUrl}/daemon.tar.gz`,
            notes: "Fix release"
          }
        })
      );
    } else if (req.url === "/daemon.tar.gz") {
      res.writeHead(200, { "content-type": "application/gzip" });
      fs.createReadStream(pkgTgz).pipe(res);
    } else {
      res.writeHead(404);
      res.end("not found");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const addr = server.address();
  if (typeof addr === "object" && addr) baseUrl = `http://127.0.0.1:${addr.port}`;

  ({ globalConfiguration } = await import("../../entity/config"));
  ({ initVersionManager, getVersion } = await import("../version"));
  ({ getUpgradeInfo, performUpgrade, runStartupAutoUpdateIfEnabled } = await import(
    "../upgrade_service"
  ));
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  process.chdir(originalCwd);
  fs.removeSync(tmpDir);
});

beforeEach(() => {
  globalConfiguration.config.updateSourceUrl = `${baseUrl}/manifest.json`;
  globalConfiguration.config.updateSourceUrlFallback = "";
  globalConfiguration.config.autoUpdateOnStart = false;
});

describe("daemon upgrade_service", () => {
  it("detects and applies 4.19.3 over retracted 4.21.0 daemon version", async () => {
    fs.writeJsonSync(path.join(tmpDir, "package.json"), {
      name: "mcsmanager-daemon",
      version: "4.21.0"
    });
    fs.writeFileSync(path.join(tmpDir, "app.js"), "// old 4.21.0");
    initVersionManager();
    expect(getVersion()).toBe("4.21.0");

    const info = await getUpgradeInfo();
    expect(info.updateAvailable).toBe(true);
    expect(info.onlineVersion).toBe("4.19.3");

    const res = await performUpgrade();
    expect(res.started).toBe(true);
    expect(res.onlineVersion).toBe("4.19.3");
    expect(fs.readJsonSync(path.join(tmpDir, "package.json")).version).toBe("4.19.3");
  });

  it("runStartupAutoUpdateIfEnabled is a no-op when disabled", async () => {
    const res = await runStartupAutoUpdateIfEnabled(["node", "app.js"]);
    expect(res).toBeNull();
  });

  it("runStartupAutoUpdateIfEnabled updates and refreshes version when enabled via config or CLI flag", async () => {
    fs.writeJsonSync(path.join(tmpDir, "package.json"), {
      name: "mcsmanager-daemon",
      version: "4.19.2"
    });
    fs.writeFileSync(path.join(tmpDir, "app.js"), "// old 4.19.2");
    initVersionManager();
    expect(getVersion()).toBe("4.19.2");

    const res = await runStartupAutoUpdateIfEnabled(["node", "app.js", "--auto-update"]);
    expect(res?.started).toBe(true);
    expect(getVersion()).toBe("4.19.3");
  });

  it("runStartupAutoUpdateIfEnabled swallows errors when offline so startup continues", async () => {
    globalConfiguration.config.autoUpdateOnStart = true;
    globalConfiguration.config.updateSourceUrl = "http://127.0.0.1:1/unreachable.json";
    const res = await runStartupAutoUpdateIfEnabled(["node", "app.js"]);
    expect(res).toBeNull();
  });
});
