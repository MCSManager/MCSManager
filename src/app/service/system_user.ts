// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import md5 from "md5";
import { v4 } from "uuid";
import { IUserApp, User, UserPassWordType } from "../entity/user";
import { logger } from "./log";
import { IUser } from "../entity/entity_interface";
import Storage from "../common/storage/sys_storage";
import { QueryWrapper, LocalFileSource } from "../common/query_wrapper";
import { $t } from "../i18n";
import bcrypt from "bcryptjs";

class UserSubsystem {
  public readonly objects: Map<string, User> = new Map();

  async initialize() {
    for (const uuid of (await Storage.getStorage().list("User"))) {
      const user = await Storage.getStorage().load("User", User, uuid) as User;
      this.objects.set(uuid, user);
    }
    logger.info($t("systemUser.userCount", { n: this.objects.size }));
  }

  async create(config: IUser): Promise<User> {
    const newUuid = v4().replace(/-/gim, "");
    // Initialize necessary user data
    const instance = new User();
    instance.uuid = newUuid;
    instance.registerTime = new Date().toLocaleString();
    // add to the user system
    this.setInstance(newUuid, instance);
    await this.edit(instance.uuid, config);
    // Persistently save user information
    await Storage.getStorage().store("User", instance.uuid, instance);
    return instance;
  }

  async edit(uuid: string, config: any) {
    const instance = this.getInstance(uuid);
    if (config.userName) instance.userName = config.userName;
    if (config.isInit != null) instance.isInit = Boolean(config.isInit);
    if (config.permission) instance.permission = config.permission;
    if (config.registerTime) instance.registerTime = config.registerTime;
    if (config.loginTime) instance.loginTime = config.loginTime;
    if (config.passWord) {
      instance.passWordType = UserPassWordType.bcrypt;
      instance.passWord = bcrypt.hashSync(config.passWord, 10);
    }
    if (config.instances) this.setUserInstances(uuid, config.instances);
    if (config.apiKey != null) instance.apiKey = config.apiKey;
    await Storage.getStorage().store("User", uuid, instance);
  }

  validatePassword(password = "") {
    if (password.length < 9 || password.length > 36) return false;
    const reg = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/;
    return reg.test(password);
  }

  checkUser(info: IUser): boolean {
    for (const [uuid, user] of this.objects) {
      if (user.userName === info.userName) {
        if (user.passWordType === UserPassWordType.bcrypt) {
          return bcrypt.compareSync(info.passWord, user.passWord);
        } else {
          return md5(info.passWord) === user.passWord;
        }
      }
    }
    return false;
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
        throw new Error("Type error, The instances of user must be IUserHaveInstance array.");
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

  async deleteInstance(uuid: string) {
    if (this.hasInstance(uuid)) {
      this.objects.delete(uuid);
      await Storage.getStorage().delete("User", uuid);
    }
  }

  getQueryWrapper() {
    return new QueryWrapper(new LocalFileSource<User>(this.objects));
  }
}

export default new UserSubsystem();
