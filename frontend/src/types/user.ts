export interface UserInstance {
  hostIp: string;
  instanceUuid: string;
  nickname: string;
  daemonId: string;
  status: number;
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
}

export interface EditUserInfo extends BaseUserInfo {
  password?: string;
}

export interface LoginUserInfo extends BaseUserInfo {
  token: string;
}
