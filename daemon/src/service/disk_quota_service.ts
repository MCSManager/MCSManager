import { spawn } from "child_process";
import path from "path";
import Instance from "../entity/instance/instance";
import logger from "./log";
import InstanceSubsystem from "./system_instance";

export interface IDiskQuotaResult {
  used: number; // in bytes
  limit: number; // in bytes
  available: number; // in bytes
  percentage: number; // percentage used
}

export class DiskQuotaService {
  private static instance: DiskQuotaService;
  private quotaMap: Map<string, number> = new Map(); // instance UUID to quota (in bytes)
  private usageCache: Map<string, { used: number; timestamp: number }> = new Map();
  private inFlight: Map<string, Promise<number>> = new Map();
  private cacheTimeout: number = 60_000; // 60 seconds cache aligns with poller

  private constructor() {}

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
  public async getDiskUsageForInstance(
    instance: Instance,
    opts?: { refresh?: boolean }
  ): Promise<number> {
    const refresh = opts?.refresh ?? false;
    const safePath = this.safeInstancePath(instance);
    const cacheKey = instance.instanceUuid;
    const cached = this.usageCache.get(cacheKey);
    if (!refresh && cached && Date.now() - cached.timestamp < this.cacheTimeout) return cached.used;

    const inFlight = !refresh ? this.inFlight.get(cacheKey) : undefined;
    if (inFlight) return inFlight;

    const promise = this.measureWithSystemCommand(safePath)
      .catch((err) => {
        logger.warn(
          `Disk usage measurement failed for ${cacheKey}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        return 0; // fallback to 0 so monitoring continues; quota enforcement will re-run soon
      })
      .then((size) => {
        this.usageCache.set(cacheKey, { used: size, timestamp: Date.now() });
        return size;
      })
      .finally(() => {
        this.inFlight.delete(cacheKey);
      });

    this.inFlight.set(cacheKey, promise);
    return promise;
  }

  private safeInstancePath(instance: Instance): string {
    const resolved = path.resolve(instance.absoluteCwdPath());
    const baseDir = path.resolve(InstanceSubsystem.getInstanceDataDir());
    if (!resolved.startsWith(baseDir) && baseDir !== path.parse(baseDir).root) {
      throw new Error(`Instance path ${resolved} is outside managed data directory`);
    }
    return resolved;
  }

  private measureWithSystemCommand(targetPath: string): Promise<number> {
    if (process.platform === "win32") {
      return this.measureWithPowerShell(targetPath);
    }
    return this.measureWithDu(targetPath);
  }

  private measureWithPowerShell(targetPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const command = [
        "& {",
        "param([string]$p);",
        "$ErrorActionPreference='Stop';",
        "$ProgressPreference='SilentlyContinue';",
        "$sum = (Get-ChildItem -LiteralPath $p -Force -Recurse -File -ErrorAction SilentlyContinue |",
        "  Measure-Object -Property Length -Sum).Sum;",
        "if ($null -eq $sum) { $sum = 0 };",
        "$sum = [Int64]$sum;",
        "[Console]::WriteLine($sum.ToString([System.Globalization.CultureInfo]::InvariantCulture))",
        "}"
      ].join(" ");

      const ps = spawn(
        "powershell.exe",
        ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command, "--", targetPath],
        { shell: false, windowsHide: true, env: process.env, stdio: ["ignore", "pipe", "pipe"] }
      );

      ps.stdout.setEncoding("utf8");
      let output = "";
      ps.stdout.on("data", (data) => {
        output += data.toString();
      });
      let errorText = "";
      ps.stderr.on("data", (data) => {
        errorText += data.toString();
      });
      ps.on("close", (code) => {
        if (code !== 0) {
          return reject(new Error(errorText || `PowerShell exited with code ${code}`));
        }
        const size = parseInt(output.trim(), 10);
        if (Number.isNaN(size)) return reject(new Error("Failed to parse PowerShell output"));
        resolve(size);
      });
    });
  }

  private measureWithDu(targetPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const du = spawn("du", ["-sb", targetPath], { shell: false });
      let output = "";
      let errorText = "";
      du.stdout.on("data", (data) => (output += data.toString()));
      du.stderr.on("data", (data) => (errorText += data.toString()));
      du.on("error", (err) => reject(err));
      du.on("close", (code) => {
        if (code !== 0) return reject(new Error(errorText || `du exited with code ${code}`));
        const match = output.trim().match(/^(\d+)/);
        if (!match) return reject(new Error("Failed to parse du output"));
        resolve(parseInt(match[1], 10));
      });
    });
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

    const used = await this.getDiskUsageForInstance(instance);
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

    const used = await this.getDiskUsageForInstance(instance);
    return used > quota;
  }

  /**
   * Check if adding a file/directory of given size would exceed quota
   * This is used to prevent operations that would exceed the quota
   */
  public async wouldExceedQuota(instance: Instance, additionalSize: number): Promise<boolean> {
    const quota = this.quotaMap.get(instance.instanceUuid);
    if (!quota || quota <= 0) return false;

    const currentUsage = await this.getDiskUsageForInstance(instance);
    return currentUsage + additionalSize > quota;
  }

  /**
   * Get detailed disk quota information for an instance
   */
  public async getQuotaInfo(instance: Instance): Promise<IDiskQuotaResult> {
    const instanceUuid = instance.instanceUuid;
    const quota = this.quotaMap.get(instanceUuid) || 0;
    const used = await this.getDiskUsageForInstance(instance);
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
  public clearCache(instanceUuid: string): void {
    this.usageCache.delete(instanceUuid);
  }

  /**
   * Clear all caches
   */
  public clearAllCaches(): void {
    this.usageCache.clear();
  }
}
