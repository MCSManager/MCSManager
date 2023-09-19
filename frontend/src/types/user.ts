import type { UserInstance } from "@/types/index";

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
