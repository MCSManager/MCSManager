#!/usr/bin/env node
import { existsSync, readdirSync } from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../../..");

const SUITES = ["auth", "user", "instance", "files", "streams", "docker"];

// docker.test.ts executes only on Linux + a reachable dockerd. The suite's own
// `dockerIt = dockerOk ? it : it.skip` already visibly skips `it`s off-Linux, but
// invoking vitest still boots a fresh daemon+panel for it (~12s wasted). Skip the
// docker suite at the runner level when Docker is unavailable to avoid that boot.
function dockerOk() {
  if (process.platform !== "linux") return false;
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function prereq() {
  const missing = [];
  for (const p of [
    "panel/production/app.js",
    "daemon/production/app.js",
    "panel/data/market_cache.json"
  ])
    if (!existsSync(path.join(REPO, p))) missing.push(p);
  // daemon/lib: require at least one pty + one file_zip binary for this platform
  const libDir = path.join(REPO, "daemon/lib");
  const libs = existsSync(libDir) ? readdirSync(libDir) : [];
  if (!libs.some((f) => /^pty_/.test(f))) missing.push("daemon/lib/pty_<os>_<arch>");
  if (!libs.some((f) => /^file_zip_/.test(f))) missing.push("daemon/lib/file_zip_<os>_<arch>");
  if (missing.length) {
    console.error("\n[run.mjs] Build prerequisite missing:\n  " + missing.join("\n  "));
    console.error(
      "\nBuild first:\n  cd common && npm run build && cd ../panel && npm run build && cd ../daemon && npm run build"
    );
    console.error(
      "(and install platform binaries via install-dependents.sh if daemon/lib is empty)\n"
    );
    process.exit(1);
  }
}

function runSuite(name) {
  const file = `test/integration/suites/${name}.test.ts`;
  console.log(`\n===== integration suite: ${name} =====`);
  const r = spawnSync(
    process.execPath,
    [
      "node_modules/vitest/vitest.mjs",
      "run",
      "--config",
      "test/integration/vitest.config.ts",
      file,
      "--reporter=verbose"
    ],
    { cwd: path.resolve(__dirname, "../.."), stdio: "inherit" }
  );
  return r.status;
}

prereq();
let failed = false;
const summary = [];
for (const name of SUITES) {
  if (name === "docker" && !dockerOk()) {
    summary.push("docker: SKIP (non-Linux / no Docker socket)");
    continue;
  }
  const status = runSuite(name);
  summary.push(`${name}: ${status === 0 ? "PASS" : "FAIL"}`);
  if (status !== 0) {
    failed = true;
    break;
  } // stop on first failure
}
console.log("\n===== integration summary =====\n" + summary.join("\n"));
process.exit(failed ? 1 : 0);
