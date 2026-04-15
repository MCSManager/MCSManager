export interface AppConfig {
  panelBaseUrl: string;
  apiKey: string;
  confirmationTtlMs: number;
  requestTimeoutMs: number;
  allowedInstanceCommands: string[];
  alertEnabled: boolean;
  alertPushUrl: string | undefined;
  alertPollIntervalMs: number;
}

export interface McsmMonitorTpsSnapshot {
  oneMin: number;
  fiveMin: number;
  fifteenMin: number;
}

export interface McsmMonitorDiskSnapshot {
  mount: string;
  device: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercent: number;
}

export interface McsmMonitorHostSnapshot {
  cpuPercent: number;
  memPercent: number;
  totalmem: number;
  freemem: number;
  hostname: string;
  platform: string;
  loadavg: number[];
  primaryDisk?: McsmMonitorDiskSnapshot;
  disks: McsmMonitorDiskSnapshot[];
}

export interface McsmMonitorProcessSnapshot {
  pid?: number | string;
  cpuPercent?: number;
  memoryBytes?: number;
  memoryPercent?: number;
}

export interface McsmMonitorPluginSnapshot {
  online: boolean;
  lastSeen?: number;
  heartbeatAgeMs?: number;
  pluginVersion?: string;
  serverVersion?: string;
  motd?: string;
  worlds: string[];
  mainThreadBlocked: boolean;
  tps: McsmMonitorTpsSnapshot;
  onlinePlayers: number;
  maxPlayers: number;
}

export interface McsmMonitorServerSnapshot {
  serverId: string;
  instanceId: string;
  instanceName: string;
  daemonTime: number;
  status: number;
  statusText: string;
  processRunning: boolean;
  process: McsmMonitorProcessSnapshot;
  plugin: McsmMonitorPluginSnapshot;
  hostPrimaryDisk?: McsmMonitorDiskSnapshot;
  history: unknown[];
}

export interface McsmMonitorNodeOverview {
  daemonId: string;
  daemonIp: string;
  daemonPort: number;
  daemonPrefix: string;
  daemonRemarks: string;
  available: boolean;
  host?: McsmMonitorHostSnapshot;
  servers: McsmMonitorServerSnapshot[];
}

export interface McsmMonitorServerWithDaemon extends McsmMonitorServerSnapshot {
  daemonId: string;
  daemonRemarks: string;
  daemonIp: string;
  daemonPort: number;
  daemonPrefix: string;
  daemonAvailable: boolean;
}

export interface McsmMonitorOverviewResponse {
  generatedAt: number;
  summary: {
    nodesTotal: number;
    nodesOnline: number;
    serversTotal: number;
    serversRunning: number;
    pluginOnline: number;
  };
  nodes: McsmMonitorNodeOverview[];
  servers: McsmMonitorServerWithDaemon[];
}

export interface McsmRemoteServiceOverview {
  uuid: string;
  ip: string;
  port: number;
  prefix: string;
  available: boolean;
  remarks: string;
  instances: Array<{
    instanceUuid?: string;
    uuid?: string;
    nickname?: string;
    started?: number;
    status?: number;
    [key: string]: unknown;
  }>;
}

export type InstanceAction = "start" | "stop" | "restart";

export interface InstanceQuery {
  instanceName?: string;
  instanceUuid?: string;
}

export interface ConfirmationRecord {
  code: string;
  daemonId: string;
  instanceUuid: string;
  instanceName: string;
  action: InstanceAction;
  createdAt: number;
  expiresAt: number;
}
