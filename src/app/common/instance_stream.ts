// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import { Socket } from "socket.io";

// 应用实例数据流转发适配器

export default class InstanceStreamListener {
  // Instance uuid -> Socket[]
  public readonly listenMap = new Map<string, Socket[]>();

  public requestForward(socket: Socket, instanceUuid: string) {
    if (this.listenMap.has(instanceUuid)) {
      const sockets = this.listenMap.get(instanceUuid);
      for (const iterator of sockets)
        if (iterator.id === socket.id)
          throw new Error(`此 Socket ${socket.id} 已经存在于指定实例监听表中`);
      sockets.push(socket);
    } else {
      this.listenMap.set(instanceUuid, [socket]);
    }
  }

  public cannelForward(socket: Socket, instanceUuid: string) {
    if (!this.listenMap.has(instanceUuid))
      throw new Error(`指定 ${instanceUuid} 并不存在于监听表中`);
    const socketList = this.listenMap.get(instanceUuid);
    socketList.forEach((v, index) => {
      if (v.id === socket.id) socketList.splice(index, 1);
    });
  }

  public forward(instanceUuid: string, data: any) {
    const sockets = this.listenMap.get(instanceUuid);
    sockets.forEach((socket) => {
      if (socket && socket.connected) socket.emit("instance/stdout", data);
    });
  }

  public forwardViaCallback(instanceUuid: string, callback: (socket: Socket) => void) {
    if (this.listenMap.has(instanceUuid)) {
      const sockets = this.listenMap.get(instanceUuid);
      sockets.forEach((socket) => {
        if (socket && socket.connected) callback(socket);
      });
    }
  }

  public hasListenInstance(instanceUuid: string) {
    return this.listenMap.has(instanceUuid) && this.listenMap.get(instanceUuid).length > 0;
  }
}
