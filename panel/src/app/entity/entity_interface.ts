import { removeTrail } from "mcsmanager-common";
import { ManagerOptions, SocketOptions } from "socket.io-client";

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

type RemoteMappingEntry = {
  from: {
    ip: string;
    port: number;
    prefix: string;
  };
  to: {
    ip: string;
    port: number;
    prefix: string;
  };
};

export interface IRemoteService {
  uuid?: string;
  ip?: string;
  port?: number;
  prefix?: string;
  remarks?: string;
  apiKey?: string;
  remoteMappings?: RemoteMappingEntry[];
}

// @Entity
export class RemoteServiceConfig {
  public ip = "";
  public port = 24444;
  public prefix = "";
  public remarks = "";
  public apiKey = "";
  public remoteMappings: RemoteMappingEntry[] = [];

  connectOpts: Partial<SocketOptions & ManagerOptions> = {
    multiplex: false,
    reconnectionDelayMax: 1000 * 5,
    timeout: 1000 * 10,
    reconnection: true,
    reconnectionAttempts: 10,
    rejectUnauthorized: false
  };

  /**
   * To keep the remote mapping inside response consistent with other parts,
   * a simple conversion needs to be made.
   *
   * This is intentionally a method instead of a getter member, as the
   * conversion involves list operation.
   *
   * @returns converted remote mappings
   */
  public getConvertedRemoteMappings() {
    return this.remoteMappings.map((remote) => ({
      from: {
        addr: `${remote.from.ip}:${remote.from.port}`,
        prefix: remote.from.prefix
      },
      to: {
        addr: `${remote.to.ip}:${remote.to.port}`,
        prefix: remote.to.prefix
      }
    }));
  }

  /**
   * IP concatenated with port.
   */
  public get addr() {
    return `${this.ip}:${this.port}`;
  }

  /**
   * The prefix trimmed and removed trailing slash.
   */
  public get canonicalPrefix() {
    return removeTrail(this.prefix.trim(), "/");
  }

  /**
   * Full address containing IP, port and prefix.
   */
  public get fullAddr() {
    return this.addr + this.canonicalPrefix;
  }
}
