// Build the local "update" tar.gz packages + manifest used to verify the auto-update feature.
//
// The reported version is read at RUNTIME from package.json (see common/upgrade.ts
// and daemon/panel version.ts), so the update package simply ships the current
// app.js plus a package.json whose version has been bumped. After the update the
// process restarts, reads the bumped package.json, and reports the new version.
//
//   scripts/update-packages/manifest.json
//   scripts/update-packages/daemon.tar.gz  (app.js + app.js.map + package.json @ <bumped> + OVERLAY_MARKER.txt)
//   scripts/update-packages/web.tar.gz     (app.js + app.js.map + package.json @ <bumped> + public/ + OVERLAY_MARKER.txt)

import fs from "fs";
import path from "path";
import { bumpPatch, makeTarGz } from "./auto-update-test-utils.mjs";

const repo = path.resolve(import.meta.dirname, "..");
const prod = path.join(repo, "production-code");
const outDir = path.join(import.meta.dirname, "update-packages");

const prodVersion = (name) =>
  String(JSON.parse(fs.readFileSync(path.join(prod, name, "package.json"), "utf-8")).version);
// The packages ship the CURRENT build with the version bumped one patch, so a
// running install at the baseline version always sees the package as "newer".
// Override with --daemon-version / --web-version when a specific number is needed.
const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  if (process.argv[i]?.startsWith("--")) args.set(process.argv[i].slice(2), process.argv[i + 1] ?? "");
}
const DAEMON_NEW_VERSION = args.get("daemon-version") || bumpPatch(prodVersion("daemon"));
const WEB_NEW_VERSION = args.get("web-version") || bumpPatch(prodVersion("web"));
const PORT = 9999;

// Per-entry release notes ("notes") shown by the web UI after a version scan.
// notes is a locale -> text map keyed by RUNTIME locale codes (lowercase region,
// e.g. "en_us", "zh_cn"); the UI picks the user's panel language and falls back
// to English ("en_us") when missing. A plain string is also accepted as a
// language-neutral fallback.
const DAEMON_NOTES = {
  en_us: `MCSManager Daemon v${DAEMON_NEW_VERSION}
- Auto Update: manifest entries now carry multi-language release notes for the new version
- Improved instance startup stability
- Bug fixes and performance improvements`,
  zh_cn: `MCSManager 守护进程 v${DAEMON_NEW_VERSION}
- 自动更新：manifest 条目现携带多语言的新版本更新说明
- 提升实例启动稳定性
- 问题修复与性能改进`
};
const WEB_NOTES = {
  en_us: `MCSManager Panel v${WEB_NEW_VERSION}
- Auto Update: the Settings page now shows the new version's multi-language release notes when an update is scanned
- Improved auto-update reliability and error reporting
- UI fixes and performance improvements`,
  zh_cn: `MCSManager 面板 v${WEB_NEW_VERSION}
- 自动更新：设置页扫描到新版本时展示新版本的多语言更新说明
- 提升自动更新可靠性与错误反馈
- 界面修复与性能改进`
};

function bumpPkg(src, newVersion) {
  const pkg = JSON.parse(fs.readFileSync(src, "utf-8"));
  pkg.version = newVersion;
  return pkg;
}

function stageAndZip(name, newVersion, includePublic) {
  const staging = path.join(outDir, "__stage_" + name);
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });

  fs.copyFileSync(path.join(prod, name, "app.js"), path.join(staging, "app.js"));
  fs.copyFileSync(path.join(prod, name, "app.js.map"), path.join(staging, "app.js.map"));
  fs.writeFileSync(
    path.join(staging, "package.json"),
    JSON.stringify(bumpPkg(path.join(prod, name, "package.json"), newVersion), null, 2)
  );
  // An arbitrary marker file ships at the package root. The old hard-coded
  // whitelist (app.js/package.json/app.js.map/public) would NOT have copied it;
  // the overlay-everything mechanism does, so its presence after an update
  // proves "whatever the package ships gets overlaid".
  fs.writeFileSync(
    path.join(staging, "OVERLAY_MARKER.txt"),
    `MCSManager auto-update overlay marker for ${name} v${newVersion}. This file is only ever shipped inside an update package; its presence in the install dir proves the whole package was overlaid (not just a fixed file list).\n`
  );
  const entries = ["app.js", "app.js.map", "package.json", "OVERLAY_MARKER.txt"];
  if (includePublic) {
    fs.cpSync(path.join(prod, name, "public"), path.join(staging, "public"), { recursive: true });
    entries.push("public");
  }

  const packPath = path.join(outDir, name + ".tar.gz");
  fs.rmSync(packPath, { force: true });
  makeTarGz(packPath, entries, staging);
  fs.rmSync(staging, { recursive: true, force: true });
  console.log(
    `${name}.tar.gz -> v${newVersion}  (${(fs.statSync(packPath).size / 1024 / 1024).toFixed(1)} MB)`
  );
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

stageAndZip("daemon", DAEMON_NEW_VERSION, false);
stageAndZip("web", WEB_NEW_VERSION, true);

const manifest = {
  daemon: {
    version: DAEMON_NEW_VERSION,
    url: `http://localhost:${PORT}/daemon.tar.gz`,
    notes: DAEMON_NOTES
  },
  web: {
    version: WEB_NEW_VERSION,
    url: `http://localhost:${PORT}/web.tar.gz`,
    notes: WEB_NOTES
  }
};
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`manifest.json written.\n\nUpdate packages ready in: ${outDir}`);
