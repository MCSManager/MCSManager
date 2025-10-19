import bcrypt from "bcryptjs";
import { t } from "i18next";
import { LocalFileSource, QueryWrapper } from "mcsmanager-common";
import md5 from "md5";
import { authenticator } from "otplib";
import { v4 } from "uuid";
import Storage from "../common/storage/sys_storage";
import { IUser } from "../entity/entity_interface";
import { IUserApp, User, UserPassWordType } from "../entity/user";
import { $t } from "../i18n";
import { logger } from "./log";

export class TwoFactorError extends Error {}

class UserSubsystem {
  public readonly objects: Map<string, User> = new Map();

  async initialize() {
    for (const uuid of await Storage.getStorage().list("User")) {
      const user = (await Storage.getStorage().load("User", User, uuid)) as User;
      this.objects.set(uuid, user);
    }
    logger.info($t("TXT_CODE_systemUser.userCount", { n: this.objects.size }));
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

  // Update user detail
  async edit(uuid: string, config: any) {
    const instance = this.getInstance(uuid);
    if (!instance) return;
    if (config.userName) instance.userName = config.userName;
    if (config.isInit != null) instance.isInit = Boolean(config.isInit);
    if (config.permission) instance.permission = config.permission;
    if (config.registerTime) instance.registerTime = config.registerTime;
    if (config.loginTime) instance.loginTime = config.loginTime;
    if (config.apiKey != null) instance.apiKey = config.apiKey;
    if (config.secret != null) instance.secret = String(config.secret);
    if (config.open2FA != null) instance.open2FA = Boolean(config.open2FA);
    if (config.instances) this.setUserInstances(uuid, config.instances);
    if (config.passWord) {
      instance.passWordType = UserPassWordType.bcrypt;
      instance.passWord = bcrypt.hashSync(config.passWord, 10);
    }
    await Storage.getStorage().store("User", uuid, instance);
  }

  validatePassword(password = "") {
    if (password.length < 6) return false;
    return true;
  }

  check2FA(code: string, user: IUser, totpDriftToleranceSteps: number = 0) {
    if (!user.secret)
      throw new Error("Please contact the administrator to reset the account password");
    authenticator.options = { window: totpDriftToleranceSteps };
    const delta = authenticator.checkDelta(code, user?.secret);
    return delta != null;
  }

  checkUser(info: IUser, code2FA?: string, totpDriftToleranceSteps: number = 0) {
    const inputPassword = info.passWord || "";
    for (const [uuid, user] of this.objects) {
      if (user.userName === info.userName) {
        if (
          user.open2FA &&
          user.secret &&
          !this.check2FA(code2FA || "", user, totpDriftToleranceSteps)
        )
          throw new TwoFactorError(t("TXT_CODE_3d68e43b"));
        if (user.passWordType === UserPassWordType.bcrypt) {
          if (!bcrypt.compareSync(inputPassword, user.passWord))
            throw new Error($t("TXT_CODE_fefbb457"));
        } else {
          if (!(md5(inputPassword) === user.passWord)) throw new Error($t("TXT_CODE_fefbb457"));
        }
      }
    }
  }

  existUserName(userName: string): boolean {
    let flag = false;
    this.objects.forEach((user) => {
      if (user.userName === userName) return (flag = true);
    });
    return flag;
  }

  setUserInstances(uuid: string, instanceIds: IUserApp[]) {
    const user = this.getInstance(uuid);
    if (!user) return;
    instanceIds.forEach((value) => {
      if (!value.daemonId || !value.instanceUuid)
        throw new Error("Type error, The instances of user must be IUserHaveInstance array.");
    });
    user.instances = [];
    instanceIds.forEach((value) => {
      user.instances.push({
        instanceUuid: String(value.instanceUuid),
        daemonId: String(value.daemonId)
      });
    });
  }
  deleteUserInstances(uuid: string | null, instanceIds: IUserApp[], allUsers = false) {
    if (uuid && allUsers) {
      throw new Error("Type error, The uuid and allUsers cannot be true at the same time.");
    }
    const users = allUsers ? Array.from(this.objects.values()) : [this.getInstance(uuid!)];
    if (!users || users.length === 0) return;
    instanceIds.forEach((value) => {
      if (!value.daemonId || !value.instanceUuid)
        throw new Error("Type error, The instances of user must be IUserHaveInstance array.");
    });
    users.forEach((user) => {
      if (!user) return;
      user.instances = user.instances.filter((value) => {
        for (const instance of instanceIds) {
          if (instance.daemonId === value.daemonId && instance.instanceUuid === value.instanceUuid)
            return false;
        }
        return true;
      });
    });
  }

  getUserByUserName(userName: string) {
    for (const map of this.objects) {
      const user = map[1];
      if (user.userName === userName) return user;
    }
    return null;
  }

  getUserByUuid(uuid: string) {
    return this.objects.get(uuid) || null;
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
