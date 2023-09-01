export interface GlobalInstanceConfig {
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

export interface PanelResponseProtocol {
  data: any;
  timestamp: number;
  status: number;
}
