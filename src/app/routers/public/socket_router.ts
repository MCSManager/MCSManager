// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import { Socket } from "socket.io";

// 适用于 WebSocket 的路由，基于 Socket.io（暂时无用）
export default class WebSocketRouter {
  constructor(public socket: Socket) {
    this.routers(socket);
  }

  private routers(socket: Socket) {
    socket.use((event, next) => {
      socket.disconnect(); // 暂时禁用 Websocket
      return next(null);
    });
  }
}
