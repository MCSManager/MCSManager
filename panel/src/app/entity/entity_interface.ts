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
  ssoSub?: string;
  ssoBound?: boolean;
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

const REMOTE_SERVICE_SCHEME = /^(wss?|https?):\/\//i;

function hasExplicitRemoteServiceScheme(ip: string): boolean {
  return REMOTE_SERVICE_SCHEME.test(String(ip ?? "").trim());
}

/**
 * Resolve the WebSocket scheme of a node from that node's own configuration only.
 *
 * An explicit scheme embedded in `ip` always wins (so existing configurations
 * keep working exactly as before), then the explicit `ssl` flag decides.
 * Otherwise the node is plain. The panel's own `systemConfig.ssl` is never
 * consulted: the daemon's TLS is independent of the panel's TLS.
 */
export function resolveRemoteServiceScheme(ip: string, ssl?: boolean): "ws" | "wss" {
  const match = REMOTE_SERVICE_SCHEME.exec(String(ip ?? "").trim());
  if (match) {
    const scheme = match[1].toLowerCase();
    return scheme === "wss" || scheme === "https" ? "wss" : "ws";
  }
  return ssl === true ? "wss" : "ws";
}

/**
 * Strip a leading `ws://`, `wss://`, `http://` or `https://` scheme from a node
 * address, leaving only `host[:port]`.
 */
export function stripRemoteServiceScheme(ip: string): string {
  return String(ip ?? "").trim().replace(REMOTE_SERVICE_SCHEME, "");
}

/**
 * Build the socket.io URL the panel uses to dial a node. Only the node's own
 * `ip`, `port` and `ssl` participate, so the panel's TLS setting can never
 * upgrade or downgrade this connection.
 */
export function buildRemoteServiceSocketUrl(ip: string, port: number, ssl?: boolean): string {
  const scheme = resolveRemoteServiceScheme(ip, ssl);
  return `${scheme}://${stripRemoteServiceScheme(ip)}:${port}`;
}

export interface IRemoteService {
  uuid?: string;
  ip?: string;
  port?: number;
  prefix?: string;
  remarks?: string;
  apiKey?: string;
  ssl?: boolean;
  remoteMappings?: RemoteMappingEntry[];
}

// @Entity
export class RemoteServiceConfig {
  public ip = "";
  public port = 24444;
  public prefix = "";
  public remarks = "";
  public apiKey = "";
  /**
   * Whether this node's own endpoint serves TLS. `undefined` keeps legacy
   * behaviour: the scheme embedded in `ip` decides, otherwise the node is plain.
   *
   * Initialised explicitly so the value survives the storage subsystem's
   * definition-based deserialisation (`Object.keys` of the class instance).
   */
  public ssl: boolean | undefined = undefined;
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
   * IP concatenated with port, as used by browsers to reach the daemon for file
   * and terminal streams.
   *
   * A TLS node gets an explicit `wss://` prefix so browser streams cannot fall
   * back to cleartext. Plain nodes keep the legacy scheme-less form (browsers
   * then follow the panel's own protocol, which reverse-proxy deployments rely
   * on) and an explicit scheme in `ip` always wins unchanged.
   */
  public get addr() {
    if (!hasExplicitRemoteServiceScheme(this.ip) && this.ssl === true) {
      return buildRemoteServiceSocketUrl(this.ip, this.port, true);
    }
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
