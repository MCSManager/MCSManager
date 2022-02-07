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

  // request to remote service
  public async request(event: string, data?: any, timeout = 6000, force = false): Promise<any> {
    if (!this.rService.socket)
      throw new Error("The Socket must is SocketIOClient.Socket, Not null.");
    if (!this.rService.available && !force)
      throw new Error("远程服务状态不可用，建议尝试重连远程服务或检查配置");
    if (!this.rService.socket.connected && !force)
      throw new Error("远程服务连接不可用，无法发送数据");

    return new Promise((resolve, reject) => {
      const uuid = [v4(), new Date().getTime()].join("");
      const protocolData: IRequestPacket = { uuid, data };

      // Start countdown
      const countdownTask = setTimeout(
        () => reject(new RemoteError(`请求远程(${this.rService.config.ip})事件 [${event}] 超时`)),
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
