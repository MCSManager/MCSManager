export interface UserInstance {
  instanceUuid: string;
  daemonId: string;
  hostIp: string;
  remarks?: string;
  status: number;
  nickname: string;
  ie?: string;
  oe?: string;
  endTime?: number;
  lastDatetime?: number;
  stopCommand?: string;
  processType?: string;
  docker?: Record<string, any>;
  info?: Record<string, any>;
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
  ssoSub: string;
  ssoBound: boolean;
}

export interface EditUserInfo extends BaseUserInfo {
  passWord?: string;
}

export interface LoginUserInfo extends BaseUserInfo {
  token: string;
}
