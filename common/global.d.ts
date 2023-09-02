export interface IGlobalInstanceConfig {
  nickname: string;
  startCommand: string;
  stopCommand: string;
  cwd: string;
  ie: string;
  oe: string;
  createDatetime: string;
  lastDatetime: string;
  type: string;
  tag: string[];
  endTime: string;
  fileCode: string;
  processType: string;
  updateCommand: string;
  actionCommandList: any[];
  crlf: number;
  terminalOption: {
    haveColor: boolean;
    pty: boolean;
    ptyWindowCol: number;
    ptyWindowRow: number;
  };
  eventTask: {
    autoStart: boolean;
    autoRestart: boolean;
    ignore: boolean;
  };
  docker: {
    containerName?: string;
    image?: string;
    memory?: number;
    ports?: string[];
    extraVolumes?: string[];
    maxSpace?: number;
    network?: number;
    io?: number;
    networkMode?: string;
    networkAliases?: string[];
    cpusetCpus?: string;
  };
  pingConfig: {
    ip?: string;
    port?: number;
    type?: number;
  };
  extraServiceConfig: {
    openFrpTunnelId?: string;
    openFrpToken?: string;
  };
}

export interface IPanelResponseProtocol {
  data: any;
  timestamp: number;
  status: number;
}

export interface IPanelOverviewResponse {
  version: string;
  specifiedDaemonVersion: string;
  process: {
    cpu: number;
    memory: number;
    cwd: string;
  };
  record: {
    logined: number;
    illegalAccess: number;
    banips: number;
    loginFailed: number;
  };
  system: {
    user: os.UserInfo;
    time: number;
    totalmem: number;
    freemem: number;
    type: string;
    version: string;
    node: string;
    hostname: string;
    loadavg: number[];
    platform: string;
    release: string;
    uptime: number;
    cpu: number;
  };
  chart: {
    system: { cpu: number; mem: number }[];
    request: { value: number; totalInstance: number; runningInstance: number }[];
  };
  remoteCount: {
    available: number;
    total: number;
  };
  remote: any[];
}
