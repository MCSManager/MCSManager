export interface BaseUserInfo {
  uuid: string;
  userName: string;
  loginTime: string;
  registerTime: string;
  instances: any[];
  permission: number;
  token: string;
  apiKey: string;
  isInit: boolean;
}
