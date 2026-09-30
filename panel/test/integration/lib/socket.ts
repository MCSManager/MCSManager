import { io } from "socket.io-client";
import { sleep } from "./util";

export interface Stream {
  socket: any;
  stdout: string[];
  ready: Promise<boolean>;
  send: (command: string) => void;
  write: (input: string) => void;
  disconnect: () => void;
}

// Connect a raw socket.io client directly to the daemon (panel socket_router
// is dead code). Uses a MissionPassport from POST /api/protected_instance/stream_channel.
// Wire protocol mirrors frontend useTerminal.ts: emit "{ data: {...} }", receive
// packets `{ uuid, status, event, data }` -> text is packet.data.text.
export function connectStream(addr: string, prefix: string, password: string, readyTimeoutMs = 15000): Stream {
  const path = (prefix || "") + "/socket.io";
  const base = addr.startsWith("http") || addr.startsWith("ws") ? addr : `http://${addr}`;
  const url = base.startsWith("ws://") ? "http://" + base.slice(5) : base.startsWith("wss://") ? "https://" + base.slice(4) : base;
  const socket = io(url, {
    path,
    transports: ["websocket"],
    reconnection: false,
    timeout: 10000,
    forceNew: true
  });
  const stdout: string[] = [];
  let resolveReady: (v: boolean) => void;
  const ready = new Promise<boolean>((r) => (resolveReady = r));
  let settled = false;
  const done = (v: boolean) => {
    if (!settled) {
      settled = true;
      resolveReady(v);
    }
  };
  socket.on("connect", () => {
    socket.emit("stream/auth", { data: { password } });
  });
  socket.on("stream/auth", (packet: any) => {
    if (packet?.data === true) {
      socket.emit("stream/detail", {});
      done(true);
    } else {
      done(false);
    }
  });
  socket.on("instance/stdout", (packet: any) => {
    const text = packet?.data?.text ?? "";
    if (text) stdout.push(text);
  });
  socket.on("connect_error", () => done(false));
  setTimeout(() => done(false), readyTimeoutMs);

  return {
    socket,
    stdout,
    ready,
    send: (command: string) => socket.emit("stream/input", { data: { command } }),
    write: (input: string) => socket.emit("stream/write", { data: { input } }),
    disconnect: () => {
      try {
        socket.removeAllListeners();
        socket.disconnect();
      } catch {
        /* noop */
      }
    }
  };
}

// Wait until the stream's stdout buffer contains the predicate match.
export async function waitForOutput(stream: Stream, pred: (text: string) => boolean, timeout = 15000, interval = 100): Promise<boolean> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (stream.stdout.some(pred)) return true;
    await sleep(interval);
  }
  return false;
}

export function collectText(stream: Stream): string {
  return stream.stdout.join("");
}
