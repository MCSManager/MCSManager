import type { IGlobalInstanceConfig } from "../../../common/global";
import type { LayoutCardHeight } from "@/config/originLayoutConfig";

export interface JsonData {
  [key: string]: any;
}

export interface MapData<T> {
  [key: string]: T;
}

export interface LayoutCardParams {
  field: string;
  label: string;
  type: "string" | "number" | "boolean" | "instanceId";
}

export interface LayoutCard {
  id: string;
  type: string;
  title: string;
  width: number;
  height: LayoutCardHeight;
  meta: JsonData;
  disableAdd?: boolean;
  onlyPath?: string[];
  params?: LayoutCardParams[];
  followId?: string;
  description?: string;
  allowedPages?: Array<string> | null;
  line?: number;
  disableDelete?: boolean;
}

export interface LayoutWithRouter {
  page: string;
  items: LayoutCard[];
}

export enum NEW_CARD_TYPE {
  COMMON = "COMMON",
  INSTANCE = "INSTANCE",
  USER = "USER",
  NODE = "NODE",
  OTHER = "OTHER"
}

export interface InstanceDetail {
  instanceUuid: string;
  started: number;
  status: number;
  info: {
    currentPlayers: number;
    fileLock: number;
    maxPlayers: number;
    openFrpStatus: boolean;
    playersChart: any[];
    version: string;
  };
  config: IGlobalInstanceConfig;
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
  quickInstallAddr: string;
  redisUrl: string;
}

export interface UserInfo {
  uuid: string;
  userName: string;
  registerTime: string;
  permission: number;
  passWordType: number;
  loginTime: string;
  isInit: boolean;
  instances: UserInstance[];
  apiKey: string;
}

export interface UserInstance {
  // endTime: string;
  hostIp: string;
  // ie: string;
  instanceUuid: string;
  // lastDatetime: string;
  nickname: string;
  // oe: string;
  // remarks: string;
  serviceUuid: string;
  status: number;
  // stopCommand: string;
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

export interface NewInstanceForm {
  nickname: string;
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
}

export interface QuickStartTemplate {
  info: string;
  mc: string;
  java: string;
  size: number;
  remark: string;
  author: string;
  targetLink: string;
}
