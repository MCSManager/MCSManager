import disk_limit_service from "../../../service/disk_limit_service";
import Instance from "../../instance/instance";
import { ILifeCycleTask } from "../../instance/life_cycle";

// Disk quota is opt-in: maxSpace <= 0 (default 0 / unset / negative) means
// the feature is disabled, so we skip the recursive `du` scan on the working
// directory that would otherwise run every 45s for instances with no quota.
const CHECK_INTERVAL_MS = 1000 * 45;

export default class InstanceDiskCheckTask implements ILifeCycleTask {
  public status: number = 0;
  public name: string = "AnyInstanceStats";

  private task: any = null;

  async start(instance: Instance) {
    this.task = setInterval(() => {
      // maxSpace <= 0 means the quota feature is disabled (default/unset/negative).
      // Treat it as off and skip the `du` scan, avoiding useless disk I/O.
      const maxSpace = Number(instance.config.docker?.maxSpace);
      if (maxSpace > 0) {
        disk_limit_service.checkInstanceDiskSize(instance);
      }
    }, CHECK_INTERVAL_MS);
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
