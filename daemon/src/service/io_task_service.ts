import { v4 as uuidv4 } from "uuid";
import StorageSubsystem from "../common/system_storage";
import { DiskQuotaService } from "./disk_quota_service";
import logger from "./log";
import InstanceSubsystem from "./system_instance";

export type IoTaskStatus = "running" | "success" | "failed" | "cancelled";

export interface IoTaskRecord {
  id: string;
  instanceUuid: string;
  type: string;
  path: string;
  status: IoTaskStatus;
  startedAt: number;
  finishedAt?: number;
  progress?: number;
  message?: string;
  deltaBytes?: number;
  startUsage?: number;
}

interface StartTaskOptions {
  instanceUuid?: string;
  type: string;
  path?: string;
  dedupeKey?: string;
  dedupeWindowMs?: number;
}

class IoTaskService {
  private static instance: IoTaskService;
  private readonly tasks: IoTaskRecord[] = [];
  private readonly dedupeMap: Map<string, number> = new Map();
  private readonly MAX_TASKS = 200;
  private readonly EXPIRE_MS = 10 * 60 * 1000;

  public static getInstance(): IoTaskService {
    if (!IoTaskService.instance) {
      IoTaskService.instance = new IoTaskService();
    }
    return IoTaskService.instance;
  }

  public startTask(options: StartTaskOptions): { task?: IoTaskRecord; skipped: boolean } {
    const instanceUuid = options.instanceUuid || "global";
    const dedupeWindow = options.dedupeWindowMs ?? 1000;
    const now = Date.now();
    const dedupeKey = options.dedupeKey || `${instanceUuid}:${options.type}:${options.path || ""}`;
    const lastTs = this.dedupeMap.get(dedupeKey);
    if (lastTs && now - lastTs < dedupeWindow) {
      return { skipped: true };
    }

    this.dedupeMap.set(dedupeKey, now);
    const task: IoTaskRecord = {
      id: uuidv4(),
      instanceUuid,
      type: options.type,
      path: options.path || "",
      status: "running",
      startedAt: now
    };

    this.enrichStartUsage(task).catch((err) => {
      logger.debug(
        `[IoTaskService] start usage failed: ${err instanceof Error ? err.message : String(err)}`
      );
    });

    this.tasks.unshift(task);
    this.prune();
    return { task, skipped: false };
  }

  public updateProgress(taskId: string | undefined, progress: number) {
    if (!taskId) return;
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) task.progress = Math.max(0, Math.min(100, Math.floor(progress)));
  }

  public async finishTask(taskId: string | undefined, status: IoTaskStatus, message?: string) {
    if (!taskId) return;
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.status = status;
    task.finishedAt = Date.now();
    if (message) task.message = message;
    await this.updateUsageDelta(task).catch((err) => {
      logger.debug(
        `[IoTaskService] update usage failed: ${err instanceof Error ? err.message : String(err)}`
      );
    });
    this.prune();
  }

  public getTasks(scope: "node" | "instance", instanceUuid: string): IoTaskRecord[] {
    const now = Date.now();
    const items = this.tasks.filter((t) => now - t.startedAt < this.EXPIRE_MS);
    if (scope === "node") return items.slice(0, this.MAX_TASKS);
    return items.filter((t) => t.instanceUuid === instanceUuid).slice(0, this.MAX_TASKS);
  }

  private prune() {
    const now = Date.now();
    while (this.tasks.length > this.MAX_TASKS) this.tasks.pop();
    for (let i = this.tasks.length - 1; i >= 0; i--) {
      if (now - this.tasks[i].startedAt > this.EXPIRE_MS) {
        this.tasks.splice(i, 1);
      }
    }
  }

  private async enrichStartUsage(task: IoTaskRecord) {
    const instance = InstanceSubsystem.getInstance(task.instanceUuid);
    if (!instance) return;
    const quotaService = DiskQuotaService.getInstance();
    task.startUsage = await quotaService.getDiskUsageForInstance(instance, { refresh: true });
  }

  private async updateUsageDelta(task: IoTaskRecord) {
    const instance = InstanceSubsystem.getInstance(task.instanceUuid);
    if (!instance) return;
    const quotaService = DiskQuotaService.getInstance();
    const used = await quotaService.getDiskUsageForInstance(instance, { refresh: true });
    const baseline =
      typeof task.startUsage === "number" ? task.startUsage : instance.config.diskUsageCache?.used;
    if (typeof baseline === "number") {
      task.deltaBytes = used - baseline;
    }
    instance.config.diskUsageCache = {
      used,
      checkedAt: Date.now()
    };
    StorageSubsystem.store("InstanceConfig", instance.instanceUuid, instance.config);
  }
}

export const ioTaskService = IoTaskService.getInstance();
