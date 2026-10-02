import { expect } from "vitest";
import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import { world, saveState } from "./world";
import { requestPanel, ensureUser, ensureOwner } from "./http";
import { listFiles, getUploadPassport, uploadToDaemon } from "./files";

// Shared helpers for the security_* integration suites (the former monolithic
// suites/security.test.ts, split by module into security_user / security_instance
// / security_files / security_auth). Every suite file boots its OWN fresh
// daemon+panel pair (run.mjs runs one suite file per vitest invocation), so each
// file is self-contained: its first `it` calls setupSecurityWorld() to create
// the users + main instance + test.mjs fixture the module cases need.
//
// Notes (carried over from the monolithic suite):
// - The integration-test key bypasses the panel `permission` middleware ONLY
//   (see auth.test.ts #F-key-not-instance-admin): instance/file gates still
//   read `ctx.session.uuid`, so the key gets 403/500 there.
// - The login-ban block lives at the END of security_auth.test.ts: the IP ban
//   is in-memory for 10 minutes and would break any later login in that panel
//   process. Sibling suites boot their own panel process (fresh ban state).

export const di = () => world.daemonId;
export const u1 = () => ({ cookie: world.u1.cookie!, token: world.u1.token! });
export const u2 = () => ({ cookie: world.u2.cookie!, token: world.u2.token! });
export const adm = () => ({ cookie: world.admin.cookie!, token: world.admin.token! });
export const FIXTURE = path.join(__dirname, "../fixtures/test.mjs");

export const STOPPED = 0;
export const RUNNING = 3;

export const names = (r: any) => (r?.data?.items || []).map((x: any) => x.name);

// user rows from /auth/search are scrubbed: passWord/salt cleared, apiKey
// masked to "__MCSM_SECRET_DATA__" when set. Shape: { maxPage, page, data: [] }.
export function searchRows(r: any): any[] {
  const sd = r?.data;
  return Array.isArray(sd) ? sd : sd?.data || [];
}

export async function searchUser(name: string): Promise<any> {
  const r = await requestPanel({
    method: "GET",
    path: "/auth/search",
    key: world.key,
    query: { userName: name, page: 1, page_size: 10 }
  });
  return searchRows(r).find((x: any) => x.userName === name);
}

// Raw user record on disk (panel/data/User/<uuid>.json) - asserts against the
// REAL stored fields, not the scrubbed API view.
export function readUserFile(uuid: string): any {
  const p = path.join(world.workDir, "panel/data/User", `${uuid}.json`);
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export async function createInstance(nickname: string, extra: any = {}): Promise<string> {
  const r = await requestPanel({
    method: "POST",
    path: "/instance",
    key: world.key,
    query: { daemonId: di() },
    body: {
      nickname,
      startCommand: "node test.mjs",
      stopCommand: "exit",
      cwd: "",
      ie: "utf-8",
      oe: "utf-8",
      ...extra
    }
  });
  expect(r.httpStatus, `create ${nickname}: ${JSON.stringify(r.raw).slice(0, 200)}`).toBe(200);
  expect(r.data?.instanceUuid).toBeTruthy();
  return r.data.instanceUuid;
}

export async function deleteInstance(uuid: string) {
  return requestPanel({
    method: "DELETE",
    path: "/instance",
    key: world.key,
    query: { daemonId: di() },
    body: { uuids: [uuid], deleteFile: true }
  });
}

// setUserInstances REPLACES the whole list - always pass every uuid u1 owns.
export async function assignToU1(uuids: string[]) {
  const r = await requestPanel({
    method: "PUT",
    path: "/auth",
    key: world.key,
    body: {
      uuid: world.u1.uuid,
      config: { instances: uuids.map((u) => ({ daemonId: di(), instanceUuid: u })) }
    }
  });
  expect(r.httpStatus, `assign u1: ${JSON.stringify(r.raw).slice(0, 200)}`).toBe(200);
}

export async function getStatusOf(uuid: string): Promise<number> {
  const r = await requestPanel({
    method: "GET",
    path: "/instance",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid }
  });
  return r?.data?.status ?? -99;
}

export const openOf = (uuid: string) =>
  requestPanel({
    method: "GET",
    path: "/protected_instance/open",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid }
  });

export const stopOf = (uuid: string) =>
  requestPanel({
    method: "GET",
    path: "/protected_instance/stop",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid }
  });

export const commandTo = (uuid: string, command: string) =>
  requestPanel({
    method: "GET",
    path: "/protected_instance/command",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid, command }
  });

export const outputlogOf = (uuid: string, query: Record<string, any> = {}) =>
  requestPanel({
    method: "GET",
    path: "/protected_instance/outputlog",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid, ...query }
  });

export async function setSetting(config: any) {
  const r = await requestPanel({
    method: "PUT",
    path: "/overview/setting",
    key: world.key,
    body: config
  });
  expect(r.httpStatus, `setSetting ${JSON.stringify(config)}: ${JSON.stringify(r.raw).slice(0, 160)}`).toBe(
    200
  );
}

// Raw axios call with ONLY an api-key credential (no cookie, no token, no
// x-requested-with) - proves the api-key branch is a full session substitute.
export function rawApiKeyGet(urlPath: string, apiKey: string, query: Record<string, any> = {}) {
  return axios.get(`${world.panelUrl}${urlPath}`, {
    params: query,
    headers: { "x-request-api-key": apiKey },
    validateStatus: () => true,
    timeout: 30000
  });
}

// Passport `addr` values arrive as "host:port" / "ws://host:port" - normalize
// to an http(s) base URL like lib/files.ts httpBase().
export function daemonBase(addr: string): string {
  if (!addr) return world.daemonHttpUrl;
  if (addr.startsWith("http://") || addr.startsWith("https://")) return addr;
  if (addr.startsWith("ws://")) return "http://" + addr.slice(5);
  if (addr.startsWith("wss://")) return "https://" + addr.slice(6);
  return "http://" + addr;
}

// Shared setup body: ensure admin/u1/u2, promote admin to ROLE.ADMIN, create +
// assign the main instance to u1, upload the test.mjs fixture. Used as the
// first `it` of every security_* suite file.
export async function setupSecurityWorld() {
  world.admin.uuid = await ensureUser("admin", world.key);
  world.u1.uuid = await ensureUser("u1", world.key);
  world.u2.uuid = await ensureUser("u2", world.key);
  saveState();
  expect(world.admin.uuid).toBeTruthy();
  expect(world.u1.uuid).toBeTruthy();
  expect(world.u2.uuid).toBeTruthy();

  // Promote test_admin to permission 10 so the suite can contrast
  // ADMIN-vs-USER redaction (e.g. /files/status disk list).
  const p = await requestPanel({
    method: "PUT",
    path: "/auth",
    key: world.key,
    body: { uuid: world.admin.uuid, config: { permission: 10 } }
  });
  expect(p.httpStatus, `promote admin: ${JSON.stringify(p.raw).slice(0, 160)}`).toBe(200);
  expect(readUserFile(world.admin.uuid!).permission).toBe(10);

  world.instance.uuid = await createInstance(world.instance.name);
  saveState();
  await ensureOwner("u1", world.key);

  const pp = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
  expect(pp.password).toBeTruthy();
  const up = await uploadToDaemon(pp, FIXTURE, "test.mjs", { unzip: false });
  expect(up.httpStatus, `upload fixture: ${JSON.stringify(up.data).slice(0, 160)}`).toBe(200);
  const f = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
  expect(names(f)).toContain("test.mjs");
}
