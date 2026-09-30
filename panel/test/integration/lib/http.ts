import axios from "axios";
import { world, saveState } from "./world";

const PANEL = () => world.panelUrl;

export interface RawRes {
  status: number; // envelope status (== http status for plain bodies)
  data: any;
  httpStatus: number;
  raw: any;
}

// Unwrap the panel {status,data,time} envelope. Panel's protocol middleware
// serializes Error->500, string->{status,data,time}, 404->envelope, falsy->500.
export function unwrap(res: any): RawRes {
  const body = res.data;
  let status = res.status;
  let data: any = body;
  if (body && typeof body === "object" && "status" in body && "data" in body && "time" in body) {
    status = (body as any).status;
    data = (body as any).data;
  } else if (typeof body === "string") {
    try {
      const j = JSON.parse(body);
      if (j && typeof j === "object" && "status" in j && "data" in j) {
        status = j.status;
        data = j.data;
      }
    } catch {
      /* keep raw string */
    }
  }
  return { status, data, httpStatus: res.status, raw: res.data };
}

export interface CallOpts {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string; // under /api, e.g. "/auth/login"
  key?: string; // integration-test key (admin bypass)
  cookie?: string; // session cookie
  token?: string; // ?token=
  query?: Record<string, any>;
  body?: any;
  timeout?: number;
  headers?: Record<string, string>;
}

export async function panelCall(o: CallOpts): Promise<RawRes> {
  const params: any = { ...(o.query || {}) };
  if (o.token) params.token = o.token;
  const headers: any = { ...(o.headers || {}) };
  if (o.key) headers["x-request-api-key"] = o.key;
  if (o.cookie) {
    headers["Cookie"] = o.cookie;
    headers["x-requested-with"] = "XMLHttpRequest";
  }
  // Panel file/instance routes apply per-session speedLimit (e.g. /files/list
  // speedLimit 0.1, /files/move speedLimit 3). Rapid sequential calls return
  // 500 "This operation is on cooldown"; retry after a short backoff.
  for (let attempt = 0; attempt < 10; attempt++) {
    const res = await axios({
      method: o.method,
      url: `${PANEL()}/api${o.path}`,
      params,
      data: o.body,
      headers,
      timeout: o.timeout ?? 90000,
      validateStatus: () => true,
      maxRedirects: 0
    });
    const r = unwrap(res);
    if (r.httpStatus === 500 && /cooldown|try again/i.test(String(r.data))) {
      await new Promise((s) => setTimeout(s, 400));
      continue;
    }
    return r;
  }
  // last resort: return a cooldown-shaped error so callers can assert
  return { status: 500, data: "cooldown exhausted", httpStatus: 500, raw: "cooldown exhausted" };
}

export interface LoginResult {
  ok: boolean;
  token: string;
  cookie: string;
  httpStatus: number;
  raw: any;
}

export async function login(user: string, pass: string): Promise<LoginResult> {
  const res = await axios({
    method: "POST",
    url: `${PANEL()}/api/auth/login`,
    data: { username: user, password: pass },
    headers: { "x-requested-with": "XMLHttpRequest" },
    timeout: 30000,
    validateStatus: () => true
  });
  const setCookie: string[] = res.headers["set-cookie"] || [];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  let token: any = res.data;
  if (token && typeof token === "object" && "data" in token) token = token.data;
  const wrapped = unwrap(res);
  return {
    ok: wrapped.httpStatus === 200 && typeof wrapped.data === "string" && wrapped.data.length > 4,
    token: String(token || ""),
    cookie,
    httpStatus: res.status,
    raw: res.data
  };
}

// Create a session bundle for a user (login + store cookie/token on world).
export async function loginSession(
  target: "admin" | "u1" | "u2"
): Promise<{ cookie: string; token: string }> {
  const u = world[target];
  const r = await login(u.name, u.pass);
  if (!r.ok) throw new Error(`login ${u.name} failed: http=${r.httpStatus} body=${JSON.stringify(r.raw)}`);
  u.cookie = r.cookie;
  u.token = r.token;
  saveState();
  return { cookie: r.cookie, token: r.token };
}

