// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import path from "path";
import fs from "fs-extra";
import { IStorage } from "./storage_interface";

interface IClassz {
  name: string;
}

class FileStorageSubsystem implements IStorage {
  public static readonly STIRAGE_DATA_PATH = path.normalize(path.join(process.cwd(), "data"));
  public static readonly STIRAGE_INDEX_PATH = path.normalize(
    path.join(process.cwd(), "data", "index")
  );

  private checkFileName(name: string) {
    const blackList = ["\\", "/", ".."];
    for (const ch of blackList) {
      if (name.includes(ch)) return false;
    }
    return true;
  }

  // Stored in local file based on class definition and identifier
  public async store(category: string, uuid: string, object: any) {
    const dirPath = path.join(FileStorageSubsystem.STIRAGE_DATA_PATH, category);
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    if (!this.checkFileName(uuid))
      throw new Error(`UUID ${uuid} does not conform to specification`);
    const filePath = path.join(dirPath, `${uuid}.json`);
    const data = JSON.stringify(object, null, 4);
    fs.writeFileSync(filePath, data, { encoding: "utf-8" });
  }

  // deep copy of the primitive type with the copy target as the prototype
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

  /**
   * Instantiate an object based on the class definition and identifier
   */
  public async load(category: string, classz: any, uuid: string) {
    const dirPath = path.join(FileStorageSubsystem.STIRAGE_DATA_PATH, category);
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    if (!this.checkFileName(uuid))
      throw new Error(`UUID ${uuid} does not conform to specification`);
    const filePath = path.join(dirPath, `${uuid}.json`);
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, { encoding: "utf-8" });
    const dataObject = JSON.parse(data);
    const target = new classz();
    // for (const v of Object. keys(target)) {
    // if (dataObject[v] !== undefined) target[v] = dataObject[v];
    // }
    // deep object copy
    return this.defineAttr(target, dataObject);
  }

  /**
   * Return all identifiers related to this class through the class definition
   */
  public async list(category: string) {
    const dirPath = path.join(FileStorageSubsystem.STIRAGE_DATA_PATH, category);
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    const files = fs.readdirSync(dirPath);
    const result = new Array<string>();
    files.forEach((name) => {
      result.push(name.replace(path.extname(name), ""));
    });
    return result;
  }

  /**
   * Delete an identifier instance of the specified type through the class definition
   */
  public async delete(category: string, uuid: string) {
    const filePath = path.join(FileStorageSubsystem.STIRAGE_DATA_PATH, category, `${uuid}.json`);
    if (!fs.existsSync(filePath)) return;
    fs.removeSync(filePath);
  }
}

export default new FileStorageSubsystem();
