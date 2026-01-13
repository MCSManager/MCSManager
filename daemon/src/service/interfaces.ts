import InstanceConfig from "../entity/instance/Instance_config";

export interface IDiskQuotaInfo {
  used: number;      // 已使用 (字节)
  limit: number;     // 限制 (字节)
  available: number; // 可用 (字节)
  percentage: number; // 使用百分比
}

export interface IInstanceDetail {
  instanceUuid: string;
  started: number;
  autoRestarted: number;
  status: number;
  config: InstanceConfig;
  info?: any;
  diskQuota?: IDiskQuotaInfo;
}

export interface IJson<T> {
  [key: string]: T;
}

// export interface IForwardInstanceIO {
//   sourceSocket: Socket,
//   targetUuid: string
// }
