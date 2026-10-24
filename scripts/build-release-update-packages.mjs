// Build the GitHub Release "update" packages + update manifest.
//
// Produces, from an existing production-code/ build (see build.sh):
//
//   mcsmanager_daemon_update.tar.gz   (app.js, app.js.map, package.json at archive root)
//   mcsmanager_web_update.tar.gz      (app.js, app.js.map, package.json, public/)
//   mcsmanager_update_manifest.json   (auto-update manifest: per-side version/url/notes)
//
// The packages carry ONLY the built application code: no dependency trees, no
// PTY/Zip-Tools binaries (daemon/lib), no Node.js runtime, no startup scripts.
// The daemon overlay therefore never touches target-specific binaries.
//
// The manifest keeps the auto-update schema consumed by
// panel/daemon/src/service/upgrade_service.ts; its `url` fields are pinned to
// the release tag so a manifest can never reference another release's packages.
//
// Usage:
//   node scripts/build-release-update-packages.mjs --tag v10.21.2 [options]
// Options:
//   --tag <tag>          release tag (required; GITHUB_REF_NAME is the fallback)
//   --repo <owner/repo>  GitHub repository for the package URLs (default MCSManager/MCSManager)
//   --prod <dir>         production-code directory (default ./production-code)
//   --out <dir>          output directory (default current directory)
//   --notes <text>       release notes for the manifest `notes` field
//   --notes-file <path>  read the release notes from a file
//   RELEASE_BODY env var is used when neither notes option is given.

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith("--")) continue;
  args.set(a.slice(2), process.argv[++i] ?? "");
}

const tag = (args.get("tag") || process.env.GITHUB_REF_NAME || "").trim();
const repo = (args.get("repo") || "MCSManager/MCSManager").trim();
const prodDir = path.resolve(args.get("prod") || "production-code");
const outDir = path.resolve(args.get("out") || ".");
const notes = (
  args.get("notes-file")
    ? fs.readFileSync(args.get("notes-file"), "utf-8")
    : args.get("notes") || process.env.RELEASE_BODY || ""
).trim();

const REPO_URL = `https://github.com/${repo}`;
const PACKAGES = [
  {
    archive: "mcsmanager_daemon_update.tar.gz",
    side: "daemon",
    dir: "daemon",
    files: ["app.js", "app.js.map", "package.json"],
    allowPrefix: []
  },
  {
    archive: "mcsmanager_web_update.tar.gz",
    side: "web",
    dir: "web",
    files: ["app.js", "app.js.map", "package.json", "public"],
    allowPrefix: ["public/"]
  }
];

function fail(msg) {
  console.error(`[release-update-packages] ERROR: ${msg}`);
  process.exit(1);
}

function listArchive(archivePath) {
  return execFileSync("tar", ["-tzf", archivePath], { encoding: "utf-8" })
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\.\//, "").replace(/\/+$/, ""))
    .filter((line) => line.length > 0);
}

function assertAllowlist(pkg, entries) {
  const exact = new Set(pkg.files.filter((f) => !pkg.allowPrefix.includes(f + "/")));
  const seen = new Set(entries);
  for (const name of seen) {
    if (name.includes("..") || path.posix.isAbsolute(name) || path.win32.isAbsolute(name)) {
      fail(`${pkg.archive}: entry escapes the archive root: ${name}`);
    }
    if (exact.has(name)) continue;
    if (pkg.allowPrefix.some((p) => name.startsWith(p) || name === p.slice(0, -1))) continue;
    fail(`${pkg.archive}: unexpected entry (violates the code-only allowlist): ${name}`);
  }
  for (const f of exact) {
    if (!seen.has(f)) fail(`${pkg.archive}: required file missing from archive: ${f}`);
  }
  if (pkg.allowPrefix.length && !seen.has(pkg.allowPrefix[0].slice(0, -1))) {
    fail(`${pkg.archive}: required directory missing from archive: ${pkg.allowPrefix[0].slice(0, -1)}`);
  }
}

if (!tag) fail("missing --tag (release tag), e.g. --tag v10.21.2");

const versions = {};
for (const pkg of PACKAGES) {
  const srcDir = path.join(prodDir, pkg.dir);
  for (const f of pkg.files) {
    const p = path.join(srcDir, f);
    if (!fs.existsSync(p)) fail(`missing build output: ${p}`);
  }
  const pkgJson = JSON.parse(fs.readFileSync(path.join(srcDir, "package.json"), "utf-8"));
  if (!pkgJson.version) fail(`no version in ${path.join(srcDir, "package.json")}`);
  versions[pkg.side] = String(pkgJson.version);
}

fs.mkdirSync(outDir, { recursive: true });

const manifest = {};
for (const pkg of PACKAGES) {
  const srcDir = path.join(prodDir, pkg.dir);
  const archivePath = path.join(outDir, pkg.archive);
  fs.rmSync(archivePath, { force: true });
  execFileSync("tar", ["-czf", archivePath, "-C", srcDir, ...pkg.files], { stdio: "ignore" });
  assertAllowlist(pkg, listArchive(archivePath));

  const entry = {
    version: versions[pkg.side],
    url: `${REPO_URL}/releases/download/${tag}/${pkg.archive}`
  };
  if (notes) entry.notes = notes;
  manifest[pkg.side] = entry;

  console.log(
    `[release-update-packages] ${pkg.archive} <- v${versions[pkg.side]}  (${(
      fs.statSync(archivePath).size /
      1024 /
      1024
    ).toFixed(1)} MB, allowlist ok)`
  );
}

const manifestPath = path.join(outDir, "mcsmanager_update_manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`[release-update-packages] mcsmanager_update_manifest.json written (tag ${tag}).`);
console.log(`[release-update-packages] outputs in: ${outDir}`);
