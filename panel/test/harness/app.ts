import Koa from "koa";
import Router from "@koa/router";
import koaBody from "koa-body";
import { middleware as protocolMiddleware } from "../../src/app/middleware/protocol";

// In-memory session store keyed by a test-supplied id (header x-test-session-id).
const sessions = new Map<string, any>();

export function registerSession(s: any): { id: string; session: any } {
  const id = `sess-${Math.random().toString(36).slice(2)}`;
  sessions.set(id, s);
  return { id, session: s };
}

export function resetSessions() {
  sessions.clear();
}

// Mount the given real @koa/router instance(s) on a /api-prefixed api router,
// with a fake session middleware (replaces koa-session), a light JSON body parser,
// and the real {status,data,time} envelope middleware. Returns the Koa app.
export function createTestApp(routers: Router[]) {
  const app = new Koa();
  const api = new Router({ prefix: "/api" });
  for (const r of routers) {
    api.use(r.routes()).use(r.allowedMethods());
  }
  // Fake session middleware: tests seed a session via registerSession() + the
  // x-test-session-id header, so the real permission middleware reads real values.
  app.use(async (ctx, next) => {
    const id = ctx.get("x-test-session-id");
    ctx.session = (id && sessions.get(id)) || { save() {}, maxAge: -1 };
    await next();
  });
  app.use(
    koaBody({
      multipart: false,
      jsonLimit: "10mb",
      // Mirror panel/src/app.app.ts: the real app parses GET/PUT/POST/DELETE so route
      // handlers can read ctx.request.body on DELETE (manage_user deletes by uuid list).
      parsedMethods: ["GET", "PUT", "POST", "DELETE", "PATCH"]
    })
  );
  app.use(protocolMiddleware);
  app.use(api.routes()).use(api.allowedMethods());
  return app;
}

// Unwrap the panel {status, data, time} envelope. Returns {status, data, raw}.
export function unwrap(res: { text: string; status: number }) {
  let raw: any = res.text;
  try {
    raw = JSON.parse(res.text);
  } catch {
    /* keep raw text */
  }
  if (raw && typeof raw === "object" && "status" in raw && "data" in raw && "time" in raw) {
    return { status: raw.status, data: raw.data, raw };
  }
  return { status: res.status, data: raw, raw };
}
