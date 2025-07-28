declare global {
  interface IGlobalInstanceConfig {
    nickname: string;
    startCommand: string;
    stopCommand: string;
    cwd: string;
    ie: string;
    oe: string;
    createDatetime: number;
    lastDatetime: number;
    type: string;
    tag: string[];
    endTime: number;
    fileCode: string;
    processType: string;
    updateCommand: string;
    runAs: string;
    actionCommandList: any[];
    crlf: number;
    category: number;

    // Steam RCON
    enableRcon?: boolean;
    rconPassword?: string;
    rconPort?: number;
    rconIp?: string;

    // Old fields
    terminalOption: {
      haveColor: boolean;
      pty: boolean;
    };
    eventTask: {
      autoStart: boolean;
      autoRestart: boolean;
      ignore: boolean;
    };
    docker: IGlobalInstanceDockerConfig;
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

  interface IGlobalInstanceDockerConfig {
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
    cpuUsage?: number;
    workingDir?: string;
    env?: string[];
    changeWorkdir?: boolean;
  }

  interface IPanelResponseProtocol {
    data: any;
    timestamp: number;
    status: number;
  }

  interface IPanelOverviewRemoteResponse {
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
    prefix: string;
    available: boolean;
    remarks: string;
  }

  interface IPanelOverviewResponse {
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

  interface IJsonData {
    [key: string]: any;
  }

  interface IMapData<T> {
    [key: string]: T;
  }

  interface IPageLayoutConfig {
    page: string;
    items: ILayoutCard[];
    theme?: {
      backgroundImage: string;
    };
  }

  interface ILayoutCardParams {
    field: string;
    label: string;
    type: "string" | "number" | "boolean" | "instance";
  }

  interface ILayoutCard {
    id: string;
    type: string;
    title: string;
    width: number;
    height: string;
    meta: IJsonData;
    disableAdd?: boolean;
    onlyPath?: string[];
    params?: ILayoutCardParams[];
    followId?: string;
    description?: string;
    allowedPages?: Array<string> | null;
    line?: number;
    disableDelete?: boolean;
  }

  interface IQuickStartPackages {
    language: string;
    description: string;
    title: string;
    category: string;
    runtime: string;
    size: string;
    hardware: string;
    remark: string;
    targetLink?: string;
    author: string;
    setupInfo?: IJsonData;
    gameType: string;
  }

  interface IQuickStartTemplate {
    name: string;
    languages: {
      label: string;
      value: string;
    }[];
    packages: IQuickStartPackages[];
  }
}

export {};
