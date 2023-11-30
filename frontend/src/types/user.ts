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
  token: string;
  apiKey: string;
  isInit: boolean;
}
