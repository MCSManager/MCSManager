import fs from "fs-extra";
import path from "path";

export default class StorageSubsystem {
  public static readonly DATA_PATH = path.normalize(path.join(process.cwd(), "data"));
  public static readonly INDEX_PATH = path.normalize(path.join(process.cwd(), "data", "index"));

  // Categories that store secrets (panel-daemon communication key, user API
  // keys, node API keys, password hashes). Their files must never be readable
  // by other local users, so they are written as 0600 and their directories
  // are restricted to 0700.
  private static readonly PRIVATE_CATEGORIES = new Set(["User", "Config"]);
  private static readonly PRIVATE_FILE_MODE = 0o600;
  private static readonly PRIVATE_DIR_MODE = 0o700;

  private checkFileName(name: string) {
    if (!name) return false;
    const blackList = ["\\", "/", ".."];
    for (const ch of blackList) {
      if (name.includes(ch)) return false;
    }
    return true;
  }

  // "User/xxx.json" or "JavaData/zulu" -> first path segment is the category
  private isPrivateTarget(categoryOrName: string): boolean {
    const category = categoryOrName.replace(/\\/g, "/").split("/")[0];
    return StorageSubsystem.PRIVATE_CATEGORIES.has(category);
  }

  // Best-effort chmod: permission failures must not break persistence
  private tryChmod(target: string, mode: number) {
    try {
      fs.chmodSync(target, mode);
    } catch (error) {
      console.error(
        `[StorageSubsystem] Failed to chmod ${target} to ${mode.toString(8)}: ${
          (error as Error).message
        }`
      );
    }
  }

  private ensureCategoryDir(dirPath: string, category: string) {
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    if (this.isPrivateTarget(category)) this.tryChmod(dirPath, StorageSubsystem.PRIVATE_DIR_MODE);
  }

  private writeTmpFile(tmpPath: string, data: string, isPrivate: boolean) {
    if (!isPrivate) {
      fs.writeFileSync(tmpPath, data, { encoding: "utf-8" });
      return;
    }
    // The "mode" option is masked by umask and ignored when the file already
    // exists (e.g. a stale .tmp), so chmod explicitly for a deterministic mode.
    fs.writeFileSync(tmpPath, data, {
      encoding: "utf-8",
      mode: StorageSubsystem.PRIVATE_FILE_MODE
    });
    this.tryChmod(tmpPath, StorageSubsystem.PRIVATE_FILE_MODE);
  }

  public writeFile(name: string, data: string) {
    const targetPath = path.normalize(path.join(StorageSubsystem.DATA_PATH, name));
    const tmpPath = `${targetPath}.tmp`;
    this.writeTmpFile(tmpPath, data, this.isPrivateTarget(name));
    fs.renameSync(tmpPath, targetPath);
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
    this.ensureCategoryDir(dirPath, category);
    if (!this.checkFileName(uuid))
      throw new Error(`UUID ${uuid} does not conform to specification`);
    const filePath = path.join(dirPath, `${uuid}.json`);
    const tmpPath = `${filePath}.tmp`;
    const data = JSON.stringify(object, null, 4);
    this.writeTmpFile(tmpPath, data, this.isPrivateTarget(category));
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
    const dirPath = path.join(StorageSubsystem.DATA_PATH, category);
    this.ensureCategoryDir(dirPath, category);
    if (!this.checkFileName(uuid))
      throw new Error(`UUID ${uuid} does not conform to specification`);
    const filePath = path.join(dirPath, `${uuid}.json`);
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
    const dirPath = path.join(StorageSubsystem.DATA_PATH, category);
    this.ensureCategoryDir(dirPath, category);
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

  /**
   * Restrict permissions of existing secret files/directories.
   * Idempotent; intended to run once at startup so that files written by
   * older versions (world-readable) are fixed without manual intervention.
   * Failures are logged and never block startup.
   */
  public hardenPrivatePermissions() {
    for (const category of StorageSubsystem.PRIVATE_CATEGORIES) {
      const dirPath = path.join(StorageSubsystem.DATA_PATH, category);
      if (!fs.existsSync(dirPath)) continue;
      this.tryChmod(dirPath, StorageSubsystem.PRIVATE_DIR_MODE);
      let entries: string[] = [];
      try {
        entries = fs.readdirSync(dirPath);
      } catch (error) {
        console.error(
          `[StorageSubsystem] Failed to read directory ${dirPath} for permission hardening: ${
            (error as Error).message
          }`
        );
        continue;
      }
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        try {
          if (fs.statSync(entryPath).isFile())
            this.tryChmod(entryPath, StorageSubsystem.PRIVATE_FILE_MODE);
        } catch (error) {
          console.error(
            `[StorageSubsystem] Failed to stat ${entryPath} for permission hardening: ${
              (error as Error).message
            }`
          );
        }
      }
    }
  }
}