// Ensure a non-admin user currently exists in the panel. The panel's
// userSystem has been observed to briefly read EMPTY right after a rapid
// burst of user creations (it self-heals within ~1-2s by re-reading disk),
// so we first POLL for the user by name to let it self-heal, and only
// re-create if it stays genuinely absent. Then (re)login for a fresh session.
export async function ensureUser(target: "u1" | "u2", key: string, settleMs = 12000): Promise<string> {
  const u = world[target];
  const findByName = async () => {
    const ov = await panelCall({ method: "GET", path: "/auth/overview", key });
    return (ov.data || []).find((x: any) => x.userName === u.name);
  };
  let existing = await findByName();
  if (!existing?.uuid) {
    // wait for the panel user store to self-heal (transient empty window)
    const until = Date.now() + settleMs;
    while (Date.now() < until && !existing?.uuid) {
      await new Promise((r) => setTimeout(r, 400));
      existing = await findByName();
    }
  }
  if (!existing?.uuid) {
    // still absent after settle: (re)create it via key
    const c = await panelCall({ method: "POST", path: "/auth", key, body: { username: u.name, password: u.pass, permission: 1 } });
    if (c.httpStatus === 200 && c.data?.uuid) {
      u.uuid = c.data.uuid;
    } else {
      const s = await panelCall({ method: "GET", path: "/auth/search", key, query: { userName: u.name, page: 1, page_size: 10 } });
      const sd: any = s.data;
      const sa = Array.isArray(sd) ? sd : sd?.data || [];
      u.uuid = sa.find((x: any) => x.userName === u.name)?.uuid;
    }
    existing = await findByName();
  }
  if (existing?.uuid) u.uuid = existing.uuid;
  // (re)login — retry until it succeeds; never keep a stale/invalid cookie.
  for (let i = 0; i < 6; i++) {
    const r = await login(u.name, u.pass);
    if (r.ok) {
      u.cookie = r.cookie;
      u.token = r.token;
      saveState();
      return u.uuid!;
    }
    await new Promise((res) => setTimeout(res, 500));
  }
  throw new Error(`ensureUser ${u.name}: login kept failing (user likely absent)`);
}

// Ensure a user exists AND owns the test instance, with a fresh session.
// Verifies ownership via /auth/overview and retries the whole sequence,
// because the panel's user store can be transiently empty at file boundaries.
export async function ensureOwner(target: "u1" | "u2", key: string): Promise<string> {
  for (let i = 0; i < 8; i++) {
    try {
      await ensureUser(target, key);
    } catch {
      await new Promise((res) => setTimeout(res, 600));
      continue;
    }
    const putRes = await panelCall({
      method: "PUT",
      path: "/auth",
      key,
      body: { uuid: world[target].uuid, config: { instances: [{ daemonId: world.daemonId, instanceUuid: world.instance.uuid }] } }
    });
    const ov = await panelCall({ method: "GET", path: "/auth/overview", key });
    const me = (ov.data || []).find((x: any) => x.uuid === world[target].uuid);
    const owns = me?.instances?.some((x: any) => x.daemonId === world.daemonId && x.instanceUuid === world.instance.uuid);
    if (putRes.httpStatus !== 200 || !owns) {
      // assign did not stick — panel user store may be transient; retry shortly
      await new Promise((res) => setTimeout(res, 600));
      continue;
    }
    saveState();
    return world[target].uuid!;
  }
  throw new Error(`ensureOwner ${target}: could not make the user own the instance`);
}

// Retried login (handles the transient empty-window where getUserByUserName returns null).
export async function loginSessionRetry(target: "admin" | "u1" | "u2", tries = 6, delayMs = 700): Promise<void> {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    try {
      await loginSession(target);
      return;
    } catch (e: any) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}
