import disk_limit_service from "../../../service/disk_limit_service";
import Instance from "../../instance/instance";
import { ILifeCycleTask } from "../../instance/life_cycle";

const DEFAULT_DISK_CHECK_INTERVAL_MS = 1000 * 45;
const HARD_QUOTA_DISK_CHECK_INTERVAL_MS = 1000 * 60 * 10;

export default class InstanceDiskCheckTask implements ILifeCycleTask {
  public status: number = 0;
  public name: string = "AnyInstanceStats";

  private task: any = null;

  async start(instance: Instance) {
    const interval =
      instance.config.docker?.enableHardStorageQuota && Number(instance.config.docker?.maxSpace || 0) > 0
        ? HARD_QUOTA_DISK_CHECK_INTERVAL_MS
        : DEFAULT_DISK_CHECK_INTERVAL_MS;
    this.task = setInterval(() => {
      disk_limit_service.checkInstanceDiskSize(instance);
    }, interval);
  }

  async stop(instance: Instance) {
    clearInterval(this.task);
    instance.info = {
      ...instance.info,
      storageUsage: 0,
      storageLimit: instance.config.docker?.maxSpace ?? 0
    };
  }
}
