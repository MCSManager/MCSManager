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

import path from "path";
import fs from "fs-extra";

interface IClassz {
  name: string;
}

class StorageSubsystem {
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

  /**
   * 根据类定义和标识符储存成本地文件
   */
  public store(category: string, uuid: string, object: any) {
    const dirPath = path.join(StorageSubsystem.STIRAGE_DATA_PATH, category);
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    if (!this.checkFileName(uuid)) throw new Error(`UUID ${uuid} 不符合规范`);
    const filePath = path.join(dirPath, `${uuid}.json`);
    const data = JSON.stringify(object, null, 4);
    fs.writeFileSync(filePath, data, { encoding: "utf-8" });
  }

  // 以复制目标方为原型的基本类型的深复制
  // target 复制目标 object 复制源
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
   * 根据类定义和标识符实例化成对象
   */
  public load(category: string, classz: any, uuid: string) {
    const dirPath = path.join(StorageSubsystem.STIRAGE_DATA_PATH, category);
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    if (!this.checkFileName(uuid)) throw new Error(`UUID ${uuid} 不符合规范`);
    const filePath = path.join(dirPath, `${uuid}.json`);
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, { encoding: "utf-8" });
    const dataObject = JSON.parse(data);
    const target = new classz();
    // for (const v of Object.keys(target)) {
    //   if (dataObject[v] !== undefined) target[v] = dataObject[v];
    // }
    // 深层对象复制
    return this.defineAttr(target, dataObject);
  }

  /**
   * 通过类定义返回所有与此类有关的标识符
   */
  public list(category: string) {
    const dirPath = path.join(StorageSubsystem.STIRAGE_DATA_PATH, category);
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    const files = fs.readdirSync(dirPath);
    const result = new Array<string>();
    files.forEach((name) => {
      result.push(name.replace(path.extname(name), ""));
    });
    return result;
  }

  /**
   * 通过类定义删除指定类型的标识符实例
   */
  public delete(category: string, uuid: string) {
    const filePath = path.join(StorageSubsystem.STIRAGE_DATA_PATH, category, `${uuid}.json`);
    if (!fs.existsSync(filePath)) return;
    fs.removeSync(filePath);
  }
}

export default new StorageSubsystem();
