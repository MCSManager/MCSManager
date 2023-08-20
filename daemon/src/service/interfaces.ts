import InstanceConfig from "../entity/instance/Instance_config";
export interface IInstanceDetail {
  instanceUuid: string;
  started: number;
  status: number;
  config: InstanceConfig;
  info?: any;
}

export interface IJson<T> {
  [key: string]: T;
}

// export interface IForwardInstanceIO {
//   sourceSocket: Socket,
//   targetUuid: string
// }
