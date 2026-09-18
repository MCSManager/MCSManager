// Build the local "update" zip packages + manifest used to verify the auto-update feature.
//
// The reported version is read at RUNTIME from package.json (see common/upgrade.ts
// and daemon/panel version.ts), so the update package simply ships the current
// app.js plus a package.json whose version has been bumped. After the update the
// process restarts, reads the bumped package.json, and reports the new version.
//
//   scripts/update-packages/manifest.json
//   scripts/update-packages/daemon.zip  (app.js + app.js.map + package.json @ 4.18.4 + OVERLAY_MARKER.txt)
//   scripts/update-packages/web.zip     (app.js + app.js.map + package.json @ 10.18.4 + public/ + OVERLAY_MARKER.txt)

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const repo = path.resolve(import.meta.dirname, "..");
const prod = path.join(repo, "production-code");
const outDir = path.join(import.meta.dirname, "update-packages");

const DAEMON_NEW_VERSION = "4.18.4";
const WEB_NEW_VERSION = "10.18.4";
const PORT = 9999;

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
    `MCSManager auto-update overlay marker for ${name} v${newVersion}. This file is only ever shipped inside an update zip; its presence in the install dir proves the whole package was overlaid (not just a fixed file list).\n`
  );
  const entries = ["app.js", "app.js.map", "package.json", "OVERLAY_MARKER.txt"];
  if (includePublic) {
    fs.cpSync(path.join(prod, name, "public"), path.join(staging, "public"), { recursive: true });
    entries.push("public");
  }

  const zipPath = path.join(outDir, name + ".zip");
  fs.rmSync(zipPath, { force: true });
  execSync(`zip -rq ${JSON.stringify(zipPath)} ${entries.map((e) => JSON.stringify(e)).join(" ")}`, {
    cwd: staging
  });
  fs.rmSync(staging, { recursive: true, force: true });
  console.log(`${name}.zip -> v${newVersion}  (${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(1)} MB)`);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

stageAndZip("daemon", DAEMON_NEW_VERSION, false);
stageAndZip("web", WEB_NEW_VERSION, true);

const manifest = {
  daemon: { version: DAEMON_NEW_VERSION, url: `http://localhost:${PORT}/daemon.zip` },
  web: { version: WEB_NEW_VERSION, url: `http://localhost:${PORT}/web.zip` }
};
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`manifest.json written.\n\nUpdate packages ready in: ${outDir}`);
