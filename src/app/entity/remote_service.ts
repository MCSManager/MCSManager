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

import * as io from "socket.io-client";
import { RemoteServiceConfig } from "./entity_interface";
import { logger } from "../service/log";
import RemoteRequest from "../service/remote_command";
import InstanceStreamListener from "../common/instance_stream";

export default class RemoteService {
  public static readonly STATUS_OK = 200;
  public static readonly STATUS_ERR = 500;

  public uuid: string = null;
  public available: boolean = false;
  public socket: SocketIOClient.Socket = null;
  public readonly instanceStream = new InstanceStreamListener();
  public config: RemoteServiceConfig;

  constructor(uuid: string, config: RemoteServiceConfig) {
    this.uuid = uuid;
    this.config = config;
  }

  // 连接远程服务
  public connect(connectOpts?: SocketIOClient.ConnectOpts) {
    if (connectOpts) this.config.connectOpts = connectOpts;

    if (this.available) {
      logger.info(`[${this.uuid}] 用户发起重连已可用状态的远程服务，正在重置连接通道`);
      this.disconnect();
    }

    // 防止重复注册事件
    if (this.socket && this.socket.hasListeners("connect")) {
      logger.info(`[${this.uuid}] 用户发起重复连接请求，现进行重置连接配置`);
      return this.refreshReconnect();
    }

    // 开始正式连接远程Socket程序
    let addr = `ws://${this.config.ip}:${this.config.port}`;
    if (this.config.ip.indexOf("wss://") === 0 || this.config.ip.indexOf("ws://") === 0) {
      addr = `${this.config.ip}:${this.config.port}`;
    }
    logger.info(`[${this.uuid}] 面板正在尝试连接远程服务 ${addr}`);
    this.socket = io.connect(addr, connectOpts);

    // 注册内置事件
    this.socket.on("connect", async () => {
      logger.info(`远程服务 [${this.uuid}] [${this.config.ip}:${this.config.port}] 已连接`);
      await this.onConnect();
    });
    this.socket.on("disconnect", async () => {
      logger.info(`远程服务 [${this.uuid}] [${this.config.ip}:${this.config.port}] 已断开`);
      await this.onDisconnect();
    });
    this.socket.on("connect_error", async (error: string) => {
      logger.warn(`远程服务 [${this.uuid}] [${this.config.ip}:${this.config.port}] 连接错误`);
      await this.onDisconnect();
    });
  }

  // This function is used to verify the identity. It only needs to be verified once.
  // This function will be executed automatically after the connection event is triggered.
  // Generally, there is no need to execute it manually.
  public async auth(key?: string) {
    if (key) this.config.apiKey = key;
    try {
      const res = await new RemoteRequest(this).request("auth", this.config.apiKey, 5000, true);
      if (res === true) {
        this.available = true;
        logger.info(`远程服务 [${this.uuid}] [${this.config.ip}:${this.config.port}] 验证成功`);
        return true;
      }
      this.available = false;
      logger.warn(`远程服务 [${this.uuid}] [${this.config.ip}:${this.config.port}] 验证失败`);
      return false;
    } catch (error) {
      logger.warn(`远程服务 [${this.uuid}] [${this.config.ip}:${this.config.port}] 验证错误`);
      return false;
    }
  }

  public emit(event: string, data?: any) {
    return this.socket.emit(event, data);
  }

  private async onDisconnect() {
    this.available = false;
  }

  private async onConnect() {
    // this.available = true; Note: Connected is not auth;
    return await this.auth(this.config.apiKey);
  }

  disconnect() {
    if (this.socket) {
      logger.info(`[${this.uuid}] [${this.config.ip}:${this.config.port}] Socket 已主动释放连接`);
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket.close();
      delete this.socket;
    }
    this.socket = null;
    this.available = false;
  }

  refreshReconnect() {
    this.disconnect();
    this.connect();
  }
}
