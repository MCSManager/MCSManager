import fs from "fs-extra";
import iconv from "iconv-lite";
import { ProcessWrapper } from "mcsmanager-common";
import os from "os";
import path from "path";
import { compress, decompress } from "../common/compress";
import { globalConfiguration } from "../entity/config";
import { $t, i18next } from "../i18n";
import { normalizedJoin } from "../tools/filepath";
import { DiskQuotaService } from "./disk_quota_service";

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

  check(destPath: string) {
    if (this.isRootTopRath()) return true;
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

    const total = filteredItems.length;

    // Sort: directories first (type 0), then files (type 1), both alphabetically
    filteredItems.sort((a, b) => {
      if (a.type !== b.type) return a.type - b.type;
      return a.name.localeCompare(b.name);
    });

    const sliceStart = page * pageSize;
    const sliceEnd = sliceStart + pageSize;
    const targetItems = filteredItems.slice(sliceStart, sliceEnd);

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
    
    // Check disk quota before writing (if this file is part of an instance)
    const quotaService = DiskQuotaService.getInstance();
    // Extract instance UUID from path if it's an instance directory
    // Path format is typically like /path/to/daemon/data/InstanceData/{instance_uuid}/...
    const pathSegments = absPath.split('/');
    const instanceDataIndex = pathSegments.indexOf('InstanceData');
    if (instanceDataIndex !== -1 && pathSegments.length > instanceDataIndex + 1) {
      const instanceUuid = pathSegments[instanceDataIndex + 1];
      // Check if this instance has a quota set
      const quota = quotaService["quotaMap"].get(instanceUuid);
      if (quota && quota > 0) {
        // Get current disk usage for the instance directory
        const instanceDir = path.join('/', ...pathSegments.slice(0, instanceDataIndex + 2)); // Include InstanceData and UUID
        const currentUsage = await quotaService.getDiskUsage(instanceDir);
        const dataSize = Buffer.byteLength(data, 'utf8');
        if (currentUsage + dataSize > quota) {
          throw new Error($t("TXT_CODE_disk_quota_exceeded_write"));
        }
      }
    }
    
    const buf = iconv.encode(data, this.fileCode || "utf-8");
    return await fs.writeFile(absPath, buf);
  }

  async newFile(fileName: string) {
    // if (!FileManager.checkFileName(fileName)) throw new Error(ERROR_MSG_01);
    if (!this.checkPath(fileName)) throw new Error(ERROR_MSG_01);
    const target = this.toAbsolutePath(fileName);
    
    // Check disk quota before creating file (if this file is part of an instance)
    const quotaService = DiskQuotaService.getInstance();
    // Extract instance UUID from path if it's an instance directory
    // Path format is typically like /path/to/daemon/data/InstanceData/{instance_uuid}/...
    const pathSegments = target.split('/');
    const instanceDataIndex = pathSegments.indexOf('InstanceData');
    if (instanceDataIndex !== -1 && pathSegments.length > instanceDataIndex + 1) {
      const instanceUuid = pathSegments[instanceDataIndex + 1];
      // Check if this instance has a quota set
      const quota = quotaService["quotaMap"].get(instanceUuid);
      if (quota && quota > 0) {
        // Get current disk usage for the instance directory
        const instanceDir = path.join('/', ...pathSegments.slice(0, instanceDataIndex + 2)); // Include InstanceData and UUID
        const currentUsage = await quotaService.getDiskUsage(instanceDir);
        // Assume minimal file size for new file
        const minFileSize = 1; 
        if (currentUsage + minFileSize > quota) {
          throw new Error($t("TXT_CODE_disk_quota_exceeded_write"));
        }
      }
    }
    
    await fs.createFile(target);
  }

  async copy(target1: string, target2: string) {
    if (!this.checkPath(target2) || !this.check(target1)) throw new Error(ERROR_MSG_01);
    const targetPath = this.toAbsolutePath(target1);
    target2 = this.toAbsolutePath(target2);
    
    // Check disk quota before copying (if the target is part of an instance)
    const quotaService = DiskQuotaService.getInstance();
    // Extract instance UUID from path if it's an instance directory
    // Path format is typically like /path/to/daemon/data/InstanceData/{instance_uuid}/...
    const pathSegments = target2.split('/');
    const instanceDataIndex = pathSegments.indexOf('InstanceData');
    if (instanceDataIndex !== -1 && pathSegments.length > instanceDataIndex + 1) {
      const instanceUuid = pathSegments[instanceDataIndex + 1];
      // Check if this instance has a quota set
      const quota = quotaService["quotaMap"].get(instanceUuid);
      if (quota && quota > 0) {
        // Get current disk usage for the instance directory
        const instanceDir = path.join('/', ...pathSegments.slice(0, instanceDataIndex + 2)); // Include InstanceData and UUID
        const currentUsage = await quotaService.getDiskUsage(instanceDir);
        // Get size of source file/directory
        const sourceStats = await fs.stat(targetPath);
        let sourceSize = 0;
        if (sourceStats.isDirectory()) {
          sourceSize = await this.getDirectorySize(targetPath);
        } else {
          sourceSize = sourceStats.size;
        }
        
        if (currentUsage + sourceSize > quota) {
          throw new Error($t("TXT_CODE_disk_quota_exceeded_write"));
        }
      }
    }
    
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
    
    // Check disk quota before moving (if the destination is part of an instance)
    // This is only relevant if the move is within the same filesystem (which will create a new file)
    const quotaService = DiskQuotaService.getInstance();
    // Extract instance UUID from path if it's an instance directory
    // Path format is typically like /path/to/daemon/data/InstanceData/{instance_uuid}/...
    const pathSegments = destPath.split('/');
    const instanceDataIndex = pathSegments.indexOf('InstanceData');
    if (instanceDataIndex !== -1 && pathSegments.length > instanceDataIndex + 1) {
      const instanceUuid = pathSegments[instanceDataIndex + 1];
      // Check if this instance has a quota set
      const quota = quotaService["quotaMap"].get(instanceUuid);
      if (quota && quota > 0) {
        // Get current disk usage for the instance directory
        const instanceDir = path.join('/', ...pathSegments.slice(0, instanceDataIndex + 2)); // Include InstanceData and UUID
        const currentUsage = await quotaService.getDiskUsage(instanceDir);
        
        try {
          // Get size of source file/directory
          const sourceStats = await fs.stat(targetPath);
          let sourceSize = 0;
          if (sourceStats.isDirectory()) {
            sourceSize = await this.getDirectorySize(targetPath);
          } else {
            sourceSize = sourceStats.size;
          }
          
          if (currentUsage + sourceSize > quota) {
            throw new Error($t("TXT_CODE_disk_quota_exceeded_write"));
          }
        } catch (error) {
          // If we can't stat the source, just proceed - error will be handled by fs.move
          if (error instanceof Error) {
            console.warn(`Could not get source size for quota check: ${error.message}`);
          } else {
            console.warn(`Could not get source size for quota check: ${String(error)}`);
          }
        }
      }
    }
    
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
    
    // Check disk quota before creating zip file (if the destination is part of an instance)
    const quotaService = DiskQuotaService.getInstance();
    // Extract instance UUID from path if it's an instance directory
    // Path format is typically like /path/to/daemon/data/InstanceData/{instance_uuid}/...
    const pathSegments = sourceZipPath.split('/');
    const instanceDataIndex = pathSegments.indexOf('InstanceData');
    if (instanceDataIndex !== -1 && pathSegments.length > instanceDataIndex + 1) {
      const instanceUuid = pathSegments[instanceDataIndex + 1];
      // Check if this instance has a quota set
      const quota = quotaService["quotaMap"].get(instanceUuid);
      if (quota && quota > 0) {
        // Get current disk usage for the instance directory
        const instanceDir = path.join('/', ...pathSegments.slice(0, instanceDataIndex + 2)); // Include InstanceData and UUID
        const currentUsage = await quotaService.getDiskUsage(instanceDir);
        // Estimate that the zip file might be a significant size
        const estimatedZipSize = totalSize * 0.5; // Estimate zip compression ratio
        
        if (currentUsage + estimatedZipSize > quota) {
          throw new Error($t("TXT_CODE_disk_quota_exceeded_write"));
        }
      }
    }
    
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
  
  /**
   * Get the total size of a directory recursively
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        totalSize += await this.getDirectorySize(itemPath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }
}
