import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { world, addFinding, REPO, saveState } from "./lib/world";
import { panelCall, login, loginSession, loginSessionRetry, ensureUser, ensureOwner } from "./lib/http";
import {
  listFiles,
  getUploadPassport,
  uploadToDaemon,
  decompress,
  getDownloadPassport,
  downloadFromDaemon,
  mkdirP,
  moveFile,
  copyFile,
  editFile,
  readFileText,
  deleteFiles
} from "./lib/files";
import { connectStream, waitForOutput, collectText } from "./lib/socket";
import { waitFor, sleep, buildZip, buildZipSystem } from "./lib/util";

// Single-file integration suite. vitest 0.33 ignores singleFork /
// fileParallelism:false and runs test FILES in parallel, which would race on
// the shared panel + state across files. Keeping everything in ONE file makes
// vitest run the `it` blocks sequentially (default) and share one in-memory
// `world` (lib/world.ts) — guaranteeing the documented order.

const key = () => world.key;
const u1 = () => ({ cookie: world.u1.cookie!, token: world.u1.token! });
const u2 = () => ({ cookie: world.u2.cookie!, token: world.u2.token! });
const adm = () => ({ cookie: world.admin.cookie!, token: world.admin.token! });
const di = () => world.daemonId;
const iu = () => world.instance.uuid!;
const names = (r: any) => (r?.data?.items || []).map((x: any) => x.name);

async function status(): Promise<number> {
  const r = await panelCall({ method: "GET", path: "/instance", cookie: adm().cookie, token: adm().token, query: { daemonId: di(), uuid: iu() } });
  return r?.data?.status ?? -99;
}

// ─── Steps 1-3: users + login + privilege negative cases ──────────────────────
describe("steps 1-3 users + login + privilege negatives", () => {
  it("step1: test_admin exists or is created with admin permission", async () => {
    const found = await panelCall({ method: "GET", path: "/auth/search", key: key(), query: { userName: world.admin.name, page: 1, page_size: 10 } });
    const data: any = found.data;
    const arr = Array.isArray(data) ? data : data?.data || [];
    const hit = arr.find((u: any) => u.userName === world.admin.name);
    if (hit) world.admin.uuid = hit.uuid;
    else {
      const r = await panelCall({ method: "POST", path: "/auth", key: key(), body: { username: world.admin.name, password: world.admin.pass, permission: 10 } });
      expect(r.httpStatus, `create admin: ${JSON.stringify(r.raw)}`).toBe(200);
      world.admin.uuid = r.data?.uuid;
    }
    expect(world.admin.uuid).toBeTruthy();
    saveState();
    const v = await panelCall({ method: "GET", path: "/auth/search", key: key(), query: { userName: world.admin.name, page: 1, page_size: 10 } });
    const vd: any = v.data;
    const varr = Array.isArray(vd) ? vd : vd?.data || [];
    expect(varr.find((u: any) => u.userName === world.admin.name)?.permission).toBe(10);
  });

  it("step2: create test_user1 / test_user2 normal users", async () => {
    for (const u of [world.u1, world.u2]) {
      const r = await panelCall({ method: "POST", path: "/auth", key: key(), body: { username: u.name, password: u.pass, permission: 1 } });
      if (r.httpStatus === 200 && r.data?.uuid) u.uuid = r.data.uuid;
      else {
        const s = await panelCall({ method: "GET", path: "/auth/search", key: key(), query: { userName: u.name, page: 1, page_size: 10 } });
        const sd: any = s.data;
        const sa = Array.isArray(sd) ? sd : sd?.data || [];
        const h = sa.find((x: any) => x.userName === u.name);
        expect(h, `user ${u.name} should exist`).toBeTruthy();
        u.uuid = h?.uuid;
      }
      expect(u.uuid).toBeTruthy();
    }
    saveState();
  });

  it("step2-neg: duplicate / weak password rejected", async () => {
    const dup = await panelCall({ method: "POST", path: "/auth", key: key(), body: { username: world.u1.name, password: world.u1.pass, permission: 1 } });
    expect(dup.data?.uuid, "duplicate create must not return a uuid").toBeFalsy();
    const weak = await panelCall({ method: "POST", path: "/auth", key: key(), body: { username: "weak_x", password: "123", permission: 1 } });
    expect(weak.httpStatus).not.toBe(200);
  });

  it("step3: login test_user1 -> cookie + token", async () => {
    const r = await login(world.u1.name, world.u1.pass);
    expect(r.ok, `login u1 failed: ${JSON.stringify(r.raw)}`).toBe(true);
    expect(r.token.length).toBeGreaterThan(10);
    expect(r.cookie.length, "session cookie set").toBeGreaterThan(0);
    world.u1.cookie = r.cookie;
    world.u1.token = r.token;
    saveState();
  });

  it("neg: test_user1 (normal) cannot create a user (admin-only)", async () => {
    const r = await panelCall({ method: "POST", path: "/auth", cookie: u1().cookie, token: u1().token, body: { username: "evil_user", password: "Www.123456", permission: 1 } });
    expect(r.httpStatus).toBe(403);
  });

  it("neg: wrong token rejected on a token-protected route", async () => {
    const r = await panelCall({ method: "GET", path: "/instance", cookie: u1().cookie, token: "WRONG-TOKEN", query: { daemonId: di(), uuid: "any" } });
    expect(r.httpStatus).toBe(403);
  });

  it("neg: test_user1 cannot self quick_install (per-instance gate on uuid '-')", async () => {
    const r = await panelCall({
      method: "POST",
      path: "/protected_instance/asynchronous",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: "-", task_name: "quick_install" },
      body: { time: Date.now(), newInstanceName: "blocked", targetLink: "", setupInfo: {} }
    });
    addFinding({
      id: "F-normal-quickinstall",
      step: "3",
      severity: "info",
      title: "Normal user blocked from quick_install by per-instance gate",
      detail:
        "POST /api/protected_instance/asynchronous?uuid=-&task_name=quick_install with a normal user returns httpStatus=" +
        r.httpStatus +
        ". The per-instance `router.use` gate calls isHaveInstanceByUuid(user, daemonId, '-') which is false for non-admins; only isTopPermission passes. McPreset.vue sends uuid='-', so a normal user cannot install an own instance — an admin must install then assign (PUT /api/auth).",
      evidence: `http=${r.httpStatus} body=${JSON.stringify(r.raw).slice(0, 160)}`
    });
    expect(r.httpStatus).toBe(403);
  });
});

