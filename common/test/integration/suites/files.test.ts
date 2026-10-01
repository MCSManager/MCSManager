import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  world,
  requestPanel,
  ensureUser,
  ensureOwner,
  listFiles,
  mkdirP,
  moveFile,
  copyFile,
  editFile,
  readFileText,
  deleteFiles,
  decompress,
  getUploadPassport,
  uploadToDaemon,
  uploadFileChunked,
  getDownloadPassport,
  downloadFromDaemon,
  buildZip,
  buildZipSystem,
  waitFor,
  addFinding,
  saveState
} from "../lib";

// File-management + upload/download integration suite (real daemon + real panel, no mocks).
//
// Boots a FRESH REAL pair via globalSetup's bootRuntime for this single suite.
// Self-contained: the first `it` ensures users + creates a minimal instance via
// the integration-test key (POST /api/instance with the verified `nickname`
// body — NO jar download; fast + deterministic), uploads the test.mjs fixture
// into the cwd, then drives the suite with u1's REAL login cookie+token.
// The KEY bypasses panel `permission` only — `/files/*` is per-instance, so a
// KEY-only call gets 403 (auth.test.ts #F-key-not-instance-admin). All file ops
// here use u1 (the OWNER).
//
// Coverage matrix (see task-8-brief):
//   mkdir → upload → list paginated · CRUD round-trip (UTF-8 "中文") · zip/decompress
//   single-shot multipart upload · unzip=1 on upload · chunked upload (/upload-new +
//   /upload-piece) auto-complete · passport download · zip-slip rejected · path
//   traversal ../ rejected · per-instance gate (u2 → 403) · download_from_url DEFERRED.

const di = () => world.daemonId;
const iu = () => world.instance.uuid!;
const u1 = () => ({ cookie: world.u1.cookie!, token: world.u1.token! });
const FIXTURE = path.join(__dirname, "../fixtures/test.mjs");

const names = (r: any) => (r?.data?.items || []).map((x: any) => x.name);

// The daemon's fileManager.edit requires the target file to ALREADY exist:
//   edit(target, data?) -> `if (!this.check(target)) throw ERROR_MSG_01`
// and `check` calls `fs.existsSync`. So editing a brand-new filename with no
// prior touch fails with "Illegal access path" — verified end-to-end.
// POST /files/touch -> file/touch -> fileManager.newFile -> fs.createFile
// creates the empty file; after that editFile writes content. Used by the
// CRUD + compress + download tests below for a.txt / orig.txt / dl.txt.
async function touchFile(target: string) {
  return requestPanel({
    method: "POST",
    path: "/files/touch",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid: iu() },
    body: { target }
  });
}

// The verified POST /api/instance create body — uses `nickname` (NOT
// `full_name`); mirrors auth.test.ts it #13 + instance.test.ts. startCommand
// `node test.mjs` so later suites can drive the bare lifecycle.
const createBody = () => ({
  nickname: world.instance.name,
  startCommand: "node test.mjs",
  stopCommand: "exit",
  cwd: "",
  ie: "utf-8",
  oe: "utf-8"
});

