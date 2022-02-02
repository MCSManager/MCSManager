/*
  Copyright (C) 2022 Suwings(https://github.com/Suwings)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  
  According to the GPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings(https://github.com/Suwings)

  本程序为自由软件，你可以依据 GPL 的条款（第三版或者更高），再分发和/或修改它。
  该程序以具有实际用途为目的发布，但是并不包含任何担保，
  也不包含基于特定商用或健康用途的默认担保。具体细节请查看 GPL 协议。

  根据协议，您必须保留所有版权声明，如果修改源码则必须开源修改后的源码。
  前往 https://mcsmanager.com/ 申请闭源开发授权或了解更多。
*/

import http from "http";
import { Server, Socket } from "socket.io";
import WebSocketRouter from "../routers/public/socket_router";
import { logger } from "./log";

export default class SocketService {
  public static server: Server;
  public static readonly socketsMap = new Map<string, Socket>();

  public static setUpSocketIO(httpServer: http.Server) {
    const io = new Server(httpServer, {
      path: "/socket.io",
      cors: {
        // 临时的
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    io.on("connection", (socket) => {
      // 用户 Websocket 链接时，加入全局，绑定相关事件
      logger.info(`Websocket ${socket.id}(${socket.handshake.address}) connection`);
      this.socketsMap.set(socket.id, socket);
      // 绑定业务事件
      SocketService.bindEvents(socket);
      // 当用户 Websocket 断开时，从Socket列表中删除，并释放一些资源
      socket.on("disconnect", () => {
        this.socketsMap.delete(socket.id);
        for (const name of socket.eventNames()) socket.removeAllListeners(name);
        logger.info(`Websocket ${socket.id}(${socket.handshake.address}) disconnected`);
      });
    });

    this.server = io;
    return this.server;
  }

  // 用于绑定 Socket 事件
  private static bindEvents(socket: Socket) {
    new WebSocketRouter(socket);
  }
}
