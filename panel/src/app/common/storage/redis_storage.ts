import { createClient } from "redis";
import { IStorage } from "./storage_interface";
import Storage from "./sys_storage";
import { logger } from "../../service/log";

class RedisStorageSubsystem implements IStorage {
  private client = createClient();

  private async connect() {
    try {
      await this.client.connect();
    } catch (e) {
      logger.error("Error occurred while trying to dial redis\n" + e);
      logger.warn("Due to an unrecoverable error, daemon will temporarily store data in files.");
      Storage.setStorageType(0);
    }
  }

  /*
  Redis commands
   */
  private async keys(param: string) {
    return await this.client.keys(param);
  }

  private async set(key: string, value: string) {
    await this.client.set(key, value);
  }

  private async get(key: string) {
    return await this.client.get(key);
  }

  private async del(key: string) {
    await this.client.del(key);
  }

  public async initialize(url: string) {
    this.client = createClient({ url: url });
    logger.info("Attempting to connect to redis...");
    await this.connect();
    logger.info("Connected to redis!");
  }

  // Keep behavior same
  private checkFileName(name: string) {
    const blackList = ["\\", "/", ".."];
    for (const ch of blackList) {
      if (name.includes(ch)) return false;
    }
    return true;
  }

  /**
   * Stored in local file based on class definition and identifier
   */
  public async store(category: string, uuid: string, object: any) {
    if (!this.checkFileName(uuid))
      throw new Error(`UUID ${uuid} does not conform to specification`);
    await this.set(category + ":" + uuid, JSON.stringify(object));
  }

  /**
   * Instantiate an object based on the class definition and identifier
   */
  public async load(category: string, classz: any, uuid: string) {
    if (!this.checkFileName(uuid))
      throw new Error(`UUID ${uuid} does not conform to specification`);
    let result = await this.get(category + ":" + uuid);
    if (result == null) {
      return null;
    }
    const dataObject = JSON.parse(result);
    const target = new classz();
    return this.defineAttr(target, dataObject);
  }

  /**
   * Return all identifiers related to this class through the class definition
   */
  public async list(category: string) {
    let result: string[] = [];
    let m = Array<string>();
    result = await this.keys(category + "*");
    if (result != null && result.length != 0) {
      for (let i of result) m.push(i.replace(category + ":", ""));
    }
    return m;
  }

  /**
   * Delete an identifier instance of the specified type through the class definition
   */
  public async delete(category: string, uuid: string) {
    if (!this.checkFileName(uuid))
      throw new Error(`UUID ${uuid} does not conform to specification`);
    await this.del(category + ":" + uuid);
  }

  // deep copy of the primitive type with the copy target as the prototype
  // target copy target object copy source
  protected defineAttr(target: any, object: any): any {
    for (const v of Object.keys(target)) {
      const objectValue = object[v];
      if (objectValue === undefined) continue;
      if (objectValue instanceof Array) {
        target[v] = objectValue;
        continue;
      }
      if (objectValue instanceof Object && typeof objectValue === "object") {
        this.defineAttr(target[v], objectValue);
        continue;
      }
      target[v] = objectValue;
    }
    return target;
  }
}

export default new RedisStorageSubsystem();
