/*
  Copyright (C) 2022 Suwings <Suwings@outlook.com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings <Suwings@outlook.com>

  该程序是免费软件，您可以重新分发和/或修改据 GNU Affero 通用公共许可证的条款，
  由自由软件基金会，许可证的第 3 版，或（由您选择）任何更高版本。

  根据 AGPL 与用户协议，您必须保留所有版权声明，如果修改源代码则必须开源修改后的源代码。
  可以前往 https://mcsmanager.com/ 阅读用户协议，申请闭源开发授权等。
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