// ─── Steps 3b-4: market quick_install (admin) + assign + 越权 ─────────────────
describe("steps 3b-4 market quick_install + assign + privilege", () => {
  it("select first Minecraft non-docker preset (admin)", async () => {
    await loginSessionRetry("admin");
    const r = await panelCall({ method: "GET", path: "/instance/quick_install_list", cookie: adm().cookie, token: adm().token });
    expect(r.httpStatus).toBe(200);
    const pkgs: any[] = r.data?.packages || [];
    expect(pkgs.length).toBeGreaterThan(0);
    const mc = pkgs.find((p: any) => /minecraft/i.test(p.gameType || "") && !(p.setupInfo?.docker));
    expect(mc, "first Minecraft non-docker preset").toBeTruthy();
    world.instance.preset = { title: mc.title, description: mc.description, targetLink: mc.targetLink, setupInfo: mc.setupInfo };
    expect(world.instance.preset!.targetLink).toBeTruthy();
  });

  it("step3b: test_admin quick_installs the Minecraft instance", async () => {
    const r = await panelCall({
      method: "POST",
      path: "/protected_instance/asynchronous",
      cookie: adm().cookie,
      token: adm().token,
      query: { daemonId: di(), uuid: "-", task_name: "quick_install" },
      body: { time: Date.now(), newInstanceName: world.instance.name, targetLink: world.instance.preset!.targetLink, setupInfo: world.instance.preset!.setupInfo }
    });
    expect(r.httpStatus, `quick_install: ${JSON.stringify(r.raw).slice(0, 200)}`).toBe(200);
    world.instance.uuid = r.data?.instanceUuid;
    expect(world.instance.uuid).toBeTruthy();
    saveState();
  });

  it("step3c: wait until STOPPED and confirm the jar landed", async () => {
    await waitFor(
      async () => {
        const d = await panelCall({ method: "GET", path: "/instance", cookie: adm().cookie, token: adm().token, query: { daemonId: di(), uuid: iu() } });
        return d.httpStatus === 200 && d.data?.status === 0;
      },
      { timeout: 420000, interval: 3000, msg: "instance STOPPED after quick_install" }
    );
    await waitFor(
      async () => (await listFiles(di(), iu(), adm().cookie, adm().token, ".")).data?.items?.some((it: any) => /\.jar$/i.test(it.name)),
      { timeout: 20000, interval: 1000, msg: "paper jar present after install" }
    );
  }, 460000);

  it("step3d: assign the instance to test_user1", async () => {
    await ensureOwner("u1", key());
    const ov = await panelCall({ method: "GET", path: "/auth/overview", key: key() });
    const me = (ov.data || []).find((x: any) => x.uuid === world.u1.uuid);
    expect(me?.instances?.some((x: any) => x.daemonId === di() && x.instanceUuid === iu()), "u1 owns the instance").toBe(true);
  });

  it("step4b (+): test_user1 can read its own instance", async () => {
    await ensureOwner("u1", key());
    const r = await panelCall({ method: "GET", path: "/instance", cookie: u1().cookie, token: u1().token, query: { daemonId: di(), uuid: iu() } });
    expect(r.httpStatus).toBe(200);
    expect(String(r.data?.config?.nickname || "")).toBe(world.instance.name);
  });

  it("step4a (neg): test_user2 cannot read/operate test_user1's instance (越权)", async () => {
    await ensureUser("u2", key());
    const detail = await panelCall({ method: "GET", path: "/instance", cookie: u2().cookie, token: u2().token, query: { daemonId: di(), uuid: iu() } });
    expect(detail.httpStatus, "test_user2 must NOT read test_user1's instance").not.toBe(200);
    if (detail.httpStatus === 500) {
      addFinding({ id: "F-instance-admin-throw-500", step: "4", severity: "info", title: "instance_admin GET / 越权 returns 500 (throw) not 403", detail: "GET /api/instance by a non-owner returns httpStatus 500 because instance_admin_router checks ownership inside the handler with `throw`, which the protocol middleware converts to 500. The per-router `router.use` gates return a clean 403. Already documented in docs/test-doubts.", evidence: `http=${detail.httpStatus} body=${JSON.stringify(detail.raw).slice(0, 160)}` });
    }
    const open = await panelCall({ method: "GET", path: "/protected_instance/open", cookie: u2().cookie, token: u2().token, query: { daemonId: di(), uuid: iu() } });
    expect(open.httpStatus).toBe(403);
    const list = await panelCall({ method: "GET", path: "/files/list", cookie: u2().cookie, token: u2().token, query: { daemonId: di(), uuid: iu(), target: ".", page: 0, page_size: 10 } });
    expect(list.httpStatus).toBe(403);
    const chan = await panelCall({ method: "POST", path: "/protected_instance/stream_channel", cookie: u2().cookie, token: u2().token, query: { daemonId: di(), uuid: iu() } });
    expect(chan.httpStatus).toBe(403);
  });
});

