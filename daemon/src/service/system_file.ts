import fs from "fs-extra";
import iconv from "iconv-lite";
import { ProcessWrapper } from "mcsmanager-common";
import os from "os";
import path from "path";
import { compress, decompress } from "../common/compress";
import { globalConfiguration } from "../entity/config";
import { $t, i18next } from "../i18n";
import { normalizedJoin } from "../tools/filepath";
// 使用动态导入避免类型冲突
const loadMinimatch = () => require("minimatch");

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

  constructor(
    public topPath: string = "",
    public fileCode?: string,
    public fileManagementRules?: {
      blacklist: string[];
      whitelist: string[];
    }
  ) {
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

  /**
   * 读取并解析 .mcsmignore 文件
   * @returns 忽略规则数组
   */
  private async readMcsmIgnore(): Promise<string[]> {
    try {
      const ignoreFilePath = path.join(this.topPath, ".mcsmignore");
      if (fs.existsSync(ignoreFilePath)) {
        const content = fs.readFileSync(ignoreFilePath, "utf-8");
        return content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== "" && !line.startsWith("#"));
      }
    } catch (error) {
      // 忽略读取错误
    }
    return [];
  }

  /**
   * 读取并解析 .mcsmallow 文件
   * @returns 白名单规则数组
   */
  private async readMcsmAllow(): Promise<string[]> {
    try {
      const allowFilePath = path.join(this.topPath, ".mcsmallow");
      if (fs.existsSync(allowFilePath)) {
        const content = fs.readFileSync(allowFilePath, "utf-8");
        return content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== "" && !line.startsWith("#"));
      }
    } catch (error) {
      // 忽略读取错误
    }
    return [];
  }

  isRootTopRath() {
    return this.topPath === "/" || this.topPath === "\\";
  }

  toAbsolutePath(fileName: string = "") {
    const topAbsolutePath = this.topPath;

    if (path.normalize(fileName).indexOf(topAbsolutePath) === 0) return fileName;

    let finalPath = "";
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

    if (
      finalPath.indexOf(topAbsolutePath) !== 0 &&
      topAbsolutePath !== "/" &&
      topAbsolutePath !== "\\"
    )
      throw new Error(ERROR_MSG_01);
    return finalPath;
  }

  checkPath(fileNameOrPath: string) {
    if (this.isRootTopRath()) return true;
    const destAbsolutePath = this.toAbsolutePath(fileNameOrPath);
    const topAbsolutePath = this.topPath;
    return destAbsolutePath.indexOf(topAbsolutePath) === 0;
  }

  async check(destPath: string) {
    if (this.isRootTopRath()) return true;
    
    // 隐藏配置文件自身
    const fileName = path.basename(destPath);
    if (fileName === '.mcsmignore' || fileName === '.mcsmallow') {
      return false;
    }
    
    const absolutePath = this.toAbsolutePath(destPath);
    const relativePath = path.relative(this.topPath, absolutePath);
    const normalizedPath = relativePath.replace(/\\/g, "/");

    // Check .mcsmallow rules (whitelist)
    const mcsmAllowRules = await this.readMcsmAllow();
    if (mcsmAllowRules.length > 0) {
      const minimatch = loadMinimatch();
      let isAllowed = false;
      // 检查文件是否在白名单中
      for (const rule of mcsmAllowRules) {
        // 处理否定规则 (!)
        const isNegated = rule.startsWith('!');
        const actualRule = isNegated ? rule.substring(1) : rule;
        
        // 检查路径是否匹配规则
        let isMatch = false;
        
        // 如果规则以 / 结尾，表示是目录规则，我们需要处理两种情况：
        // 1. 目录本身 (如 temp/ 匹配 temp)
        // 2. 目录下的文件 (如 temp/ 匹配 temp/file.txt)
        if (actualRule.endsWith('/')) {
          const dirRule = actualRule.slice(0, -1); // 去掉末尾的 /
          // 匹配目录本身或目录下的文件
          isMatch = minimatch(normalizedPath, dirRule, { dot: true }) || 
                    minimatch(normalizedPath, dirRule + '/**', { dot: true });
        } else {
          // 标准规则匹配
          isMatch = minimatch(normalizedPath, actualRule, { dot: true }) || 
                    minimatch(path.basename(normalizedPath), actualRule);
        }
        
        if (isMatch) {
          if (isNegated) {
            // 否定规则匹配，取消允许
            isAllowed = false;
          } else {
            // 普通规则匹配，标记为允许
            isAllowed = true;
          }
        }
      }
      
      // 如果白名单不为空但文件不在白名单中，则拒绝访问
      if (!isAllowed) {
        return false;
      }
    }

    // Check .mcsmignore rules (blacklist)
    const mcsmIgnoreRules = await this.readMcsmIgnore();
    if (mcsmIgnoreRules.length > 0) {
      const minimatch = loadMinimatch();
      let ignored = false;
      // 检查文件是否被 .mcsmignore 规则忽略
      for (const rule of mcsmIgnoreRules) {
        // 处理否定规则 (!)
        const isNegated = rule.startsWith('!');
        const actualRule = isNegated ? rule.substring(1) : rule;
        
        // 检查路径是否匹配规则
        let isMatch = false;
        
        // 如果规则以 / 结尾，表示是目录规则，我们需要处理两种情况：
        // 1. 目录本身 (如 temp/ 匹配 temp)
        // 2. 目录下的文件 (如 temp/ 匹配 temp/file.txt)
        if (actualRule.endsWith('/')) {
          const dirRule = actualRule.slice(0, -1); // 去掉末尾的 /
          // 匹配目录本身或目录下的文件
          isMatch = minimatch(normalizedPath, dirRule, { dot: true }) || 
                    minimatch(normalizedPath, dirRule + '/**', { dot: true });
        } else {
          // 标准规则匹配
          isMatch = minimatch(normalizedPath, actualRule, { dot: true }) || 
                    minimatch(path.basename(normalizedPath), actualRule);
        }
        
        if (isMatch) {
          if (isNegated) {
            // 否定规则匹配，取消忽略
            ignored = false;
          } else {
            // 普通规则匹配，标记为忽略
            ignored = true;
          }
        }
      }
      if (ignored) {
        return false; // 被忽略的文件/目录，返回 false
      }
    }

    return this.checkPath(destPath) && fs.existsSync(this.toAbsolutePath(destPath));
  }

  cd(dirName: string) {
    if (!this.check(dirName)) throw new Error(ERROR_MSG_01);
    this.cwd = normalizedJoin(this.cwd, dirName);
  }

  async list(page: 0, pageSize = 40, searchFileName?: string) {
    if (pageSize > 100 || pageSize <= 0 || page < 0) throw new Error("Beyond the value limit");

    // Use withFileTypes option to get file type directly, reducing stat calls
    const dirents = await fs.readdir(this.toAbsolutePath(), { withFileTypes: true });

    // Filter search results and create basic file info with type
    let filteredItems = dirents
      .filter(
        (dirent) =>
          !searchFileName || dirent.name.toLowerCase().includes(searchFileName.toLowerCase())
      )
      .map((dirent) => ({
        name: dirent.name,
        type: dirent.isFile() ? 1 : 0
      }));

    // 由于需要异步过滤，使用 Promise.all 来处理
    const filteredResults = await Promise.all(
      filteredItems.map(async (item) => {
        // 隐藏配置文件自身
        if (item.name === '.mcsmignore' || item.name === '.mcsmallow') {
          return { item, isValid: false };
        }
        
        // Check if this specific file/directory is allowed based on the file management rules
        const isValid = await this.check(item.name);
        return { item, isValid };
      })
    );

    // 过滤出有效的项目
    const validItems = filteredResults
      .filter(result => result.isValid)
      .map(result => result.item);

    const total = validItems.length;

    // Sort: directories first (type 0), then files (type 1), both alphabetically
    validItems.sort((a, b) => {
      if (a.type !== b.type) return a.type - b.type;
      return a.name.localeCompare(b.name);
    });

    const sliceStart = page * pageSize;
    const sliceEnd = sliceStart + pageSize;
    const targetItems = validItems.slice(sliceStart, sliceEnd);

    const statPromises = targetItems.map(async (item) => {
      try {
        const info = await fs.stat(this.toAbsolutePath(item.name));
        const mode = parseInt(String(parseInt(info.mode?.toString(8), 10)).slice(-3));
        return {
          name: item.name,
          size: info.isFile() ? info.size : 0,
          time: info.atime.toString(),
          mode,
          type: item.type
        };
      } catch (error: any) {
        return {
          name: item.name,
          size: 0,
          time: new Date().toString(),
          mode: 0,
          type: item.type
        };
      }
    });

    // Execute all stat operations concurrently
    const resultList = await Promise.all(statPromises);

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
      if (await this.check(iterator)) {
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
