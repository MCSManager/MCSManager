import Instance from "../entity/instance/instance";
import StorageSubsystem from "../common/system_storage";
import logger from "./log";
import { DiskQuotaService } from "./disk_quota_service";
import InstanceSubsystem from "./system_instance";

const POLL_INTERVAL_MS = 60 * 1000;
const MAX_PARALLEL = 2;

export class DiskUsageScheduler {
  private timer?: NodeJS.Timeout;
  private running = false;

  public start() {
    if (this.running) return;
    this.running = true;
    this.scheduleNext(0);
  }

  public stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.running = false;
  }

  private scheduleNext(delay: number) {
    if (!this.running) return;
    this.timer = setTimeout(() => this.pollAllInstances().catch(() => {}), delay);
  }

  private async pollAllInstances() {
    const instances = InstanceSubsystem.getInstances();
    if (!instances.length) {
      this.scheduleNext(POLL_INTERVAL_MS);
      return;
    }

    // logger.info(`[DiskUsageScheduler] Polling ${instances.length} instances with concurrency ${MAX_PARALLEL}`);
    const quotaService = DiskQuotaService.getInstance();
    const queue: Promise<void>[] = [];
    let active = 0;
    const iterator = instances[Symbol.iterator]();

    const launchNext = async (): Promise<void> => {
      const next = iterator.next();
      if (next.done) return;
      const instance = next.value as Instance;
      active++;
      try {
        await this.pollInstance(quotaService, instance);
      } catch (error) {
        logger.warn(
          `[DiskUsageScheduler] Failed to poll ${instance.instanceUuid}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        active--;
        if (active < MAX_PARALLEL) {
          await launchNext();
        }
      }
    };

    // Prime workers
    for (let i = 0; i < Math.min(MAX_PARALLEL, instances.length); i++) {
      queue.push(launchNext());
    }
    await Promise.all(queue);
    this.scheduleNext(POLL_INTERVAL_MS);
  }

  private async pollInstance(quotaService: DiskQuotaService, instance: Instance) {
    const used = await quotaService.getDiskUsageForInstance(instance);
    const limit = quotaService.getQuota(instance.instanceUuid) || 0;
    instance.info.storageUsage = used;
    instance.info.storageLimit = limit;
    instance.config.diskUsageCache = {
      used,
      checkedAt: Date.now()
    };
    // Persist lightweight cache for observability
    StorageSubsystem.store("InstanceConfig", instance.instanceUuid, instance.config);
  }
}

export const diskUsageScheduler = new DiskUsageScheduler();
