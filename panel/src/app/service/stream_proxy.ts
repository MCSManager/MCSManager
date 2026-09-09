import { removeTrail } from "mcsmanager-common";
import { Socket } from "socket.io";
import { io, Socket as ClientSocket } from "socket.io-client";
import RemoteServiceSubsystem from "./remote_service";
import { systemConfig } from "../setting";

// Time given to the browser to present its "stream/auth" passport.
const AUTH_TIMEOUT = 15000;

// Cross-panel relay for a single browser <-> daemon stream channel.
// Each browser connection owns one daemon socket.io client ("pipe"). Once
// the browser presents its passport, every daemon event (stream/auth
// response, instance/stdout, stream/detail, ...) is relayed back to the
// browser, and every other browser event (stream/write, stream/input,
// stream/resize, ...) is forwarded to the pipe.
export default class StreamProxy {
  private daemonSocket?: ClientSocket;
  private pipeToken = 0;
  private authTimer?: ReturnType<typeof setTimeout>;
  private everConnected = false;
  private reportedConnectError = false;

  constructor(public readonly browserSocket: Socket) {
    // Release idle connections that never present a passport.
    this.authTimer = setTimeout(() => {
      if (!this.daemonSocket) this.browserSocket.disconnect();
    }, AUTH_TIMEOUT);
  }

  // Called when the browser presents "stream/auth". Opens a socket.io
  // client pipe to the target daemon and forwards events bidirectionally.
  public openStreamChannel(packet: any) {
    if (this.authTimer) {
      clearTimeout(this.authTimer);
      this.authTimer = undefined;
    }

    const data = packet?.data ?? {};
    const password = String(data?.password ?? "");
    const daemonId = String(data?.daemonId ?? "");
    const remoteService = daemonId ? RemoteServiceSubsystem.getInstance(daemonId) : undefined;

    if (!password || !remoteService) {
      this.browserSocket.emit("stream/auth", {
        data: false,
        error: "Daemon or passport not found"
      });
      return;
    }

    // A re-emitted "stream/auth" (e.g. after a browser reconnect) replaces
    // the previous pipe instead of stacking listeners.
    const token = ++this.pipeToken;
    this.everConnected = false;
    this.reportedConnectError = false;
    this.closeDaemonPipe();

    const config = remoteService.config;
    let addr = `ws://${config.ip}:${config.port}`;
    if (config.ip.indexOf("wss://") === 0 || config.ip.indexOf("ws://") === 0) {
      addr = `${config.ip}:${config.port}`;
    }
    if (systemConfig?.ssl) {
      addr = addr.replace("ws://", "wss://");
    }

    const daemonSocket = io(addr, {
      ...config.connectOpts,
      path: removeTrail(config.prefix, "/") + "/socket.io",
      // The browser socket owns the reconnection cycle: when the pipe is
      // lost, the browser is disconnected and it re-issues "stream/auth".
      reconnection: false
    });
    this.daemonSocket = daemonSocket;

    // Forward every daemon event to the browser.
    daemonSocket.onAny((event, ...args) => {
      if (token !== this.pipeToken) return;
      this.browserSocket.emit(event, ...args);
    });

    daemonSocket.on("connect", () => {
      if (token !== this.pipeToken) return;
      this.everConnected = true;
      daemonSocket.emit("stream/auth", {
        data: { password }
      });
    });

    // The daemon pipe is gone: close the browser pipe as well so the
    // socket.io client reconnects and re-issues "stream/auth".
    daemonSocket.on("disconnect", () => {
      if (token !== this.pipeToken) return;
      this.closeDaemonPipe();
      if (this.everConnected) this.browserSocket.disconnect();
    });

    // The daemon cannot be reached; mirror an auth failure to the browser.
    daemonSocket.on("connect_error", () => {
      if (token !== this.pipeToken || this.reportedConnectError) return;
      this.reportedConnectError = true;
      this.browserSocket.emit("stream/auth", {
        data: false,
        error: "Unable to connect to daemon"
      });
    });
  }

  // Forwards any other browser event to the daemon pipe.
  public forwardToDaemon(event: string, args: any[]) {
    if (event === "stream/auth") return;
    this.daemonSocket?.emit(event, ...args);
  }

  public dispose() {
    if (this.authTimer) {
      clearTimeout(this.authTimer);
      this.authTimer = undefined;
    }
    this.closeDaemonPipe();
  }

  private closeDaemonPipe() {
    const socket = this.daemonSocket;
    this.daemonSocket = undefined;
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
  }
}