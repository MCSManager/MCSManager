/*
  Copyright (C) 2022 https://github.com/mcsmanager team.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.
*/

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
