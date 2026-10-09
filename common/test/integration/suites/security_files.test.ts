import { describe, it, expect } from "vitest";
import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import {
  world,
  requestPanel,
  addFinding,
  listFiles,
  getUploadPassport,
  uploadToDaemon,
  uploadFileChunked,
  getDownloadPassport,
  downloadFromDaemon,
  createStream,
  buildZip,
  setupSecurityWorld,
  names,
  daemonBase,
  di,
  u1,
  adm
} from "../lib";

// Security suite — FILES module (split from the former monolithic
// suites/security.test.ts; shared helpers live in ../lib/security.ts).
//
// (real daemon + real panel, no mocks, real HTTP + socket.io). Boots a FRESH
// REAL daemon + panel per invocation. Self-contained: the first `it` ensures
// admin/u1/u2, creates the main instance owned by u1 and uploads the test.mjs
// fixture. This module drives attack-style requests at the file surface:
//   file & upload/download security (passport single-use, traversal filenames,
//   absolute-entry zips, chunked size/offset) · SSRF / URL-fetch gates
//   (download_from_url checkSafeUrl; /auth/proxy is admin-gated).
//
// Sibling modules: security_user (privilege escalation / permission states /
// input boundaries / unauthorized matrix), security_instance (command
// injection), security_auth (API-key / 2FA / rate limit / login ban — that
// file's ban block is destructive and LAST).
//
// Notes:
// - The integration-test key bypasses the panel `permission` middleware ONLY
//   (see auth.test.ts #F-key-not-instance-admin): instance/file gates still
//   read `ctx.session.uuid`, so the key gets 403/500 there.

describe("security: setup (users + main instance owned by u1)", () => {
  it("ensure admin/u1/u2, promote admin to ROLE.ADMIN, create + assign main instance, upload fixture", async () => {
    await setupSecurityWorld();
  });
});

