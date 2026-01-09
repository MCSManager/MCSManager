import { exec } from "child_process";
import fs from "fs-extra";
import path from "path";
import { promisify } from "util";
import Instance from "../entity/instance/instance";
import logger from "./log";

const execAsync = promisify(exec);

export interface IDiskQuotaResult {
  used: number;  // in bytes
  limit: number; // in bytes
  available: number; // in bytes
  percentage: number; // percentage used
}

export class DiskQuotaService {
  private static instance: DiskQuotaService;
  private quotaMap: Map<string, number> = new Map(); // instance UUID to quota (in bytes)
  private usageCache: Map<string, { used: number; timestamp: number }> = new Map();
  private cacheTimeout: number = 5000; // 5 seconds cache

  private constructor() {}

  /**
   * Extract instance UUID from a path
   * Handles both Unix and Windows path separators
   */
  private extractInstanceUuid(filePath: string): string | null {
    // Normalize the path to use forward slashes for consistent processing
    const normalizedPath = filePath.replace(/\\/g, '/');
    const pathSegments = normalizedPath.split('/');
    const instanceDataIndex = pathSegments.indexOf('InstanceData');
    
    if (instanceDataIndex !== -1 && pathSegments.length > instanceDataIndex + 1) {
      return pathSegments[instanceDataIndex + 1];
    }
    return null;
  }

  /**
   * Build the instance directory path
   */
  private buildInstanceDirPath(filePath: string): string | null {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const pathSegments = normalizedPath.split('/');
    const instanceDataIndex = pathSegments.indexOf('InstanceData');
    
    if (instanceDataIndex !== -1 && pathSegments.length > instanceDataIndex + 1) {
      return pathSegments.slice(0, instanceDataIndex + 2).join('/');
    }
    return null;
  }

  public static getInstance(): DiskQuotaService {
    if (!DiskQuotaService.instance) {
      DiskQuotaService.instance = new DiskQuotaService();
    }
    return DiskQuotaService.instance;
  }

  /**
   * Set disk quota for an instance (in MB)
   */
  public setQuota(instanceUuid: string, quotaInMB: number): void {
    if (quotaInMB <= 0) {
      // If quota is 0 or negative, remove the quota (unlimited)
      this.quotaMap.delete(instanceUuid);
      this.usageCache.delete(instanceUuid);
    } else {
      this.quotaMap.set(instanceUuid, quotaInMB * 1024 * 1024); // Convert to bytes
    }
  }

