import { Socket } from "socket.io";
import StreamProxy from "../service/stream_proxy";

// Routing for WebSocket, based on Socket.io
// The browser can open a terminal stream channel directly against the daemon,
// or - when the node enables "proxyWebSocket" - through the panel. In the
// latter case every browser socket is relayed by a StreamProxy instance.
export default class WebSocketRouter {
  private readonly proxy: StreamProxy;

  constructor(public socket: Socket) {
    this.proxy = new StreamProxy(socket);
    this.routers(socket);
  }

  private routers(socket: Socket) {
    // The browser introduces the stream channel by presenting its passport.
    socket.on("stream/auth", (packet) => {
      this.proxy.openStreamChannel(packet);
    });

    // Other browser events (stream/write, stream/input, stream/resize,
    // stream/detail, ...) are forwarded to the daemon pipe.
    socket.onAny((event, ...args) => {
      this.proxy.forwardToDaemon(event, args);
    });

    socket.on("disconnect", () => {
      this.proxy.dispose();
    });
  }
}