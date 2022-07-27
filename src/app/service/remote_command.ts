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

import { v4 } from "uuid";
import { IPacket, IRequestPacket } from "../entity/entity_interface";
import RemoteService from "../entity/remote_service";

class RemoteError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

// Use RemoteRequest to send Socket.io events and data to remote services,
// and support synchronous response data (such as HTTP).
export default class RemoteRequest {
  constructor(public readonly rService: RemoteService) {
    if (!this.rService || !this.rService.socket)
      throw new Error("Unable to complete initialization, remote service does not exist.");
  }

  // request to remote daemon
  public async request(event: string, data?: any, timeout = 6000, force = false): Promise<any> {
    if (!this.rService.socket)
      throw new Error("The Socket must is SocketIOClient.Socket, Not null.");
    if (!this.rService.available && !force)
      throw new Error(
        "The remote daemon is not available. Try reconnecting to the remote daemon or check the configuration"
      );
    if (!this.rService.socket.connected && !force)
      throw new Error("The remote daemon connection is unavailable");

    return new Promise((resolve, reject) => {
      const uuid = [v4(), new Date().getTime()].join("");
      const protocolData: IRequestPacket = { uuid, data };

      // Start countdown
      const countdownTask = setTimeout(
        () =>
          reject(new RemoteError(`Request daemon:(${this.rService.config.ip}) [${event}] timeout`)),
        timeout
      );

      // define event function
      const fn = (msg: IPacket) => {
        if (msg.uuid === uuid) {
          clearTimeout(countdownTask);
          // 每当返回消息后，匹配ID确保响应是请求的对应，则删除自身事件监听
          this.rService.socket.removeEventListener(event, fn);
          if (msg.status == RemoteService.STATUS_OK) resolve(msg.data);
          else if (msg.data.err) {
            reject(new RemoteError(msg.data.err));
          } else {
            reject(new RemoteError(msg.data));
          }
        }
      };
      this.rService.socket.on(event, fn);
      // send command
      this.rService.emit(event, protocolData);
    });
  }
}