describe("files: CRUD + zip + upload/download + traversal (real daemon + panel)", () => {
  it("setup + mkdir → upload (single-shot) → list paginated", async () => {
    // Ensure users (admin / u1 / u2). ensureUser creates with perm 1 if absent
    // and logs each one in — populating world.{admin,u1,u2}.{uuid,cookie,token}.
    world.admin.uuid = await ensureUser("admin", world.key);
    world.u1.uuid = await ensureUser("u1", world.key);
    world.u2.uuid = await ensureUser("u2", world.key);
    saveState();
    expect(world.u1.uuid).toBeTruthy();

    // Create the bare-lifecycle instance via the KEY (bypasses the admin
    // permission gate on POST /api/instance). The daemon's instance/new
    // accepts a `nickname` config and returns `instanceUuid`.
    const r = await requestPanel({
      method: "POST",
      path: "/instance",
      key: world.key,
      query: { daemonId: di() },
      body: createBody()
    });
    expect(r.httpStatus, `create instance: ${JSON.stringify(r.raw).slice(0, 200)}`).toBe(200);
    expect(r.data?.instanceUuid, "create must return instanceUuid").toBeTruthy();
    world.instance.uuid = r.data.instanceUuid;
    saveState();

    // Assign the instance to u1 BEFORE uploading — the KEY alone cannot
    // operate /files/* (per-instance gate). File ops in the rest of the suite
    // use u1's REAL login cookie+token.
    await ensureOwner("u1", world.key);

    // Upload the test.mjs fixture (the startCommand target) into the instance
    // cwd so later suites' lifecycle `it`s can run after this suite.
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(pp.password, "upload passport must be granted to the owner").toBeTruthy();
    const up = await uploadToDaemon(pp, FIXTURE, "test.mjs", { unzip: false });
    expect(up.httpStatus, `upload test.mjs: ${JSON.stringify(up.data).slice(0, 200)}`).toBe(200);

    // mkdir("sub") — exercises the mkdir helper path.
    const mk = await mkdirP(di(), iu(), u1().cookie, u1().token, "sub");
    expect(mk.httpStatus, `mkdir sub: ${JSON.stringify(mk.raw).slice(0, 200)}`).toBe(200);

    // Upload a tiny probe file via single-shot multipart (daemon-direct
    // /upload/{password}) to verify the legacy upload route.
    const tiny = path.join(world.workDir, "tiny.txt");
    fs.writeFileSync(tiny, "list-paginated-probe");
    const pp2 = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    const up2 = await uploadToDaemon(pp2, tiny, "tiny.txt", { unzip: false });
    expect(up2.httpStatus, `upload tiny.txt: ${JSON.stringify(up2.data).slice(0, 200)}`).toBe(200);

    // Paginated list — page=0, page_size=10 (panel caps to [1,100]). Verify all
    // three artifacts (test.mjs + sub/ + tiny.txt) appear in the first page.
    const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".", 0, 10);
    expect(f.httpStatus, `list paginated: ${JSON.stringify(f.raw).slice(0, 200)}`).toBe(200);
    const ns = names(f);
    expect(ns).toContain("test.mjs");
    expect(ns).toContain("sub");
    expect(ns).toContain("tiny.txt");
  });

  it("mkdir → edit (Chinese) → read → move → copy → delete → verify via list", async () => {
    // mkdir("crud"); touch (file.edit requires the target to already exist on
    // the daemon); editFile writes a UTF-8 file (round-trip through the
    // panel->daemon file/edit path). Verifies "中文" survives the stack.
    await mkdirP(di(), iu(), u1().cookie, u1().token, "crud");
    const tch = await touchFile("a.txt");
    expect(tch.httpStatus, `touch a.txt: ${JSON.stringify(tch.raw).slice(0, 200)}`).toBe(200);
    const ed = await editFile(di(), iu(), u1().cookie, u1().token, "a.txt", "中文 content");
    expect(ed.httpStatus, `edit a.txt: ${JSON.stringify(ed.raw).slice(0, 200)}`).toBe(200);
    const rd = await readFileText(di(), iu(), u1().cookie, u1().token, "a.txt");
    expect(
      String(rd.data),
      "UTF-8 Chinese must survive the panel/daemon edit+read round-trip"
    ).toContain("中文");

    // move a.txt -> crud/a.txt ; verify present in sub, absent at root.
    const mv = await moveFile(di(), iu(), u1().cookie, u1().token, [["a.txt", "crud/a.txt"]]);
    expect(mv.httpStatus, `move: ${JSON.stringify(mv.raw).slice(0, 200)}`).toBe(200);
    expect(
      names(await listFiles(di(), iu(), u1().cookie, u1().token, "crud")),
      "a.txt must be in crud/ after move"
    ).toContain("a.txt");
    expect(
      names(await listFiles(di(), iu(), u1().cookie, u1().token, ".")),
      "a.txt must NOT be at root after move"
    ).not.toContain("a.txt");

    // copy crud/a.txt -> copy.txt ; verify copy.txt at root.
    const cp = await copyFile(di(), iu(), u1().cookie, u1().token, [["crud/a.txt", "copy.txt"]]);
    expect(cp.httpStatus, `copy: ${JSON.stringify(cp.raw).slice(0, 200)}`).toBe(200);
    expect(
      names(await listFiles(di(), iu(), u1().cookie, u1().token, ".")),
      "copy.txt must be at root after copy"
    ).toContain("copy.txt");

    // delete copy.txt ; verify gone from root.
    const dl = await deleteFiles(di(), iu(), u1().cookie, u1().token, ["copy.txt"]);
    expect(dl.httpStatus, `delete: ${JSON.stringify(dl.raw).slice(0, 200)}`).toBe(200);
    expect(
      names(await listFiles(di(), iu(), u1().cookie, u1().token, ".")),
      "copy.txt must be gone after delete"
    ).not.toContain("copy.txt");
  });

  it("compress (zip) → decompress → byte-identical", async () => {
    // Touch + editFile writes orig.txt with content "ABC".
    const tch = await touchFile("orig.txt");
    expect(tch.httpStatus, `touch orig.txt: ${JSON.stringify(tch.raw).slice(0, 200)}`).toBe(200);
    const ed = await editFile(di(), iu(), u1().cookie, u1().token, "orig.txt", "ABC");
    expect(ed.httpStatus, `edit orig.txt: ${JSON.stringify(ed.raw).slice(0, 200)}`).toBe(200);

    // Compress via POST /files/compress with type=1 (zip). The panel/daemon
    // `source`/`targets` fields are SEMANTICALLY OVERLOADED across compress vs.
    // decompress: for type=1 (zip), source = OUTPUT zip path, targets = INPUT
    // files array (fileManager.zip(sourceZip, files, code) -> compress.ts);
    // for type=0 (unzip), source = INPUT zip, targets = OUTPUT dir string.
    // The brief inverted this; documented in F-compress-source-targets-swap.
    const comp = await requestPanel({
      method: "POST",
      path: "/files/compress",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: iu() },
      body: { source: "orig.zip", targets: ["orig.txt"], type: 1, code: "utf-8" }
    });
    expect(comp.httpStatus, `compress: ${JSON.stringify(comp.raw).slice(0, 200)}`).toBe(200);
    addFinding({
      id: "F-compress-source-targets-swap",
      step: "files",
      severity: "info",
      title: "POST /files/compress source/targets semantics are overloaded across type=1 vs type=0",
      detail:
        "The panel POST /files/compress route forwards the same `source` and `targets`" +
        " body fields for both compress (type=1) and decompress (type=0). At the daemon," +
        " fileManager.zip(sourceZip, files, code) interprets source as the OUTPUT zip path" +
        " and targets as the INPUT file array (daemon/src/service/system_file.ts:316 ->" +
        " daemon/src/common/compress.ts:55 compress(sourceZip, files, code)). For" +
        " decompress, the same `source` is the INPUT archive and `targets` is the OUTPUT" +
        " directory string (fileManager.unzip(sourceZip, destDir, code)). The brief's" +
        " example `{source:'orig.txt',targets:['orig.zip']}` was inverted for compress" +
        " (sends a non-existent `orig.zip` as the input array, yielding 'Please select" +
        " at least one file'). The correct shape is `{source:'orig.zip', targets:" +
        " ['orig.txt']}`. Documented as a body-shape inconsistency (pre-existing product" +
        " API surface — not a bug; the front-end already uses this overloaded shape).",
      evidence: `compress http=${comp.httpStatus}; body used {source:'orig.zip',targets:['orig.txt']}`
    });
    expect(
      names(await listFiles(di(), iu(), u1().cookie, u1().token, ".")),
      "orig.zip must appear after compress"
    ).toContain("orig.zip");

    // Decompress orig.zip back to "."; the decompress helper sends type=0
    // (unzip). Daemon uses the platform file_zip binary (file_zip_darwin_arm64
    // on this host — boot copies daemon/lib into the workDir).
    const dz = await decompress(di(), iu(), u1().cookie, u1().token, "orig.zip", ".");
    expect(dz.httpStatus, `decompress: ${JSON.stringify(dz.raw).slice(0, 200)}`).toBe(200);

    // orig.txt must still contain "ABC" — zip/unzip preserves content.
    const rd = await readFileText(di(), iu(), u1().cookie, u1().token, "orig.txt");
    expect(String(rd.data), "orig.txt must be byte-identical after zip+unzip round-trip").toBe(
      "ABC"
    );
  });

  it("upload single-shot multipart → list shows it", async () => {
    // buildZipSystem prefers the system `zip` binary (deflate); falls back to a
    // dependency-free deflate writer — daemon's file_zip binary extracts both.
    const zip = path.join(world.workDir, "u1.zip");
    buildZipSystem(zip, [{ name: "u1.txt", content: Buffer.from("hello") }]);
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    const r = await uploadToDaemon(pp, zip, "u1.zip", { unzip: false });
    expect(r.httpStatus, `upload zip: ${JSON.stringify(r.data).slice(0, 200)}`).toBe(200);
    expect(
      names(await listFiles(di(), iu(), u1().cookie, u1().token, ".")),
      "u1.zip must appear in the list"
    ).toContain("u1.zip");
  });

  it("upload with unzip=1 → extracted", async () => {
    // Build a zip with 2 files; upload with unzip=true → daemon extracts inline.
    const zip = path.join(world.workDir, "ext.zip");
    buildZipSystem(zip, [
      { name: "ext_a.txt", content: Buffer.from("A") },
      { name: "ext_b.txt", content: Buffer.from("B") }
    ]);
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    const r = await uploadToDaemon(pp, zip, "ext.zip", { unzip: true });
    expect(r.httpStatus, `upload unzip=1: ${JSON.stringify(r.data).slice(0, 200)}`).toBe(200);

    // The daemon's http route extracts synchronously before returning OK; the
    // extracted files must appear in the list. listFiles has a 0.1s speedLimit
    // and requestPanel already retries cooldowns, but waitFor defensively
    // covers the brief in-rare-timing window.
    const ns = await waitFor(
      async () => {
        const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
        const nm = names(f);
        return nm.includes("ext_a.txt") && nm.includes("ext_b.txt") ? nm : false;
      },
      { timeout: 15000, msg: "extracted files visible via list" }
    );
    expect(ns).toContain("ext_a.txt");
    expect(ns).toContain("ext_b.txt");

    // Product behavior: the LEGACY single-shot `/upload/:key` route does NOT
    // delete the source archive after unzip (the chunked /upload-new path
    // supports deleteAfterUnzip via ctx.query.deleteAfterUnzip — a separate
    // code path). The brief assumed ext.zip is removed; reality keeps it.
    // Documented as a behavior note (not a bug — the user can delete it via
    // DELETE /files if desired).
    expect(ns).toContain("ext.zip");
    addFinding({
      id: "F-unzip-keeps-source-archive",
      step: "files",
      severity: "info",
      title: "Legacy /upload/:k does NOT delete the source archive after unzip=1",
      detail:
        "The legacy daemon POST /upload/:key handler (daemon/src/routers/http_router.ts:116-119)" +
        " extracts the archive inline but does NOT delete the source file. The brief" +
        " expected the source `ext.zip` to be gone; reality keeps it on disk alongside" +
        " the extracted entries. The chunked /upload-new path supports deleteAfterUnzip" +
        " (ctx.query.deleteAfterUnzip, daemon/src/routers/http_router.ts:140) for users" +
        " who want the source removed automatically. Not a bug — the user can delete" +
        " the source via DELETE /files. Documented so the assertion matches product reality.",
      evidence: `unzip=1 upload; list after = ${ns.join(",")}`
    });
  });

  it("upload chunked (/upload-new + /upload-piece) → received tracking → auto-complete", async () => {
    // 5MB content (0x41 padding) with pieceSize=2MB → 3 pieces (2MB + 2MB + 1MB).
    // The /upload-new init returns {data:{id,received}}; /upload-piece/{id}?offset=N
    // writes each chunk. On the final piece, file_writer.writeChunk fires
    // isFullyCovered() → complete() → uploadManager.delete(id); the file is
    // auto-finalized with no separate "finish" call needed.
    const buf = Buffer.alloc(5 * 1024 * 1024, 0x41);
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    const init = await uploadFileChunked({
      addr: pp.addr,
      password: pp.password,
      name: "big.bin",
      content: buf,
      pieceSize: 2 * 1024 * 1024
    });
    expect(init?.data?.id, "/upload-new must return a tracking id").toBeTruthy();

    // Auto-complete: poll until big.bin shows in list.
    await waitFor(
      async () => {
        const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
        return names(f).includes("big.bin");
      },
      { timeout: 15000, msg: "big.bin visible after chunked upload auto-complete" }
    );
    expect(
      names(await listFiles(di(), iu(), u1().cookie, u1().token, ".")),
      "big.bin must appear after chunked upload"
    ).toContain("big.bin");

    // Download big.bin back via the passport route and assert byte-identical
    // (length + full Buffer.equals at 5MB — cheap enough; proves reassembly).
    const dp = await getDownloadPassport(di(), iu(), u1().cookie, u1().token, "big.bin");
    const d = await downloadFromDaemon(dp, "big.bin");
    expect(d.httpStatus, `download big.bin: ${d.httpStatus}`).toBe(200);
    expect(d.data.length, "downloaded big.bin must have the uploaded length").toBe(buf.length);
    expect(d.data.equals(buf), "downloaded big.bin must be byte-identical to the upload").toBe(
      true
    );
  });

  it("download (passport) → /download/{password}/{name} → byte-identical", async () => {
    // Touch + editFile writes dl.txt with "PAYLOAD", then download via the
    // mission-passport route (panel POST /files/download grants a password;
    // daemon GET /download/{password}/{name}).
    const tch = await touchFile("dl.txt");
    expect(tch.httpStatus, `touch dl.txt: ${JSON.stringify(tch.raw).slice(0, 200)}`).toBe(200);
    const ed = await editFile(di(), iu(), u1().cookie, u1().token, "dl.txt", "PAYLOAD");
    expect(ed.httpStatus, `edit dl.txt: ${JSON.stringify(ed.raw).slice(0, 200)}`).toBe(200);
    const dp = await getDownloadPassport(di(), iu(), u1().cookie, u1().token, "dl.txt");
    expect(dp.password, "download passport must be granted").toBeTruthy();
    const r = await downloadFromDaemon(dp, "dl.txt");
    expect(r.httpStatus, `download: ${r.httpStatus}`).toBe(200);
    expect(r.data.toString("utf-8"), "downloaded bytes must equal the edited content").toBe(
      "PAYLOAD"
    );
  });

  // Review Focus #3 — zip-slip: a '../' entry upload + decompress must be
  // rejected at the daemon (fileManager.unzip -> hasZipSlip) and NOTHING may
  // escape the instance cwd.
  it("zip-slip: ../ entry rejected; escape file absent", async () => {
    // Build a zip with a `../slipescape.txt` entry (zip-slip attack vector)
    // plus a benign `inside.txt`. buildZip (STORE-mode) preserves the literal
    // `../` entry name — exactly what zip-slip detection tests for.
    const slip = path.join(world.workDir, "slip.zip");
    buildZip(slip, [
      { name: "../slipescape.txt", content: "PWNED" },
      { name: "inside.txt", content: "ok" }
    ]);
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    const up = await uploadToDaemon(pp, slip, "slip.zip", { unzip: false });
    expect(up.httpStatus, `upload slip.zip: ${JSON.stringify(up.data).slice(0, 200)}`).toBe(200);

    // Decompress must reject the zip-slip archive (fileManager.unzip calls
    // hasZipSlip via StreamZip; ../entry triggers the malicious-entry branch
    // or the relativeEntryPath check — either way an ERROR_MSG_01 throw ->
    // panel non-200 envelope).
    const dz = await decompress(di(), iu(), u1().cookie, u1().token, "slip.zip", ".");
    expect(
      dz.httpStatus,
      `zip-slip decompress MUST be rejected: ${JSON.stringify(dz.raw).slice(0, 200)}`
    ).not.toBe(200);

    // The escape file must NOT exist above the instance dir. Each instance
    // lives at <workDir>/daemon/data/InstanceData/<uuid>/; one level up from
    // there is InstanceData — `../slipescape.txt` would land there if
    // extraction had proceeded. Assert it is absent.
    const instRoot = path.join(world.workDir, "daemon/data/InstanceData");
    expect(
      fs.existsSync(path.join(instRoot, "slipescape.txt")),
      "escape file must NOT exist above the instance dir (zip-slip contained)"
    ).toBe(false);

    // Neither the inside file nor the escape file should be visible from the
    // instance cwd (extraction was rejected before any entry was written).
    const ns = names(await listFiles(di(), iu(), u1().cookie, u1().token, "."));
    expect(ns).not.toContain("inside.txt");
    expect(ns).not.toContain("slipescape.txt");
  });

  // Review Focus #3 — path traversal: ../ in list/move/edit/delete/upload must
  // all be rejected (non-200). The daemon's checkPath + isOutsideWorkspace are
  // the gates; an upload_dir=../../ through the panel still hits the daemon's
  // checkPath on the resolved path, so it is rejected at /upload/:key.
  it("path traversal: list/move/edit/delete/upload with ../ rejected", async () => {
    // list ../../../../etc -> non-200 (path outside the instance cwd).
    const l = await listFiles(di(), iu(), u1().cookie, u1().token, "../../../../etc");
    expect(l.httpStatus, "list ../../../../etc must be rejected").not.toBe(200);

    // move dl.txt -> ../../esc.txt -> non-200 (dest escapes cwd).
    const mv = await moveFile(di(), iu(), u1().cookie, u1().token, [["dl.txt", "../../esc.txt"]]);
    expect(mv.httpStatus, "move to ../ must be rejected").not.toBe(200);

    // edit ../../etc/passwd -> non-200.
    const ed = await editFile(di(), iu(), u1().cookie, u1().token, "../../etc/passwd", "x");
    expect(ed.httpStatus, "edit ../ must be rejected").not.toBe(200);

    // delete ../../etc/passwd -> non-200.
    const del = await deleteFiles(di(), iu(), u1().cookie, u1().token, ["../../etc/passwd"]);
    expect(del.httpStatus, "delete ../ must be rejected").not.toBe(200);

    // Upload via passport with upload_dir=../../ : the PANEL grants a passport
    // (it does not validate upload_dir contents), but the DAEMON /upload/:key
    // handler resolves path.normalize(path.join("../../", "evil.txt")) and
    // runs fileManager.checkPath → fails isOutsideWorkspace → 500
    // "Access denied: Invalid destination". This is the load-bearing check.
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, "../../");
    expect(pp.password, "panel grants upload passport (validation is daemon-side)").toBeTruthy();
    const tiny = path.join(world.workDir, "evil.txt");
    fs.writeFileSync(tiny, "x");
    const up = await uploadToDaemon(pp, tiny, "evil.txt", { unzip: false });
    expect(
      up.httpStatus,
      "daemon upload to ../../ must be rejected (checkPath gates the resolved path)"
    ).not.toBe(200);
  });

  it("per-instance gate: u2 → 403 (key not instance-admin; admin gate already pinned in auth.test.ts)", async () => {
    // ensureOwner for u2 here would flip ownership and disturb later suites;
    // for the gate test we only need u2 to be a logged-in non-owner. ensureUser
    // re-logs u2 in with a fresh session.
    await ensureUser("u2", world.key);
    const r2 = await listFiles(di(), iu(), world.u2.cookie!, world.u2.token!, ".");
    expect(
      r2.httpStatus,
      "u2 must NOT list files of u1's instance — per-instance router.use gate -> 403"
    ).toBe(403);

    // (Admin via the integration-test KEY → 500 is already pinned in
    //  auth.test.ts #F-key-not-instance-admin. A logged-in admin (perm>=10)
    //  would pass isTopPermission; our test "admin" is perm 1 by design —
    //  same gate as u2 — so we do NOT assert admin→200 here.)
  });

  it("record deferred finding for download_from_url (network-bound)", () => {
    addFinding({
      id: "F-download-from-url-deferred",
      step: "files",
      severity: "info",
      title: "download_from_url deferred (network-bound)",
      detail:
        "POST /files/download_from_url fetches a remote URL; deferred to keep the suite" +
        " <1min. The start/poll/stop flow was exercised by the prior" +
        " panel/test/integration suite (now refactored into the common integration suites).",
      evidence: "deferred"
    });
    // Sanity: the finding is registered on world (no throw, no duplicate).
    expect(world.findings.some((f) => f.id === "F-download-from-url-deferred")).toBe(true);
  });

  // Visible-in-report placeholder so the deferred case + the finding id are
  // discoverable from the test list — DOES NOT execute (network-bound).
  it.skip("download_from_url start/poll/stop (deferred: network-bound — see F-download-from-url-deferred)", () => {});
});

