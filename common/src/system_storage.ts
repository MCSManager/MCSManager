import fs from "fs-extra";
import path from "path";

export default class StorageSubsystem {
  public static readonly DATA_PATH = path.normalize(path.join(process.cwd(), "data"));
  public static readonly INDEX_PATH = path.normalize(path.join(process.cwd(), "data", "index"));

  private checkFileName(name: string) {
    if (!name) return false;
    const blackList = ["\\", "/", ".."];
    for (const ch of blackList) {
      if (name.includes(ch)) return false;
    }
    return true;
  }

  /**
   * Resolve a storage path (relative to `data/`) and guarantee that it stays
   * inside `data/`. Names may come from remote requests (instance UUIDs,
   * scheduled task names, ...), so a value such as "../../secrets" must never
   * be able to escape the data directory.
   */
  private resolveDataPath(name: string) {
    const raw = String(name ?? "");
    if (!raw.trim()) throw new Error("StorageSubsystem: empty storage path");
    const baseDir = path.resolve(StorageSubsystem.DATA_PATH);
    const targetPath = path.resolve(baseDir, raw);
    if (targetPath !== baseDir && !targetPath.startsWith(baseDir + path.sep)) {
      throw new Error(`StorageSubsystem: path escapes the data directory: ${raw}`);
    }
    return targetPath;
  }

  /**
   * Resolve the directory of a storage category.
   *
   * A category is a relative path below `data/` (usually one level, e.g.
   * "TaskConfig"; nested ones such as "JavaData/<id>" are supported), so it may
   * contain separators — but never a parent-directory segment, an absolute path
   * or a drive letter. This is what keeps a user-influenced identifier from
   * walking out of its own category: a scheduled task name of
   * "../../Config/global" resolves to `data/Config/global.json`, which is still
   * under `data/` but outside `data/TaskConfig/` — exactly the primitive that
   * must be rejected.
   */
  private resolveCategoryDir(category: string) {
    const raw = String(category ?? "").trim();
    if (!raw) throw new Error("StorageSubsystem: empty storage category");
    if (path.isAbsolute(raw) || path.win32.isAbsolute(raw)) {
      throw new Error(`StorageSubsystem: category escapes the data directory: ${raw}`);
    }
    const segments = raw.replace(/\\/g, "/").split("/");
    if (segments.some((s) => !s || s === "." || s === "..")) {
      throw new Error(`StorageSubsystem: category escapes the data directory: ${raw}`);
    }
    const baseDir = path.resolve(StorageSubsystem.DATA_PATH);
    const dirPath = path.resolve(baseDir, raw);
    if (dirPath === baseDir || !dirPath.startsWith(baseDir + path.sep)) {
      throw new Error(`StorageSubsystem: category escapes the data directory: ${raw}`);
    }
    return dirPath;
  }

  private resolveCategoryFile(category: string, uuid: string) {
    if (!this.checkFileName(uuid))
      throw new Error(`UUID ${uuid} does not conform to specification`);
    return path.join(this.resolveCategoryDir(category), `${uuid}.json`);
  }

  public writeFile(name: string, data: string) {
    const targetPath = this.resolveDataPath(name);
    const tmpPath = `${targetPath}.tmp`;
    fs.writeFileSync(tmpPath, data, { encoding: "utf-8" });
    fs.renameSync(tmpPath, targetPath);
  }

  public readFile(name: string) {
    const targetPath = this.resolveDataPath(name);
    return fs.readFileSync(targetPath, { encoding: "utf-8" });
  }

  public readDir(dirName: string) {
    const targetPath = this.resolveDataPath(dirName);
    if (!fs.existsSync(targetPath)) return [];
    const files = fs.readdirSync(targetPath).map((v) => path.normalize(path.join(dirName, v)));
    return files;
  }

  public deleteFile(name: string) {
    const targetPath = this.resolveDataPath(name);
    fs.removeSync(targetPath);
  }

  public fileExists(name: string) {
    let targetPath: string;
    try {
      targetPath = this.resolveDataPath(name);
    } catch {
      return false;
    }
    return fs.existsSync(targetPath);
  }

  // Stored in local file based on class definition and identifier
  public store(category: string, uuid: string, object: any) {
    const dirPath = this.resolveCategoryDir(category);
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    const filePath = this.resolveCategoryFile(category, uuid);
    const tmpPath = `${filePath}.tmp`;
    const data = JSON.stringify(object, null, 4);
    fs.writeFileSync(tmpPath, data, { encoding: "utf-8" });
    fs.renameSync(tmpPath, filePath);
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
    const dirPath = this.resolveCategoryDir(category);
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    const filePath = this.resolveCategoryFile(category, uuid);
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, { encoding: "utf-8" });
    let dataObject: any;
    try {
      dataObject = JSON.parse(data);
    } catch (error) {
      console.error(
        `[StorageSubsystem] Failed to parse ${filePath}, the file is likely corrupted. ` +
          `Treating it as missing. Error: ${(error as Error).message}`
      );
      return null;
    }
    const target = new classz();
    // deep object copy
    return this.defineAttr(target, dataObject);
  }

  /**
   * Return all identifiers related to this class through the class definition
   */
  public list(category: string) {
    const dirPath = this.resolveCategoryDir(category);
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    return fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name.slice(0, -".json".length));
  }

  /**
   * Delete an identifier instance of the specified type through the class definition
   */
  public delete(category: string, uuid: string) {
    const filePath = this.resolveCategoryFile(category, uuid);
    if (!fs.existsSync(filePath)) return;
    fs.removeSync(filePath);
  }
}
