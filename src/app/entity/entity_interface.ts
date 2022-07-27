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

// Remote >>> Local
export interface IPacket {
  uuid: string;
  status: number;
  event: string;
  data: any;
}

// Local >>> Remote
export interface IRequestPacket {
  uuid: string;
  data: any;
}

export interface IUser {
  uuid?: string;
  userName?: string;
  passWord?: string;
  salt?: string;
  permission?: number;
  registerTime?: string;
  loginTime?: string;
  instances?: Array<any>;
  isInit?: boolean;
}

export interface ICompleteUser {
  uuid: string;
  userName: string;
  permission: number;
  instances: Array<any>;
  registerTime: string;
  loginTime: string;
}

export interface IRemoteService {
  uuid?: string;
  ip?: string;
  port?: number;
  remarks?: string;
  apiKey?: string;
}

// @Entity
export class RemoteServiceConfig {
  public ip = "";
  public port = 24444;
  public remarks = "";
  public apiKey = "";
  connectOpts: SocketIOClient.ConnectOpts = {
    multiplex: false,
    reconnectionDelayMax: 1000 * 3,
    timeout: 1000 * 3,
    reconnection: true,
    reconnectionAttempts: 20
  };
}