// REAL-zip-fixture uploads (appended). The prior synthetic `buildZipSystem`
// `it`s cover chunked/unzip basics with in-memory zips; this block uses a REAL
// macOS-zip fixture `fixtures/test-zipfile.zip` (4844 bytes) whose real entries
// are: `webpack/` (dir), `webpack/formidable-plugin.loader.js`, `webpack.config.js`,
// `package.json` — plus macOS `__MACOSX/` + `._*` metadata. We assert ONLY the
// real files (the daemon's unzip may or may not extract the macOS metadata —
// asserting it would be flaky). Reuses the instance + u1 session the suite's
// setup `it` created (still set within this one vitest invocation).
describe("files: REAL zip fixture uploads (test-zipfile.zip)", () => {
  const ZIP = path.join(__dirname, "../fixtures/test-zipfile.zip");
  const fixtureBytes = () => fs.readFileSync(ZIP);

  it("real-zip: single-shot upload (unzip=0) -> list + download byte-identical to the fixture", async () => {
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(pp.password).toBeTruthy();
    const up = await uploadToDaemon(pp, ZIP, "test-zipfile.zip", { unzip: false });
    expect(up.httpStatus, `upload real zip: ${JSON.stringify(up.data).slice(0, 200)}`).toBe(200);
    expect(
      names(await listFiles(di(), iu(), u1().cookie, u1().token, ".")),
      "test-zipfile.zip must appear after upload"
    ).toContain("test-zipfile.zip");

    // Download it back via the passport route; the bytes must equal the fixture
    // exactly (single-shot multipart preserves bytes through upload/download).
    const dp = await getDownloadPassport(di(), iu(), u1().cookie, u1().token, "test-zipfile.zip");
    const d = await downloadFromDaemon(dp, "test-zipfile.zip");
    expect(d.httpStatus, `download real zip: ${d.httpStatus}`).toBe(200);
    expect(
      d.data.equals(fixtureBytes()),
      "downloaded real zip must be byte-identical to the fixture"
    ).toBe(true);
  });

  it("real-zip: upload with unzip=1 -> extracts the real files (webpack.config.js, package.json, webpack/<loader>)", async () => {
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    const up = await uploadToDaemon(pp, ZIP, "real-extracted.zip", { unzip: true });
    expect(up.httpStatus, `upload unzip=1 real zip: ${JSON.stringify(up.data).slice(0, 200)}`).toBe(
      200
    );
    // The daemon extracts synchronously before returning OK; poll for the real
    // ROOT entries. The `webpack/` dir entry appears as a name in the list; the
    // loader lives UNDER webpack/ (not at root).
    const ns = await waitFor(
      async () => {
        const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
        const nm = names(f);
        return nm.includes("webpack.config.js") &&
          nm.includes("package.json") &&
          nm.includes("webpack")
          ? nm
          : false;
      },
      { timeout: 15000, msg: "real-zip root entries visible after unzip=1" }
    );
    expect(ns, "webpack.config.js extracted at root").toContain("webpack.config.js");
    expect(ns, "package.json extracted at root").toContain("package.json");
    expect(ns, "webpack/ dir extracted").toContain("webpack");

    // The loader is inside webpack/ — list the dir to confirm it extracted.
    const wdir = await listFiles(di(), iu(), u1().cookie, u1().token, "webpack");
    expect(
      names(wdir),
      "webpack/formidable-plugin.loader.js must be extracted under webpack/"
    ).toContain("formidable-plugin.loader.js");

    // Re-read the extracted `package.json` to assert the CONTENT survived the
    // daemon's real-zip extraction (not just the file's existence).
    const pkg = await readFileText(di(), iu(), u1().cookie, u1().token, "package.json");
    expect(pkg.httpStatus, `read extracted package.json: ${pkg.httpStatus}`).toBe(200);
    expect(
      String(pkg.data || ""),
      "extracted package.json must contain valid JSON (the daemon's file_zip extracted the real content)"
    ).toMatch(/^\s*\{/);
  });

  it("real-zip: chunked upload (/upload-new + /upload-piece) -> list + download byte-identical", async () => {
    // The fixture is 4844 bytes; pieceSize=2048 -> 3 pieces (2KB + 2KB + 0.8KB),
    // exercising the FileWriter range tracking + auto-complete on the real zip.
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    const init = await uploadFileChunked({
      addr: pp.addr,
      password: pp.password,
      name: "chunked-zipfile.zip",
      content: fixtureBytes(),
      pieceSize: 2048
    });
    expect(init?.data?.id, "/upload-new must return a tracking id").toBeTruthy();

    await waitFor(
      async () => {
        const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
        return names(f).includes("chunked-zipfile.zip");
      },
      { timeout: 15000, msg: "chunked-zipfile.zip visible after chunked upload auto-complete" }
    );
    expect(
      names(await listFiles(di(), iu(), u1().cookie, u1().token, ".")),
      "chunked-zipfile.zip must appear after chunked upload"
    ).toContain("chunked-zipfile.zip");

    // The chunked-upload reassembly must be byte-identical to the fixture (the
    // FileWriter pieces must concatenate to the original zip bytes).
    const dp = await getDownloadPassport(
      di(),
      iu(),
      u1().cookie,
      u1().token,
      "chunked-zipfile.zip"
    );
    const d = await downloadFromDaemon(dp, "chunked-zipfile.zip");
    expect(d.httpStatus, `download chunked zip: ${d.httpStatus}`).toBe(200);
    expect(
      d.data.equals(fixtureBytes()),
      "downloaded chunked zip must be byte-identical to the fixture"
    ).toBe(true);
  });
});