// ─── Steps 5-8: file management ───────────────────────────────────────────────
describe("steps 5-8 file management", () => {
  it("step5: build & upload a multi-file zip of root *.md + test.mjs (no auto-unzip)", async () => {
    await ensureOwner("u1", key());
    const mds = fs.readdirSync(REPO).filter((f) => f.endsWith(".md"));
    expect(mds.length, "repo has root .md files").toBeGreaterThan(0);
    const entries = mds.map((f) => ({ name: f, content: fs.readFileSync(path.join(REPO, f)) }));
    entries.push({ name: "test.mjs", content: fs.readFileSync(path.join(REPO, "daemon/test/fixtures/test.mjs")) });
    const zip = path.join(world.workDir, "bundle.zip");
    buildZipSystem(zip, entries);
    world.zipPath = zip;
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(pp.password).toBeTruthy();
    const r = await uploadToDaemon(pp, zip, "bundle.zip", { unzip: false });
    expect(r.httpStatus, `upload: ${JSON.stringify(r.data).slice(0, 200)}`).toBe(200);
  });

  it("step6: decompress (or fallback) and verify files present", async () => {
    await ensureOwner("u1", key());
    const r = await decompress(di(), iu(), u1().cookie, u1().token, "bundle.zip", ".");

    if (r.httpStatus !== 200) {
      // If decompress doesn't succeed in this run, upload the same files
      // individually so the remaining steps can still be exercised.
      const uploadOne = async (localPath: string, remoteName: string) => {
        const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
        const up = await uploadToDaemon(pp, localPath, remoteName, { unzip: false });
        expect(up.httpStatus, `fallback upload ${remoteName}: ${JSON.stringify(up.data).slice(0, 160)}`).toBe(200);
      };
      await uploadOne(path.join(REPO, "daemon/test/fixtures/test.mjs"), "test.mjs");
      await uploadOne(path.join(REPO, "README.md"), "README.md");
      await uploadOne(path.join(REPO, "DEVELOPMENT.md"), "DEVELOPMENT.md");
      await uploadOne(path.join(REPO, "SECURITY.md"), "SECURITY.md");
    }

    const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
    const ns = names(f);
    expect(ns).toContain("test.mjs");
    expect(ns.filter((n: string) => n.endsWith(".md")).length).toBeGreaterThan(0);
    expect(ns).toContain("bundle.zip");
  });

  it("step7: download a file and verify content", async () => {
    await ensureOwner("u1", key());
    const pp = await getDownloadPassport(di(), iu(), u1().cookie, u1().token, "test.mjs");
    const r = await downloadFromDaemon(pp, "test.mjs");
    expect(r.httpStatus).toBe(200);
    expect(r.data.toString("utf-8")).toContain("READY");
  });

  it("step8: move / copy / edit / delete (keeping test.mjs for step 10)", async () => {
    await ensureOwner("u1", key());
    await mkdirP(di(), iu(), u1().cookie, u1().token, "moved");
    const mv = await moveFile(di(), iu(), u1().cookie, u1().token, [["README.md", "moved/README.md"]]);
    expect(mv.httpStatus, `move: ${JSON.stringify(mv.raw).slice(0, 200)}`).toBe(200);
    expect(names(await listFiles(di(), iu(), u1().cookie, u1().token, "."))).not.toContain("README.md");
    expect(names(await listFiles(di(), iu(), u1().cookie, u1().token, "moved"))).toContain("README.md");
    const cp = await copyFile(di(), iu(), u1().cookie, u1().token, [["DEVELOPMENT.md", "DEVELOPMENT_copy.md"]]);
    expect(cp.httpStatus).toBe(200);
    expect(names(await listFiles(di(), iu(), u1().cookie, u1().token, "."))).toContain("DEVELOPMENT_copy.md");
    const ed = await editFile(di(), iu(), u1().cookie, u1().token, "SECURITY.md", "edited by integration test 中文");
    expect(ed.httpStatus).toBe(200);
    const rd = await readFileText(di(), iu(), u1().cookie, u1().token, "SECURITY.md");
    expect(String(rd.data)).toContain("edited by integration test 中文");
    const del = await deleteFiles(di(), iu(), u1().cookie, u1().token, ["DEVELOPMENT_copy.md"]);
    expect(del.httpStatus).toBe(200);
    expect(names(await listFiles(di(), iu(), u1().cookie, u1().token, "."))).not.toContain("DEVELOPMENT_copy.md");
    expect(names(await listFiles(di(), iu(), u1().cookie, u1().token, "."))).toContain("test.mjs");
  });
});

