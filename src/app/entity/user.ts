// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import { IUser } from "./entity_interface";

export interface IUserApp {
  instanceUuid: string;
  serviceUuid: string;
  instanceInfo?: any;
}

export class User implements IUser {
  uuid: string = "";
  userName: string = "";
  passWord: string = "";
  passWord2: string = "";
  salt: string = "";
  permission: number = 0;
  registerTime: string = "";
  loginTime: string = "";
  instances: Array<IUserApp> = [];
  apiKey: string = "";
  isInit: boolean = false;
}
