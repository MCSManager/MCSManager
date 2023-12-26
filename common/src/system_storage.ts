import path from "path";
import fs from "fs-extra";

export default class StorageSubsystem {
  public static readonly DATA_PATH = path.normalize(path.join(process.cwd(), "data"));
  public static readonly INDEX_PATH = path.normalize(path.join(process.cwd(), "data", "index"));

  private checkFileName(name: string) {
    const blackList = ["\\", "/", ".."];
    for (const ch of blackList) {
      if (name.includes(ch)) return false;
    }
    return true;
  }

  public writeFile(name: string, data: string) {
    const targetPath = path.normalize(path.join(StorageSubsystem.DATA_PATH, name));
    fs.writeFileSync(targetPath, data, { encoding: "utf-8" });
  }

  public readFile(name: string) {
    const targetPath = path.normalize(path.join(StorageSubsystem.DATA_PATH, name));
    return fs.readFileSync(targetPath, { encoding: "utf-8" });
  }

  public readDir(dirName: string) {
    const targetPath = path.normalize(path.join(StorageSubsystem.DATA_PATH, dirName));
    if (!fs.existsSync(targetPath)) return [];
    const files = fs.readdirSync(targetPath).map((v) => path.normalize(path.join(dirName, v)));
    return files;
  }

  public deleteFile(name: string) {
    const targetPath = path.normalize(path.join(StorageSubsystem.DATA_PATH, name));
    fs.removeSync(targetPath);
  }

  public fileExists(name: string) {
    const targetPath = path.normalize(path.join(StorageSubsystem.DATA_PATH, name));
    return fs.existsSync(targetPath);
  }

  // Stored in local file based on class definition and identifier
  public store(category: string, uuid: string, object: any) {
    const dirPath = path.join(StorageSubsystem.DATA_PATH, category);
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
  public load(category: string, classz: any, uuid: string) {
    const dirPath = path.join(StorageSubsystem.DATA_PATH, category);
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
  public list(category: string) {
    const dirPath = path.join(StorageSubsystem.DATA_PATH, category);
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
  public delete(category: string, uuid: string) {
    const filePath = path.join(StorageSubsystem.DATA_PATH, category, `${uuid}.json`);
    if (!fs.existsSync(filePath)) return;
    fs.removeSync(filePath);
  }
}