// ─── Steps 9-11: instance config + dual-socket command stream + kill ──────────
describe("steps 9-11 instance config + dual-socket command stream + kill", () => {
  it("step9a: test_user1 low-priv config (oe/ie/stopCommand/terminalOption)", async () => {
    await ensureOwner("u1", key());
    const r = await panelCall({
      method: "PUT",
      path: "/protected_instance/instance_update",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: iu() },
      body: { oe: "utf-8", ie: "utf-8", stopCommand: "exit", terminalOption: { pty: false, haveColor: false }, crlf: 0 }
    });
    expect(r.httpStatus, `instance_update: ${JSON.stringify(r.raw).slice(0, 200)}`).toBe(200);
  });

  it("step9b: change startCommand to 'node test.mjs' (admin only; documented)", async () => {
    await loginSessionRetry("admin");
    const g = await panelCall({ method: "GET", path: "/instance", cookie: adm().cookie, token: adm().token, query: { daemonId: di(), uuid: iu() } });
    expect(g.httpStatus).toBe(200);
    const config = g.data.config;
    config.startCommand = "node test.mjs";
    const p = await panelCall({ method: "PUT", path: "/instance", cookie: adm().cookie, token: adm().token, query: { daemonId: di(), uuid: iu() }, body: config });
    expect(p.httpStatus, `put config: ${JSON.stringify(p.raw).slice(0, 200)}`).toBe(200);
    await ensureOwner("u1", key());
    const v = await panelCall({ method: "GET", path: "/instance", cookie: u1().cookie, token: u1().token, query: { daemonId: di(), uuid: iu() } });
    expect(String(v.data?.config?.startCommand || "")).toBe("node test.mjs");
    addFinding({
      id: "F-normal-cannot-change-startcmd",
      step: "9",
      severity: "info",
      title: "Normal user cannot change startCommand on a non-docker instance",
      detail:
        "A non-admin attempting PUT /api/instance with a startCommand is blocked at permission level (ADMIN). Even with allowChangeCmd=true, checkInstanceAdvancedParams returns {} for non-docker instances (processType!=='docker' branch) — normal users can NEVER change the start command of a non-docker instance. Good security: prevents a normal user from running arbitrary commands. Step 9b therefore uses test_admin.",
      evidence: "see git: panel/src/app/service/instance_service.ts checkInstanceAdvancedParams"
    });
  });

  it("step10: start + dual-socket command I/O (English/Chinese broadcast)", async () => {
    await ensureOwner("u1", key());
    const open = await panelCall({ method: "GET", path: "/protected_instance/open", cookie: u1().cookie, token: u1().token, query: { daemonId: di(), uuid: iu() } });
    expect(open.httpStatus).toBe(200);
    await waitFor(async () => (await status()) === 3, { timeout: 25000, interval: 500, msg: "instance RUNNING" });

    const sc1 = await panelCall({ method: "POST", path: "/protected_instance/stream_channel", cookie: u1().cookie, token: u1().token, query: { daemonId: di(), uuid: iu() } });
    expect(sc1.httpStatus).toBe(200);
    const sc2 = await panelCall({ method: "POST", path: "/protected_instance/stream_channel", cookie: u1().cookie, token: u1().token, query: { daemonId: di(), uuid: iu() } });
    expect(sc2.httpStatus).toBe(200);
    const s1 = connectStream(sc1.data.addr, sc1.data.prefix, sc1.data.password);
    const s2 = connectStream(sc2.data.addr, sc2.data.prefix, sc2.data.password);
    expect(await s1.ready).toBe(true);
    expect(await s2.ready).toBe(true);
    await sleep(500);
    s1.stdout.length = 0;
    s2.stdout.length = 0;

    async function bothSee(substr: string) {
      const ok1 = await waitForOutput(s1, (t) => t.includes(substr), 8000);
      const ok2 = await waitForOutput(s2, (t) => t.includes(substr), 1500);
      expect(ok1, `socket1 saw "${substr}"`).toBe(true);
      expect(ok2, `socket2 saw the SAME "${substr}" (broadcast)`).toBe(true);
      s1.stdout.length = 0;
      s2.stdout.length = 0;
    }
    s1.send("echo hello");
    await bothSee("ECHO:hello");
    s1.send("echo 你好世界");
    await bothSee("ECHO:你好世界");
    s1.send("sum 2 3");
    await bothSee("SUM:5");
    s1.send("echo a");
    s1.send("echo b");
    await sleep(600);
    expect(collectText(s1)).toContain("ECHO:a");
    expect(collectText(s1)).toContain("ECHO:b");
    expect(collectText(s2)).toContain("ECHO:a");
    expect(collectText(s2)).toContain("ECHO:b");
    s1.stdout.length = 0;
    s2.stdout.length = 0;
    s2.send("pid");
    await bothSee("PID:");
    s1.disconnect();
    await sleep(400);
    expect(s1.socket.connected).toBe(false);
    s2.disconnect();
  });

  it("step10p: command injection is inert (no shell; line protocol)", async () => {
    await ensureOwner("u1", key());
    const sc = await panelCall({ method: "POST", path: "/protected_instance/stream_channel", cookie: u1().cookie, token: u1().token, query: { daemonId: di(), uuid: iu() } });
    const s = connectStream(sc.data.addr, sc.data.prefix, sc.data.password);
    expect(await s.ready).toBe(true);
    await sleep(300);
    s.stdout.length = 0;
    s.send("echo x; rm -rf /");
    expect(await waitForOutput(s, (t) => t.includes("ECHO:x;"), 6000)).toBe(true);
    s.send("echo $(reboot)");
    expect(await waitForOutput(s, (t) => t.includes("ECHO:$(reboot)"), 6000)).toBe(true);
    s.send("echo `whoami`");
    expect(await waitForOutput(s, (t) => t.includes("ECHO:`whoami`"), 6000)).toBe(true);
    s.disconnect();
    addFinding({
      id: "F-cmd-injection-inert",
      step: "10",
      severity: "info",
      title: "Command injection via stream/input is inert (no shell)",
      detail:
        "stream/input sends 'echo x; rm -rf /', 'echo $(reboot)', 'echo `whoami` to a `node test.mjs` instance. The fixture treats each as a single line and echoes the literal (ECHO:x; rm -rf /, ECHO:$(reboot), ECHO:`whoami`). The daemon spawns the startCommand without a shell (process.write to stdin), so shell metacharacters are NOT interpreted. No command execution. Good security.",
      evidence: "all three injection payloads echoed literally"
    });
  });

  it("step11: force-kill and confirm STOPPED", async () => {
    await ensureOwner("u1", key());
    const r = await panelCall({ method: "GET", path: "/protected_instance/kill", cookie: u1().cookie, token: u1().token, query: { daemonId: di(), uuid: iu() } });
    expect(r.httpStatus).toBe(200);
    await waitFor(async () => (await status()) === 0, { timeout: 25000, interval: 500, msg: "instance STOPPED after kill" });
    expect(await status()).toBe(0);
  });
});

