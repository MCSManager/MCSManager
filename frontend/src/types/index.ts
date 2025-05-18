/* eslint-disable no-unused-vars */
import type { Dayjs } from "dayjs";
import type { INSTANCE_STATUS_CODE, ScheduleCreateType } from "./const";
import type { SecureVersion } from "tls";

export type JsonData = IJsonData;
export type MapData<T> = IMapData<T>;
export type LayoutCardParams = ILayoutCardParams;
export type LayoutCard = ILayoutCard;

export interface LayoutWithRouter {
  page: string;
  items: LayoutCard[];
}

export enum NEW_CARD_TYPE {
  COMMON = "COMMON",
  INSTANCE = "INSTANCE",
  DATA = "DATA",
  USER = "USER",
  OTHER = "OTHER"
}

export interface InstanceDetail {
  instanceUuid: string;
  started: number;
  status: INSTANCE_STATUS_CODE;
  info: {
    mcPingOnline: boolean;
    currentPlayers: number;
    maxPlayers: number;
    version: string;
    fileLock: number;
    playersChart: Array<{ value: string }>;
    openFrpStatus: boolean;
    latency: number;
  };
  config: IGlobalInstanceConfig;
  watcher?: number;
}

export interface NodeStatus {
  available: boolean;
  ip: string;
  port: number;
  remarks: string;
  uuid: string;
}

export interface Settings {
  httpPort: number;
  httpIp: any;
  https: boolean;
  enforce_https: boolean;
  domain: string;
  httpsPort: number;
  httpsIp: string;
  cert_type: "file_path" | "text";
  cert: string;
  key: string;
  min_tls_version: SecureVersion;
  reverseProxyMode: boolean;
  dataPort: number;
  forwardType: number;
  crossDomain: boolean;
  gzip: boolean;
  maxCompress: number;
  maxDownload: number;
  zipType: number;
  loginCheckIp: boolean;
  loginInfo: string;
  canFileManager: boolean;
  language: string;
  presetPackAddr: string;
  redisUrl: string;
  allowUsePreset: boolean;
  businessMode: boolean;
  businessId: string;
  allowChangeCmd: boolean;
}

export interface ImageInfo {
  Containers: number;
  Created: number;
  Id: string;
  Labels: null;
  ParentId: string;
  RepoDigests: string[];
  RepoTags: string[];
  SharedSize: number;
  Size: number;
  VirtualSize: number;
}

export interface DockerNetworkModes {
  Name: string;
  Id: string;
  Created: string;
  Scope: string;
  Driver: string;
  EnableIPv6: boolean;
  IPAM: {
    Driver: string;
    Options: null;
    Config: [
      {
        Subnet: string;
        Gateway: string;
      }
    ];
  };
  Internal: boolean;
  Attachable: boolean;
  Ingress: boolean;
  ConfigFrom: {
    Network: string;
    [propName: string]: unknown;
  };
  ConfigOnly: boolean;
  Containers: {
    [propName: string]: unknown;
  };
  Options: {
    [propName: string]: unknown;
  };
  Labels: {
    [propName: string]: unknown;
  };
}

export interface ContainerInfo {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  Ports: {
    IP: string;
    PrivatePort: number;
    PublicPort: number;
    Type: string;
  }[];
  Labels: {
    [propName: string]: unknown;
  };
  State: string;
  Status: string;
  HostConfig: {
    NetworkMode: string;
    [propName: string]: unknown;
  };
  NetworkSettings: {
    Networks: {
      bridge: {
        IPAMConfig: null;
        Links: null;
        Aliases: null;
        NetworkID: string;
        EndpointID: string;
        Gateway: string;
        IPAddress: string;
        IPPrefixLen: number;
        IPv6Gateway: string;
        GlobalIPv6Address: string;
        GlobalIPv6PrefixLen: number;
        MacAddress: string;
        DriverOpts: null;
        [propName: string]: unknown;
      };
      [propName: string]: unknown;
    };
  };
  Mounts: [
    {
      Type: string;
      Source: string;
      Destination: string;
      Mode: string;
      RW: true;
      Propagation: string;
    }
  ];
}

export interface NewInstanceForm {
  nickname: string;
  processType: string;
  startCommand: string;
  stopCommand: string;
  cwd: string;
  ie: string;
  oe: string;
  createDatetime: string;
  lastDatetime: string;
  type: string;
  tag: never[];
  maxSpace: null;
  endTime: string;
  docker: IGlobalInstanceDockerConfig;
}

export type QuickStartTemplate = IQuickStartTemplate;
export type QuickStartPackages = IQuickStartPackages;

export interface LabelValueOption {
  label: string;
  value: string;
}

export interface MountComponent {
  destroyComponent(delay?: number): void;
  emitResult(data?: any): void;
}

export interface Schedule {
  instanceUuid: string;
  name: string;
  count: number;
  time: string;
  action: string;
  payload: string;
  type: number;
}

export interface NewScheduleTask {
  name: string;
  count: number;
  time: string;
  action: string;
  type: ScheduleCreateType;
}

export interface ScheduleTaskForm extends NewScheduleTask {
  payload: string;
  weekend: number[];
  cycle: string[];
  objTime: Dayjs;
}

export interface PanelStatus {
  isInstall: boolean;
  language: string;
  versionChange?: boolean;
  settings: {
    canFileManager: boolean;
    allowUsePreset: boolean;
    businessMode: boolean;
    businessId: string;
    allowChangeCmd: boolean;
  };
}
