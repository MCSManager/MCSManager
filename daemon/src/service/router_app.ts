import { EventEmitter } from "events";
import { Socket } from "socket.io";
import RouterContext from "../entity/ctx";
import { responseError } from "./protocol";

// RouterApp lives in its own module so it has NO import cycle with the router
// files that register handlers on it. `service/router.ts` re-exports this singleton
// and triggers the router side-effect imports from there. Under an ESM loader
// (vitest), a single module that BOTH defines `routerApp` AND statically imports the
// routers would have its router imports hoisted above the `routerApp` initializer,
// leaving handlers to see an undefined `routerApp`. Splitting the singleton out
// breaks the cycle without changing any runtime behavior (webpack CJS is unaffected).

// Routing controller class (singleton class)
class RouterApp extends EventEmitter {
  public readonly middlewares: Array<Function>;

  constructor() {
    super();
    this.middlewares = [];
  }

  emitRouter(event: string, ctx: RouterContext, data: any) {
    try {
      // service logic routing trigger point
      super.emit(event, ctx, data);
    } catch (error: any) {
      responseError(ctx, error);
    }
    return this;
  }

  on(event: string, fn: (ctx: RouterContext, data: any) => void) {
    return super.on(event, fn);
  }

  use(fn: (event: string, ctx: RouterContext, data: any, next: Function) => void) {
    this.middlewares.push(fn);
  }

  getMiddlewares() {
    return this.middlewares;
  }
}

// routing controller singleton class
export const routerApp = new RouterApp();

export type { RouterApp };

/**
 * Based on Socket.io for routing decentralization and secondary forwarding
 * @param {Socket} socket
 */
export function navigation(socket: Socket) {
  // Full-life session variables (Between connection and disconnection)
  const session: any = {};
  // Register all middleware with Socket
  for (const fn of routerApp.getMiddlewares()) {
    socket.use((packet, next) => {
      const protocol = packet[1] as any;
      if (!protocol) return;
      const ctx = new RouterContext(protocol.uuid, socket, session);
      fn(packet[0], ctx, protocol.data, next);
    });
  }
  // Register all events with Socket
  for (const event of routerApp.eventNames()) {
    socket.on(event as string, (protocol: any) => {
      if (!protocol) return;
      const ctx = new RouterContext(protocol.uuid, socket, session, event.toString());
      routerApp.emitRouter(event as string, ctx, protocol.data);
    });
  }
  // The connected event route is triggered
  const ctx = new RouterContext(null, socket, session);
  routerApp.emitRouter("connection", ctx, null);
}
