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
    cpuUsage: string;
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

export interface IPanelOverviewRemoteResponse {
  version: string;
  process?: {
    cpu: number;
    memory: number;
    cwd: string;
  };
  instance?: {
    running: number;
    total: number;
  };
  system?: {
    type: string;
    hostname: string;
    platform: string;
    release: string;
    uptime: number;
    cwd: string;
    loadavg: number[];
    freemem: number;
    cpuUsage: number;
    memUsage: number;
    totalmem: number;
    processCpu: number;
    processMem: number;
  };
  cpuMemChart?: {
    cpu: number;
    mem: number;
  }[];
  uuid: string;
  ip: string;
  port: number;
  available: boolean;
  remarks: string;
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
    user: any;
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
  remote: IPanelOverviewRemoteResponse[];
}
