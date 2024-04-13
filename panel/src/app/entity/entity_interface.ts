import { SocketOptions, ManagerOptions } from "socket.io-client";
export interface IPacket {
  uuid: string;
  status: number;
  event: string;
  data: any;
}

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
  passWordType?: number;
  secret?: string;
  open2FA?: boolean;
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
  prefix?: string;
  remarks?: string;
  apiKey?: string;
}

// @Entity
export class RemoteServiceConfig {
  public ip = "";
  public port = 24444;
  public prefix = "";
  public remarks = "";
  public apiKey = "";
  connectOpts: Partial<SocketOptions & ManagerOptions> = {
    multiplex: false,
    reconnectionDelayMax: 1000 * 3,
    timeout: 1000 * 3,
    reconnection: true,
    reconnectionAttempts: 20,
    rejectUnauthorized: false
  };
}
