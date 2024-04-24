import { $t, i18next } from "../i18n";
import path from "path";
import fs from "fs-extra";
import { compress, decompress } from "../common/compress";
import iconv from "iconv-lite";
import { globalConfiguration } from "../entity/config";
import { ProcessWrapper } from "common";
import os from "os";

const ERROR_MSG_01 = $t("TXT_CODE_system_file.illegalAccess");
const MAX_EDIT_SIZE = 1024 * 1024 * 5;

interface IFile {
  name: string;
  size: number;
  time: string;
  type: number;
  mode: number;
}

export default class FileManager {
  public cwd: string = ".";

  constructor(public topPath: string = "", public fileCode?: string) {
    if (!path.isAbsolute(topPath)) {
      this.topPath = path.normalize(path.join(process.cwd(), topPath));
    } else {
      this.topPath = path.normalize(topPath);
    }
    if (!fileCode) {
      this.fileCode = "utf-8";
      if (i18next.language == "zh_cn") this.fileCode = "gbk";
    }
  }

  isRootTopRath() {
    return this.topPath === "/" || this.topPath === "\\";
  }

  toAbsolutePath(fileName: string = "") {
    const topAbsolutePath = this.topPath;
    let finalPath: string = "";
    if (os.platform() === "win32") {
      const reg = new RegExp("^[A-Za-z]{1}:[\\\\/]{1}");
      if (reg.test(this.cwd)) {
        finalPath = path.normalize(path.join(this.cwd, fileName));
      } else if (reg.test(fileName)) {
        finalPath = path.normalize(fileName);
      }
    }
    if (!finalPath) {
      finalPath = path.normalize(path.join(this.topPath, this.cwd, fileName));
    }
    if (finalPath.indexOf(topAbsolutePath) !== 0) throw new Error(ERROR_MSG_01);
    return finalPath;
  }

  checkPath(fileNameOrPath: string) {
    if (this.isRootTopRath()) return true;
    const destAbsolutePath = this.toAbsolutePath(fileNameOrPath);
    const topAbsolutePath = this.topPath;
    return destAbsolutePath.indexOf(topAbsolutePath) === 0;
  }

  check(destPath: string) {
    if (this.isRootTopRath()) return true;
    return this.checkPath(destPath) && fs.existsSync(this.toAbsolutePath(destPath));
  }

  cd(dirName: string) {
    if (!this.check(dirName)) throw new Error(ERROR_MSG_01);
    this.cwd = path.normalize(path.join(this.cwd, dirName));
  }

  list(page: 0, pageSize = 40, searchFileName?: string) {
    if (pageSize > 100 || pageSize <= 0 || page < 0) throw new Error("Beyond the value limit");
    let fileNames = fs.readdirSync(this.toAbsolutePath());
    if (searchFileName)
      fileNames = fileNames.filter((name) =>
        name.toLowerCase().includes(searchFileName.toLowerCase())
      );

    const total = fileNames.length;
    const sliceStart = page * pageSize;
    const sliceEnd = sliceStart + pageSize;
    const files: IFile[] = [];
    const dirs: IFile[] = [];
    fileNames.forEach((name) => {
      try {
        const info = fs.statSync(this.toAbsolutePath(name));
        const mode = parseInt(String(parseInt(info.mode?.toString(8), 10)).slice(-3));
        const commonInfo = {
          name: name,
          size: info.size,
          time: info.atime.toString(),
          mode,
          type: info.isFile() ? 1 : 0
        };
        if (info.isFile()) {
          files.push(commonInfo);
        } else {
          dirs.push(commonInfo);
        }
      } catch (error: any) {
        // Ignore a file information retrieval error to prevent an overall error
      }
    });
    files.sort((a, b) => (a.name > b.name ? 1 : -1));
    dirs.sort((a, b) => (a.name > b.name ? 1 : -1));
    let resultList = dirs.concat(files);
    resultList = resultList.slice(sliceStart, sliceEnd);
    return {
      items: resultList,
      page,
      pageSize,
      total,
      absolutePath: this.toAbsolutePath()
    };
  }

  async chmod(fileName: string, chmodValue: number, deep: boolean) {
    if (!this.check(fileName) || isNaN(parseInt(chmodValue as any))) throw new Error(ERROR_MSG_01);
    const absPath = this.toAbsolutePath(fileName);
    const defaultPath = "/bin/chmod";
    let file = "chmod";
    if (fs.existsSync(defaultPath)) file = defaultPath;
    const params: string[] = [];
    if (deep) params.push("-R");
    params.push(String(chmodValue));
    params.push(absPath);
    return await new ProcessWrapper(file, params, ".", 60 * 10).start();
  }

  async readFile(fileName: string) {
    if (!this.check(fileName)) throw new Error(ERROR_MSG_01);
    const absPath = this.toAbsolutePath(fileName);
    const buf = await fs.readFile(absPath);
    const text = iconv.decode(buf, this.fileCode || "utf-8");
    return text;
  }

