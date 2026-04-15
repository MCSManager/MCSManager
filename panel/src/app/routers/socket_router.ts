import { Socket } from "socket.io";

// Routing for WebSocket, based on Socket.io
export default class WebSocketRouter {
  private static readonly ALERT_ROOM = "alerts";

  constructor(public socket: Socket) {
    this.routers(socket);
  }

  private routers(socket: Socket) {
    socket.on("subscribe_alerts", () => {
      socket.join(WebSocketRouter.ALERT_ROOM);
    });

    socket.on("unsubscribe_alerts", () => {
      socket.leave(WebSocketRouter.ALERT_ROOM);
    });
  }
}