describe("security: file + upload/download hardening", () => {
  it("download passport is single-use; replay is rejected", async () => {
    // create a small file via touch+edit
    await requestPanel({
      method: "POST",
      path: "/files/touch",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: world.instance.uuid },
      body: { target: "sec_dl.txt" }
    });
    const edit = await requestPanel({
      method: "PUT",
      path: "/files",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: world.instance.uuid },
      body: { target: "sec_dl.txt", text: "SINGLE-USE" }
    });
    expect(edit.httpStatus).toBe(200);

    const pp = await getDownloadPassport(
      di(),
      world.instance.uuid!,
      u1().cookie,
      u1().token,
      "sec_dl.txt"
    );
    expect(pp.password).toBeTruthy();
    const first = await downloadFromDaemon(pp, "sec_dl.txt");
    expect(first.httpStatus, "first download must succeed").toBe(200);
    expect(first.data.toString("utf-8")).toBe("SINGLE-USE");

    const replay = await downloadFromDaemon(pp, "sec_dl.txt");
    expect(replay.httpStatus, "passport replay must be rejected (mission deleted after use)").not.toBe(
      200
    );
  });

  it("an UPLOAD passport cannot be used on /download (mission-type mismatch)", async () => {
    const pp = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    const r = await downloadFromDaemon(pp, "test.mjs");
    expect(r.httpStatus, "cross-mission passport use must be rejected").not.toBe(200);
  });

  it("upload passport is single-use; second upload with the same key fails", async () => {
    const pp = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    const tmp = path.join(world.workDir, "sec_once.txt");
    fs.writeFileSync(tmp, "once");
    const a = await uploadToDaemon(pp, tmp, "sec_once.txt", { unzip: false });
    expect(a.httpStatus).toBe(200);
    const b = await uploadToDaemon(pp, tmp, "sec_once.txt", { unzip: false });
    expect(b.httpStatus, "upload passport replay must be rejected").not.toBe(200);
  });

  it("stream_channel passport is REUSABLE within its TTL (documented, unlike file passports)", async () => {
    // Contrast with the file passports above: stream/auth never consumes the
    // mission (no deleteMission in stream_router), so the same password keeps
    // authenticating new sockets until the 1h TTL sweeper drops it. Terminal
    // reconnects depend on this (frontend useTerminal.ts reuses the password) -
    // pinned as current design, with the replay window recorded.
    const ch = await requestPanel({
      method: "POST",
      path: "/protected_instance/stream_channel",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: world.instance.uuid }
    });
    expect(ch.httpStatus, `stream_channel: ${JSON.stringify(ch.raw).slice(0, 140)}`).toBe(200);
    const { addr, prefix, password } = ch.data || {};
    expect(password, "stream passport password").toBeTruthy();

    const s1 = createStream(addr, prefix, password);
    const first = await s1.ready;
    s1.disconnect();
    expect(first, "first stream auth must succeed").toBe(true);

    const s2 = createStream(addr, prefix, password);
    const second = await s2.ready;
    s2.disconnect();
    expect(second, "current design: the same stream passport authenticates again").toBe(true);
    addFinding({
      id: "F-stream-passport-reusable",
      step: "passport",
      severity: "warn",
      title: "stream_channel passports are NOT consumed on use (1h replay window)",
      detail:
        "stream/auth reads the mission but never deleteMission's it - unlike /upload & /download" +
        " which consume on first use. A leaked stream password therefore authenticates new" +
        " terminal sockets for up to one hour. The reuse is load-bearing for console reconnects" +
        " (useTerminal.ts), so it is pinned as design rather than changed; the password itself" +
        " is a random timeUuid. Consuming on auth would need a reconnect-friendly re-issue flow.",
      evidence: `same password: first auth=${first}, second auth=${second}`
    });
  });

  it("multipart / chunked filenames with traversal are neutralized to basename inside the workspace", async () => {
    const tmp = path.join(world.workDir, "sec_trav.txt");
    fs.writeFileSync(tmp, "trav-payload");

    const pp = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    const up = await uploadToDaemon(pp, tmp, "../../evil_trav.txt", { unzip: false });
    // Whether the route accepts the weird name or not, it must never escape:
    // the save path is basename()-normalized into the instance workspace.
    const f = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    const ns = names(f);
    expect(
      ns.includes("evil_trav.txt") || up.httpStatus !== 200,
      "traversal filename must be neutralized (basename) or rejected, never escaped"
    ).toBe(true);
    // If anything was saved, its list entry must be the plain basename - a name
    // containing path separators can never appear in the workspace listing.
    for (const n of ns.filter((x: string) => x.includes("evil_trav"))) {
      expect(n, "saved entry must be the neutralized basename").toBe("evil_trav.txt");
    }
    // Escape probes: the traversal target `../../evil_trav.txt` from the
    // instance cwd (workDir/daemon/data/InstanceData/<uuid>) would land in
    // daemon/data or workDir - none of them may exist.
    for (const escaped of [
      path.join(world.workDir, "evil_trav.txt"),
      path.join(world.workDir, "daemon/data/evil_trav.txt"),
      path.join(world.workDir, "daemon/data/InstanceData/evil_trav.txt")
    ]) {
      expect(fs.existsSync(escaped), `must not escape to ${escaped}`).toBe(false);
    }

    // Chunked path: FileWriter.getPath also basenames before joining.
    const pp2 = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    let chunkOk = true;
    try {
      await uploadFileChunked({
        addr: pp2.addr,
        password: pp2.password,
        name: "..\\..\\evil_chunk.txt",
        content: Buffer.from("chunk-trav"),
        pieceSize: 1024
      });
    } catch {
      chunkOk = false; // clean rejection is acceptable - escaping is not
    }
    if (chunkOk) {
      const f2 = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
      expect(
        names(f2),
        "if the chunked upload was accepted it must be stored under its basename"
      ).toContain("evil_chunk.txt");
    }
    expect(
      fs.existsSync(path.join(world.workDir, "daemon/data/evil_chunk.txt")),
      "chunked traversal must not escape into daemon/data"
    ).toBe(false);
  });

  it("zips with absolute-path / windows-backslash entries are rejected BEFORE extraction", async () => {
    // Entry names that resolve OUTSIDE the destination directory (zip-slip
    // family). hasZipSlip must reject the whole archive up front.
    const absZip = path.join(world.workDir, "sec_abs.zip");
    buildZip(absZip, [
      { name: "/evil_abs.txt", content: "abs" },
      { name: "inside_ok.txt", content: "ok" }
    ]);
    const winZip = path.join(world.workDir, "sec_win.zip");
    buildZip(winZip, [
      { name: "..\\..\\evil_win.txt", content: "win" },
      { name: "ok2.txt", content: "ok" }
    ]);

    for (const [zipPath, zipName, members] of [
      [absZip, "sec_abs.zip", ["evil_abs.txt", "inside_ok.txt"]],
      [winZip, "sec_win.zip", ["evil_win.txt", "ok2.txt"]]
    ] as Array<[string, string, string[]]>) {
      const pp = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
      const up = await uploadToDaemon(pp, zipPath, zipName, { unzip: false });
      expect(up.httpStatus, `upload ${zipName}: ${JSON.stringify(up.data).slice(0, 120)}`).toBe(200);

      const d = await requestPanel({
        method: "POST",
        path: "/files/compress",
        cookie: u1().cookie,
        token: u1().token,
        query: { daemonId: di(), uuid: world.instance.uuid },
        body: { type: 0, source: zipName, targets: ".", code: "utf-8" }
      });
      expect(d.httpStatus, `${zipName} with escaping entries must be rejected`).not.toBe(200);

      const f = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
      const ns = names(f);
      for (const m of members) {
        expect(ns, `nothing from ${zipName} may be extracted`).not.toContain(m);
      }
    }

    expect(
      fs.existsSync(path.join(path.parse(world.workDir).root, "evil_abs.txt")),
      "absolute-entry zip must not write to the drive root"
    ).toBe(false);
  });

  it("chunked upload boundaries: size=0 ok; size=NaN rejected; offset past EOF rejected", async () => {
    const base = async (name: string) => {
      const pp = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
      return { base: daemonBase(pp.addr), password: pp.password, name };
    };

    // size=0: empty file completes immediately.
    const zero = await base("sec_zero.bin");
    const z = await uploadFileChunked({
      addr: zero.base,
      password: zero.password,
      name: zero.name,
      content: Buffer.alloc(0),
      pieceSize: 1024
    });
    expect(z?.data?.id, `size=0 upload must complete: ${JSON.stringify(z).slice(0, 120)}`).toBeTruthy();
    const zList = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    expect(names(zList), "the empty file must land in the workspace").toContain("sec_zero.bin");

    // size=NaN: the writer init must reject (ftruncate ERR_OUT_OF_RANGE).
    const nan = await base("sec_nan.bin");
    const nanRaw = await axios.post(`${nan.base}/upload-new/${encodeURIComponent(nan.password)}`, null, {
      params: { filename: nan.name, size: "abc", unzip: 0, overwrite: "false" },
      validateStatus: () => true,
      timeout: 30000
    });
    expect(
      nanRaw.status,
      `size=NaN must be rejected: ${JSON.stringify(nanRaw.data).slice(0, 120)}`
    ).not.toBe(200);

    // offset past EOF: a piece that would write beyond `size` must be refused.
    const over = await base("sec_over.bin");
    const init = await axios.post(`${over.base}/upload-new/${encodeURIComponent(over.password)}`, null, {
      params: { filename: over.name, size: 8, unzip: 0, overwrite: "false" },
      validateStatus: () => true,
      timeout: 30000
    });
    const id = init.data?.data?.id;
    expect(id, `upload-new(8): ${JSON.stringify(init.data).slice(0, 120)}`).toBeTruthy();

    const boundary = "----mcsmtest" + Math.random().toString(36).slice(2);
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\nContent-Type: application/octet-stream\r\n\r\n`
      ),
      Buffer.from("OVERFLOW"),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);
    const piece = await axios.post(`${over.base}/upload-piece/${id}`, body, {
      params: { offset: 100 },
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
      validateStatus: () => true,
      timeout: 30000
    });
    expect(
      piece.status,
      `offset=100 on an 8-byte file must fail: ${JSON.stringify(piece.data).slice(0, 120)}`
    ).not.toBe(200);

    // Daemon must still be healthy after the malformed attempts.
    const f = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    expect(f.httpStatus, "daemon alive after malformed uploads").toBe(200);
  });

  it("/files/status redacts the host disk list for non-admins (info leak guard)", async () => {
    const mine = await requestPanel({
      method: "GET",
      path: "/files/status",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: world.instance.uuid }
    });
    expect(mine.httpStatus, `/files/status u1: ${JSON.stringify(mine.raw).slice(0, 160)}`).toBe(200);
    // The daemon returns `disks` (host volume letters on Windows). The panel
    // redacts it for non-admins as an EMPTY ARRAY - keeping the frontend
    // `disks: string[]` contract while leaking no host information. (An empty
    // array is the redaction; a populated one is the leak.)
    expect(
      mine.data?.disks,
      `host disk list must be redacted for normal users, got ${JSON.stringify(mine.data?.disks)}`
    ).toEqual([]);
    expect(mine.data?.disk).toBeUndefined();

    const adminView = await requestPanel({
      method: "GET",
      path: "/files/status",
      cookie: adm().cookie,
      token: adm().token,
      query: { daemonId: di(), uuid: world.instance.uuid }
    });
    expect(adminView.httpStatus, `/files/status admin: ${JSON.stringify(adminView.raw).slice(0, 160)}`).toBe(
      200
    );
    expect(Array.isArray(adminView.data?.disks), "admin keeps the disk list").toBe(true);
  });
});

describe("security: SSRF / URL-fetch gates", () => {
  it("/auth/proxy stays admin-only (SSRF-capable endpoint)", async () => {
    // login_router /proxy forwards ?target= to axios with NO scheme/host check:
    // it is a deliberate admin tool and a full SSRF primitive in the wrong
    // hands. Pin the privilege gate: normal users get 403 even with a valid
    // session, and only the admin surface may reach internal services.
    const user = await requestPanel({
      method: "GET",
      path: "/auth/proxy",
      cookie: u1().cookie,
      token: u1().token,
      query: { target: `http://127.0.0.1:${new URL(world.daemonHttpUrl).port}/` }
    });
    expect(user.httpStatus, "normal user must not use /auth/proxy").toBe(403);

    // Admin-equivalent key DOES proxy to the local daemon (documented surface).
    const keyRes = await requestPanel({
      method: "GET",
      path: "/auth/proxy",
      key: world.key,
      query: { target: `http://127.0.0.1:${new URL(world.daemonHttpUrl).port}/` }
    });
    expect(keyRes.httpStatus, `admin proxy: ${JSON.stringify(keyRes.raw).slice(0, 120)}`).toBe(200);
    // A real ADMIN session (not just the integration key) reaches it too.
    const adminRes = await requestPanel({
      method: "GET",
      path: "/auth/proxy",
      cookie: adm().cookie,
      token: adm().token,
      query: { target: `http://127.0.0.1:${new URL(world.daemonHttpUrl).port}/` }
    });
    expect(adminRes.httpStatus, "admin session proxy must work").toBe(200);
    addFinding({
      id: "F-auth-proxy-ssrf-admin-only",
      step: "ssrf",
      severity: "info",
      title: "/auth/proxy is an unfiltered SSRF primitive gated only by ADMIN level",
      detail:
        "login_router /proxy passes ?target= straight to axios (no checkSafeUrl): any URL the" +
        " panel host can reach (internal services, cloud metadata, file:// in some axios" +
        " versions) is fetchable by an admin. Gate verified closed for normal users. If the" +
        " permission level on this route is ever lowered it becomes a critical SSRF hole.",
      evidence: `u1 -> ${user.httpStatus}; key -> ${keyRes.httpStatus}`
    });
  });

  it("file download_from_url rejects private-IP / file-scheme / no-dot targets (SSRF guard)", async () => {
    // The panel forwards the URL unchecked, but the DAEMON runs checkSafeUrl
    // (rejects IP literals, localhost, .local, no-dot hosts, private DNS
    // results and non-http(s) schemes) BEFORE starting the fetch. No network
    // is needed: every target below is refused at validation time.
    for (const url of [
      "file:///etc/passwd",
      `${world.daemonHttpUrl}/`,
      "http://169.254.169.254/latest/meta-data/",
      `${world.panelUrl.replace("127.0.0.1", "localhost")}/`,
      "http://metadata/"
    ]) {
      const r = await requestPanel({
        method: "POST",
        path: "/files/download_from_url",
        cookie: u1().cookie,
        token: u1().token,
        query: { daemonId: di(), uuid: world.instance.uuid },
        body: { url, file_name: "sec_ssrf_probe.bin" },
        timeout: 30000
      });
      expect(r.httpStatus, `SSRF target ${url} must be refused: ${JSON.stringify(r.raw).slice(0, 140)}`).not.toBe(
        200
      );
      // Pin the REASON (daemon checkSafeUrl) - a generic failure would go
      // green even if the URL guard were removed and something else errored.
      expect(
        JSON.stringify(r.raw),
        `refusal for ${url} must come from the URL guard: ${JSON.stringify(r.raw).slice(0, 140)}`
      ).toMatch(/insecure/i);
    }
    const f = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    expect(names(f), "no probe file may be created").not.toContain("sec_ssrf_probe.bin");
    // daemon alive afterwards
    expect((await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".")).httpStatus).toBe(
      200
    );
    addFinding({
      id: "F-download-url-ssrf-guard",
      step: "ssrf",
      severity: "info",
      title: "download_from_url SSRF guard lives on the daemon (checkSafeUrl), not the panel",
      detail:
        "The panel route performs no URL validation; rejection happens in daemon" +
        " file/download_from_url via checkSafeUrl (IP/localhost/.local/no-dot/private-DNS and" +
        " non-http(s) schemes refused). Defense-in-depth note: if a daemon ever skips that" +
        " check the panel would happily forward internal targets. DNS-rebinding and open" +
        " redirect-following are NOT covered by checkSafeUrl (documented residual risk).",
      evidence: "5 SSRF-shaped targets all non-200; workspace clean"
    });
  });
});
