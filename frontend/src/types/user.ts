import type { IGlobalInstanceConfig } from "../../../common/global.d.ts";

export interface UserInstance {
  hostIp: string;
  instanceUuid: string;
  nickname: string;
  daemonId: string;
  status: number;
  config?: IGlobalInstanceConfig;
}

export interface BaseUserInfo {
  uuid: string;
  userName: string;
  loginTime: string;
  registerTime: string;
  instances: UserInstance[];
  permission: number;
  apiKey: string;
  isInit: boolean;
  secret: string;
  open2FA: boolean;
}

export interface EditUserInfo extends BaseUserInfo {
  passWord?: string;
}

export interface LoginUserInfo extends BaseUserInfo {
  token: string;
}
