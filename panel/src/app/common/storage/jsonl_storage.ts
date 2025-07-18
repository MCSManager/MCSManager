import path from "path";
import fs from "fs-extra";

export class JsonlStorageSubsystem {
  #rootDir: string;
  #maxLines: number;

  constructor(dir: string, maxLines: number = 200) {
    this.#rootDir = path.normalize(process.cwd() + "/data/" + dir);
    this.#maxLines = maxLines;
  }

  private resolveFilePath(logicalPath: string): string {
    if (!this.checkPath(logicalPath)) {
      throw new Error(`Invalid path: ${logicalPath}`);
    }

    const fullPath = path.join(this.#rootDir, logicalPath + ".jsonl");
    const normalizePath = path.normalize(fullPath);
    if (!fs.existsSync(path.dirname(normalizePath))) {
      fs.mkdirsSync(path.dirname(normalizePath));
    }
    return normalizePath;
  }

  private checkPath(name: string) {
    const blackList = ["..", "\\", "//"];
    return !blackList.some((ch) => name.includes(ch));
  }

  public async append(logicalPath: string, entry: object | object[], sync = false) {
    if (!Array.isArray(entry)) entry = [entry];
    const filePath = this.resolveFilePath(logicalPath);
    const lines = (entry as object[]).map((e) => JSON.stringify(e)).join("\n") + "\n";

    if (sync) {
      fs.ensureFileSync(filePath);
      fs.appendFileSync(filePath, lines, "utf-8");
    } else {
      await fs.ensureFile(filePath);
      await fs.appendFile(filePath, lines, "utf-8");
    }

    await this.trimToMaxLines(logicalPath);
  }

  public async readAll(logicalPath: string): Promise<object[]> {
    const filePath = this.resolveFilePath(logicalPath);
    if (!(await fs.pathExists(filePath))) return [];
    const lines = await fs.readFile(filePath, "utf-8");
    return lines
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  public async query(logicalPath: string, predicate: (entry: any) => boolean) {
    const all = await this.readAll(logicalPath);
    return all.filter(predicate);
  }

  public async overwrite(logicalPath: string, entries: object[]) {
    const filePath = this.resolveFilePath(logicalPath);
    await fs.ensureFile(filePath);
    const content = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
    await fs.writeFile(filePath, content, "utf-8");
  }

  public async update(
    logicalPath: string,
    predicate: (entry: any) => boolean,
    updater: (entry: any) => any
  ) {
    const entries = await this.readAll(logicalPath);
    const newEntries = entries.map((e) => (predicate(e) ? updater(e) : e));
    await this.overwrite(logicalPath, newEntries);
  }

  public async delete(logicalPath: string, predicate: (entry: any) => boolean) {
    const entries = await this.readAll(logicalPath);
    const filtered = entries.filter((e) => !predicate(e));
    await this.overwrite(logicalPath, filtered);
  }

  public async clear(logicalPath: string) {
    const filePath = this.resolveFilePath(logicalPath);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  }

  public async tail<T>(logicalPath: string, count: number): Promise<T[]> {
    const entries = await this.query(logicalPath, () => true);
    return entries.slice(-count) as T[];
  }

  private async trimToMaxLines(logicalPath: string) {
    const entries = await this.readAll(logicalPath);
    if (entries.length > this.#maxLines) {
      const trimmedEntries = entries.slice(-this.#maxLines);
      await this.overwrite(logicalPath, trimmedEntries);
    }
  }
}
