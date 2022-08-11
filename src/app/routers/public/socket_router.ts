// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import { Socket } from "socket.io";

// Routing for WebSocket, based on Socket.io (useless for now)
export default class WebSocketRouter {
  constructor(public socket: Socket) {
    this.routers(socket);
  }

  private routers(socket: Socket) {
    socket.use((event, next) => {
      socket.disconnect(); // temporarily disable Websocket
      return next(null);
    });
  }
}
