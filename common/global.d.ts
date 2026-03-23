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
    processType: ProcessType;
    updateCommand: string;
    runAs: string;
    actionCommandList: any[];
    crlf: number;
    category: number;
    basePort: number;

    // Steam RCON
    enableRcon?: boolean;
    rconPassword?: string;
    rconPort?: number;
    rconIp?: string;

    // Java
    java: IInstanceJavaConfig;

    // Old fields
    terminalOption: {
      haveColor: boolean;
      pty: boolean;
      ptyWindowCol: number;
      ptyWindowRow: number;
    };
    eventTask: {
      autoStart: boolean;
      autoRestart: boolean;
      autoRestartMaxTimes: number;
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

  type ProcessType = "general" | "docker";

  interface IInstanceJavaConfig {
    id: string;
  }

  interface IJavaInfo {
    fullname: string;
    path?: string;
    installTime: number;
    downloading: boolean;
  }

  interface IJavaRuntime {
    info: IJavaInfo;
    path: string;
    usingInstances: string[];
  }

  interface IGlobalInstanceDockerConfig {
    /** Docker image for update command; empty = not used */
    updateCommandImage?: string;
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
    memorySwap?: number;
    memorySwappiness?: number;
    labels?: string[];
    capAdd?: string[];
    capDrop?: string[];
    devices?: string[];
    privileged?: boolean;
    /** Upload speed limit in KB/s */
    uploadSpeedLimit?: number;
    /** Download speed limit in KB/s */
    downloadSpeedLimit?: number;
    /** Whether to enable GPU passthrough */
    gpuEnabled?: boolean;
    /** GPU count: -1 = all GPUs, 0 = none, positive integer = specific count */
    gpuCount?: number;
    /** Specific GPU device IDs, e.g. ["0","1"] or ["GPU-xxxx"]. Mutually exclusive with gpuCount */
    gpuDeviceIds?: string[];
    /** GPU driver name, default "nvidia" */
    gpuDriver?: string;
  }

  interface IPanelResponseProtocol {
    data: any;
    timestamp: number;
    status: number;
  }

  interface IPanelOverviewRemoteMappingResponse {
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
    remoteMappings: IPanelOverviewRemoteMappingResponse[];
    available: boolean;
    remarks: string;
    config: {
      language: string;
      uploadSpeedRate: number;
      downloadSpeedRate: number;
      maxDownloadFromUrlFileCount: number;
      portRangeStart: number;
      portRangeEnd: number;
      portAssignInterval: number;
      port: number;
      outputBufferSize: number;
      enableSoftShutdown: boolean;
      softShutdownSkipDocker: boolean;
      softShutdownWaitSeconds: number;
    };
    dockerPlatforms?: string[];
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
      pageTitle: string;
      logoImage: string;
      backgroundImage: string;
      /** Main app navigation: "left" = sidebar, "right" = top header only */
      sidebarPosition?: "left" | "right";
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
    dockerOptional?: {
      image: string;
      updateCommandImage?: string;
    };
    setupInfo: IGlobalInstanceConfig;
    gameType: string;
    image: string;
    platform: string;
    tags?: string[];
    isSummary?: boolean;
    key?: string;
  }

  interface IQuickStartTemplate {
    languages: {
      label: string;
      value: string;
    }[];
    packages: IQuickStartPackages[];
  }

  export interface IBusinessProductInfo {
    productId: number;
    title: string;
    price: number;
    ispId: number;
    daemonId: string;
    payload?: string;
    remark?: string;
    hours?: number;
    daemonUuid?: string;
  }
}

export {};
