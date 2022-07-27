/*
  Copyright (C) 2022 https://github.com/mcsmanager team.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.
*/

import md5 from "md5";
import { v4 } from "uuid";
import { IUserApp, User } from "../entity/user";
import { logger } from "./log";
import { IUser } from "../entity/entity_interface";
import StorageSubsystem from "../common/system_storage";
import { QueryWrapper, LocalFileSource } from "../common/query_wrapper";
import { $t } from "../i18n";

class UserSubsystem {
  public readonly objects: Map<string, User> = new Map();

  constructor() {
    StorageSubsystem.list("User").forEach((uuid) => {
      const user = StorageSubsystem.load("User", User, uuid) as User;
      this.objects.set(uuid, user);
    });
    logger.info($t("systemUser.userCount", { n: this.objects.size }));
  }

  create(config: IUser): User {
    const newUuid = v4().replace(/-/gim, "");
    // 初始化必要用户数据
    const instance = new User();
    instance.uuid = newUuid;
    instance.registerTime = new Date().toLocaleString();
    // 加入到用户系统
    this.setInstance(newUuid, instance);
    this.edit(instance.uuid, config);
    // 持久化保存用户信息
    StorageSubsystem.store("User", instance.uuid, instance);
    return instance;
  }

  edit(uuid: string, config: any) {
    const instance = this.getInstance(uuid);
    if (config.userName) instance.userName = config.userName;
    if (config.isInit != null) instance.isInit = Boolean(config.isInit);
    if (config.permission) instance.permission = config.permission;
    if (config.registerTime) instance.registerTime = config.registerTime;
    if (config.loginTime) instance.loginTime = config.loginTime;
    if (config.passWord) instance.passWord = md5(config.passWord);
    if (config.instances) this.setUserInstances(uuid, config.instances);
    if (config.apiKey != null) instance.apiKey = config.apiKey;
    StorageSubsystem.store("User", uuid, instance);
  }

  validatePassword(password = "") {
    if (password.length < 9 || password.length > 36) return false;
    const reg = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/;
    return reg.test(password);
  }

  checkUser(info: IUser): boolean {
    let flag = false;
    const infoPassword = md5(info.passWord);
    this.objects.forEach((user) => {
      if (user.userName === info.userName && user.passWord === infoPassword) return (flag = true);
    });
    return flag;
  }

  existUserName(userName: string): boolean {
    let flag = false;
    this.objects.forEach((user) => {
      if (user.userName === userName) return (flag = true);
    });
    return flag;
  }

  setUserInstances(uuid: string, instanceIds: IUserApp[]) {
    const instance = this.getInstance(uuid);
    instanceIds.forEach((value) => {
      if (!value.serviceUuid || !value.instanceUuid)
        throw new Error("Type error, The instances of user must is IUserHaveInstance array.");
    });
    instance.instances = [];
    instanceIds.forEach((value) => {
      instance.instances.push({
        instanceUuid: String(value.instanceUuid),
        serviceUuid: String(value.serviceUuid)
      });
    });
  }

  getUserByUserName(userName: string): User {
    for (const map of this.objects) {
      const user = map[1];
      if (user.userName === userName) return user;
    }
    return null;
  }

  getInstance(uuid: string) {
    return this.objects.get(uuid);
  }

  setInstance(uuid: string, object: User) {
    this.objects.set(uuid, object);
  }

  hasInstance(uuid: string) {
    return this.objects.has(uuid);
  }

  deleteInstance(uuid: string) {
    if (this.hasInstance(uuid)) {
      this.objects.delete(uuid);
      StorageSubsystem.delete("User", uuid);
    }
  }

  getQueryWrapper() {
    return new QueryWrapper(new LocalFileSource<User>(this.objects));
  }
}

export = new UserSubsystem();