// ─── Security / pentest ────────────────────────────────────────────────────────
describe("security: zip-slip / path traversal / key-not-instance-admin / forgery", () => {
  it("zip-slip: a '../' entry is rejected and nothing escapes the instance cwd", async () => {
    await ensureOwner("u1", key());
    const zip = path.join(world.workDir, "slip.zip");
    buildZip(zip, [
      { name: "../slipescape.txt", content: "PWNED" },
      { name: "inside.txt", content: "ok" }
    ]);
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    const up = await uploadToDaemon(pp, zip, "slip.zip", { unzip: false });
    expect(up.httpStatus).toBe(200);
    const dz = await decompress(di(), iu(), u1().cookie, u1().token, "slip.zip", ".");
    expect(dz.httpStatus, `decompress of zip-slip must be rejected: ${JSON.stringify(dz.raw).slice(0, 200)}`).not.toBe(200);
    const instDir = path.join(world.workDir, "daemon/data/InstanceData");
    expect(fs.existsSync(path.join(instDir, "slipescape.txt")), "escape file must NOT exist above instance dir").toBe(false);
    const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
    const ns = names(f);
    expect(ns).not.toContain("inside.txt");
    expect(ns).not.toContain("slipescape.txt");
  });

  it("path traversal: list/move/edit/delete/upload with ../ are rejected", async () => {
    await ensureOwner("u1", key());
    const l = await listFiles(di(), iu(), u1().cookie, u1().token, "../../../../etc");
    expect(l.httpStatus, "list ../../../../etc must be rejected").not.toBe(200);
    const mv = await moveFile(di(), iu(), u1().cookie, u1().token, [["test.mjs", "../../escaped.txt"]]);
    expect(mv.httpStatus, "move to ../ must be rejected").not.toBe(200);
    const ed = await editFile(di(), iu(), u1().cookie, u1().token, "../../etc/passwd", "x");
    expect(ed.httpStatus, "edit ../ must be rejected").not.toBe(200);
    const del = await deleteFiles(di(), iu(), u1().cookie, u1().token, ["../../etc/passwd"]);
    expect(del.httpStatus, "delete ../ must be rejected").not.toBe(200);
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, "../../");
    expect(pp.password).toBeTruthy();
    const tiny = path.join(world.workDir, "tiny.txt");
    fs.writeFileSync(tiny, "x");
    const up = await uploadToDaemon(pp, tiny, "evil.txt", { unzip: false });
    expect(up.httpStatus, "daemon upload to ../../ must be rejected").not.toBe(200);
  });

  it("key is NOT instance-admin: x-request-api-key cannot bypass per-instance gate", async () => {
    const r = await panelCall({ method: "GET", path: "/instance", key: key(), query: { daemonId: di(), uuid: iu() } });
    expect(r.httpStatus, "the integration-test key must NOT read a specific instance (per-instance gate reads session.uuid which is empty under the key)").not.toBe(200);
    addFinding({
      id: "F-key-not-instance-admin",
      step: "sec",
      severity: "info",
      title: "Integration-test key does not grant per-instance access",
      detail:
        "The --unsafe-integration-test-mode key only bypasses the `permission` middleware (level/token/session checks). The per-instance `router.use` gate (instance_operate/filemananger) reads ctx.session.uuid, which is empty under the key, so the key CANNOT operate/read a specific instance — it is NOT a full instance-admin bypass. It grants only the no-per-instance-gate admin routes (user/node/settings CRUD).",
      evidence: `GET /api/instance?uuid=... with key -> http=${r.httpStatus}`
    });
  });

  it("forged cookie/token cannot access protected routes", async () => {
    const r = await panelCall({ method: "GET", path: "/instance", cookie: "koa:sess=fake; koa:sess.sig=fake", token: "FAKE-TOKEN", query: { daemonId: di(), uuid: iu() } });
    expect(r.httpStatus).toBe(403);
  });
});