  async writeFile(fileName: string, data: string) {
    if (!this.check(fileName)) throw new Error(ERROR_MSG_01);
    const absPath = this.toAbsolutePath(fileName);
    const buf = iconv.encode(data, this.fileCode || "utf-8");
    return await fs.writeFile(absPath, buf);
  }

  async newFile(fileName: string) {
    // if (!FileManager.checkFileName(fileName)) throw new Error(ERROR_MSG_01);
    if (!this.checkPath(fileName)) throw new Error(ERROR_MSG_01);
    const target = this.toAbsolutePath(fileName);
    fs.createFile(target);
  }

  async copy(target1: string, target2: string) {
    if (!this.checkPath(target2) || !this.check(target1)) throw new Error(ERROR_MSG_01);
    const targetPath = this.toAbsolutePath(target1);
    target2 = this.toAbsolutePath(target2);
    return await fs.copy(targetPath, target2);
  }

  mkdir(target: string) {
    if (!this.checkPath(target)) throw new Error(ERROR_MSG_01);
    const targetPath = this.toAbsolutePath(target);
    return fs.mkdirSync(targetPath);
  }

  async delete(target: string): Promise<boolean> {
    if (!this.check(target)) throw new Error(ERROR_MSG_01);
    const targetPath = this.toAbsolutePath(target);
    return new Promise((r, j) => {
      fs.remove(targetPath, (err) => {
        if (!err) r(true);
        else j(err);
      });
    });
  }

  async move(target: string, destPath: string) {
    if (!this.check(target)) throw new Error(ERROR_MSG_01);
    if (!this.checkPath(destPath)) throw new Error(ERROR_MSG_01);
    const targetPath = this.toAbsolutePath(target);
    destPath = this.toAbsolutePath(destPath);
    await fs.move(targetPath, destPath);
  }

  private zipFileCheck(path: string) {
    const fileInfo = fs.statSync(path);
    const MAX_ZIP_GB = globalConfiguration.config.maxZipFileSize;
    if (fileInfo.size > 1024 * 1024 * 1024 * MAX_ZIP_GB)
      throw new Error($t("TXT_CODE_system_file.unzipLimit", { max: MAX_ZIP_GB }));
  }

  async unzip(sourceZip: string, destDir: string, code?: string) {
    if (!code) code = this.fileCode;
    if (!this.check(sourceZip) || !this.checkPath(destDir)) throw new Error(ERROR_MSG_01);
    this.zipFileCheck(this.toAbsolutePath(sourceZip));
    return await decompress(this.toAbsolutePath(sourceZip), this.toAbsolutePath(destDir), code);
  }

  async zip(sourceZip: string, files: string[], code?: string) {
    if (!code) code = this.fileCode;
    if (!this.checkPath(sourceZip)) throw new Error(ERROR_MSG_01);
    const MAX_ZIP_GB = globalConfiguration.config.maxZipFileSize;
    const MAX_TOTAL_FIELS_SIZE = 1024 * 1024 * 1024 * MAX_ZIP_GB;
    const sourceZipPath = this.toAbsolutePath(sourceZip);
    const filesPath = [];
    let totalSize = 0;
    for (const iterator of files) {
      if (this.check(iterator)) {
        filesPath.push(this.toAbsolutePath(iterator));
        try {
          totalSize += fs.statSync(this.toAbsolutePath(iterator))?.size;
        } catch (error: any) {}
      }
    }
    if (totalSize > MAX_TOTAL_FIELS_SIZE)
      throw new Error($t("TXT_CODE_system_file.unzipLimit", { max: MAX_ZIP_GB }));
    return await compress(sourceZipPath, filesPath, code);
  }

  async edit(target: string, data?: string) {
    if (!this.check(target)) throw new Error(ERROR_MSG_01);
    if (data || typeof data === "string") {
      return await this.writeFile(target, data);
    } else {
      const absPath = this.toAbsolutePath(target);
      const info = fs.statSync(absPath);
      if (info.size > MAX_EDIT_SIZE) {
        throw new Error($t("TXT_CODE_system_file.execLimit"));
      }
      return await this.readFile(target);
    }
  }

  rename(target: string, newName: string) {
    if (!this.check(target)) throw new Error(ERROR_MSG_01);
    if (!this.checkPath(newName)) throw new Error(ERROR_MSG_01);
    const targetPath = this.toAbsolutePath(target);
    const newPath = this.toAbsolutePath(newName);
    fs.renameSync(targetPath, newPath);
  }

  public static checkFileName(fileName?: string): boolean {
    if (!fileName) return false;
    const blackKeys = ["/", "\\", "|", "?", "*", ">", "<", ";", '"'];
    for (const ch of blackKeys) {
      if (fileName.includes(ch)) return false;
    }
    return true;
  }
}