  /**
   * Get current disk usage for an instance
   */
  public async getDiskUsage(instancePath: string): Promise<number> {
    try {
      // Check if we have a cached result
      const cached = this.usageCache.get(instancePath);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.used;
      }

      let size = 0;
      
      // Use platform-appropriate command to calculate disk usage
      if (process.platform === 'win32') {
        // On Windows, use PowerShell to calculate directory size
        try {
          const { stdout } = await execAsync(
            `powershell -command "& {Get-ChildItem -Path '${instancePath.replace(/'/g, "''")}' -Recurse -File | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum}"`
          );
          const parsedSize = parseInt(stdout.trim(), 10);
          size = isNaN(parsedSize) ? 0 : parsedSize;
        } catch (psError) {
          // If PowerShell fails, fall back to Node.js fs method
          size = await this.calculateDiskUsageWithFs(instancePath);
        }
      } else {
        // On Unix-like systems, use du command (more efficient for large directories)
        try {
          const { stdout } = await execAsync(`du -sb "${instancePath}" 2>/dev/null || echo "0\\t${instancePath}"`);
          const match = stdout.trim().match(/^(\d+)/);
          size = match ? parseInt(match[1], 10) : 0;
        } catch (duError) {
          // If du command fails, fall back to Node.js fs method
          size = await this.calculateDiskUsageWithFs(instancePath);
        }
      }

      // Cache the result
      this.usageCache.set(instancePath, { used: size, timestamp: Date.now() });
      return size;
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`Failed to get disk usage for ${instancePath}: ${error.message}`);
      } else {
        logger.warn(`Failed to get disk usage for ${instancePath}: ${String(error)}`);
      }
      
      // Fallback: calculate using Node.js fs
      return await this.calculateDiskUsageWithFs(instancePath);
    }
  }

  /**
   * Calculate disk usage using Node.js fs module (cross-platform)
   */
  private async calculateDiskUsageWithFs(instancePath: string): Promise<number> {
    try {
      const stats = await fs.stat(instancePath);
      if (stats.isFile()) {
        return stats.size;
      }

      let totalSize = 0;
      const items = await fs.readdir(instancePath);
      
      for (const item of items) {
        const itemPath = path.join(instancePath, item);
        const itemStats = await fs.stat(itemPath);
        
        if (itemStats.isDirectory()) {
          totalSize += await this.calculateDiskUsageWithFs(itemPath);
        } else {
          totalSize += itemStats.size;
        }
      }
      
      return totalSize;
    } catch (fsError) {
      if (fsError instanceof Error) {
        logger.error(`Failed to calculate disk usage for ${instancePath} using fs: ${fsError.message}`);
      } else {
        logger.error(`Failed to calculate disk usage for ${instancePath} using fs: ${String(fsError)}`);
      }
      return 0;
    }
  }

  /**
   * Check if an instance has space available
   */
  public async hasSpaceAvailable(instance: Instance): Promise<boolean> {
    const instanceUuid = instance.instanceUuid;
    const quota = this.quotaMap.get(instanceUuid);
    
    // If no quota is set, unlimited space
    if (!quota) {
      return true;
    }

    const used = await this.getDiskUsage(instance.absoluteCwdPath());
    return used < quota;
  }

  /**
   * Check if an instance exceeds its quota
   */
  public async exceedsQuota(instance: Instance): Promise<boolean> {
    const instanceUuid = instance.instanceUuid;
    const quota = this.quotaMap.get(instanceUuid);
    
    // If no quota is set, instance cannot exceed quota
    if (!quota) {
      return false;
    }

    const used = await this.getDiskUsage(instance.absoluteCwdPath());
    return used > quota;
  }

  /**
   * Check if adding a file/directory of given size would exceed quota
   * This is used to prevent operations that would exceed the quota
   */
  public async wouldExceedQuota(instancePath: string, additionalSize: number): Promise<boolean> {
    // Get instance directory from the path
    const instanceDir = this.buildInstanceDirPath(instancePath);
    if (!instanceDir) {
      // Path doesn't contain InstanceData, so no quota to check
      return false;
    }

    // Extract UUID
    const uuid = this.extractInstanceUuid(instancePath);
    if (!uuid) {
      return false;
    }

    const quota = this.quotaMap.get(uuid);
    if (!quota || quota <= 0) {
      // No quota set
      return false;
    }

    const currentUsage = await this.getDiskUsage(instanceDir);
    return currentUsage + additionalSize > quota;
  }

  /**
   * Get detailed disk quota information for an instance
   */
  public async getQuotaInfo(instance: Instance): Promise<IDiskQuotaResult> {
    const instanceUuid = instance.instanceUuid;
    const quota = this.quotaMap.get(instanceUuid) || 0;
    const used = await this.getDiskUsage(instance.absoluteCwdPath());
    const available = quota > 0 ? quota - used : Number.MAX_SAFE_INTEGER;
    const percentage = quota > 0 ? (used / quota) * 100 : 0;

    return {
      used,
      limit: quota,
      available,
      percentage
    };
  }

  /**
   * Get quota for a specific instance (in bytes)
   * Returns 0 if no quota is set
   */
  public getQuota(instanceUuid: string): number {
    return this.quotaMap.get(instanceUuid) || 0;
  }

  /**
   * Clear cache for specific instance
   */
  public clearCache(instancePath: string): void {
    this.usageCache.delete(instancePath);
  }

  /**
   * Clear all caches
   */
  public clearAllCaches(): void {
    this.usageCache.clear();
  }
}