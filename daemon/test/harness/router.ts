import { vi } from "vitest";
import RouterContext from "../../src/entity/ctx";
import { routerApp } from "../../src/service/router_app";

export interface FakeSocket {
  id: string;
  handshake: { address: string };
  on: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  use: ReturnType<typeof vi.fn>;
}

let idSeq = 0;
export function fakeSocket(address = "127.0.0.1"): FakeSocket {
  // daemon sockets report IPv4 as ::ffff:<v4>; auth_router strips that prefix.
  const full = address.startsWith("::ffff:") ? address : `::ffff:${address}`;
  return {
    id: `sock-${idSeq++}`,
    handshake: { address: full },
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    use: vi.fn()
  };
}

export function newContext(event: string, opts: { uuid?: string | null; session?: any } = {}) {
  const socket = fakeSocket();
  const session = opts.session ?? {};
  const ctx = new RouterContext(opts.uuid ?? null, socket as any, session, event);
  return { ctx, socket, session };
}

// Handler mode: skip gate middlewares, run only the event handler (assume authenticated).
export function invoke(
  event: string,
  data: any,
  opts: { uuid?: string | null; session?: any } = {}
) {
  const { ctx, socket, session } = newContext(event, opts);
  routerApp.emitRouter(event, ctx, data);
  return { socket, ctx, session };
}

// Gate mode: run every routerApp.use middleware in order, then the event handler.
// Mirrors navigation()'s socket.use(...)+socket.on(...) dispatch without a real server.
export function dispatch(
  event: string,
  data: any,
  opts: { uuid?: string | null; session?: any } = {}
) {
  const { ctx, socket, session } = newContext(event, opts);
  const mws = routerApp.getMiddlewares();
  let i = -1;
  function next(): any {
    i += 1;
    const mw = mws[i];
    if (!mw) {
      routerApp.emitRouter(event, ctx, data);
      return;
    }
    return mw(event, ctx, data, next);
  }
  next();
  return { socket, ctx, session };
}

// Return every recorded packet for an event: [{ status, data, event, uuid }]
export function packetsFor(socket: FakeSocket, event: string) {
  return socket.emit.mock.calls.filter((c) => c[0] === event).map((c) => c[1]);
}

// Flush pending microtasks/macrotasks so async event handlers settle before assertions.
export function flush(): Promise<void> {
  return new Promise((r) => setImmediate(r));
}