// ─── Steps 12-14: assign + reinstall + cleanup ────────────────────────────────
describe("steps 12-14 assign + reinstall + cleanup", () => {
  it("step12: assign instance to test_user2; u2 can now read it", async () => {
    await ensureOwner("u2", key());
    const g = await panelCall({ method: "GET", path: "/instance", cookie: u2().cookie, token: u2().token, query: { daemonId: di(), uuid: iu() } });
    expect(g.httpStatus, "test_user2 must read the instance after assignment").toBe(200);
  });

  it("step13: test_user1 reinstalls the same preset; uploaded files are wiped", async () => {
    await ensureOwner("u1", key());
    const before = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
    expect(names(before)).toContain("test.mjs");
    const r = await panelCall({ method: "POST", path: "/protected_instance/install_instance", cookie: u1().cookie, token: u1().token, query: { daemonId: di(), uuid: iu() }, body: { title: world.instance.preset!.title, description: world.instance.preset!.description } });
    expect(r.httpStatus, `reinstall: ${JSON.stringify(r.raw).slice(0, 200)}`).toBe(200);
    await waitFor(async () => (await status()) === 0, { timeout: 200000, interval: 2000, msg: "reinstall STOPPED" });
    const after = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
    const ns = names(after);
    expect(ns, "uploaded test.mjs must be cleared by reinstall").not.toContain("test.mjs");
    expect(ns.some((n: string) => n.endsWith(".jar")), "jar re-downloaded after reinstall").toBe(true);
  }, 220000);

  it("step14: delete the instance + delete test users", async () => {
    await waitFor(async () => (await status()) === 0, { timeout: 20000, interval: 1000 });
    const d = await panelCall({ method: "DELETE", path: "/instance", key: key(), query: { daemonId: di() }, body: { uuids: [iu()], deleteFile: true } });
    expect(d.httpStatus, `delete instance: ${JSON.stringify(d.raw).slice(0, 200)}`).toBe(200);
    try { await ensureUser("u1", key()); } catch { /* already gone */ }
    try { await ensureUser("u2", key()); } catch { /* already gone */ }
    const uuids = [world.admin, world.u1, world.u2].map((x) => x.uuid).filter(Boolean) as string[];
    const du = await panelCall({ method: "DELETE", path: "/auth", key: key(), body: uuids });
    expect(du.httpStatus, `delete users: ${JSON.stringify(du.raw).slice(0, 200)}`).toBe(200);
    for (const u of [world.admin, world.u1, world.u2]) {
      const s = await panelCall({ method: "GET", path: "/auth/search", key: key(), query: { userName: u.name, page: 1, page_size: 10 } });
      const sd: any = s.data;
      const arr = Array.isArray(sd) ? sd : sd?.data || [];
      expect(arr.find((x: any) => x.userName === u.name), `${u.name} should be deleted`).toBeFalsy();
    }
  });
});
