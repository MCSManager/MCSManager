import disk_limit_service from "../../../service/disk_limit_service";
import Instance from "../../instance/instance";
import { ILifeCycleTask } from "../../instance/life_cycle";

// Disk quota is opt-in: only instances with maxSpace > 0 are checked.
// This mirrors the guard in start.ts and avoids a useless recursive `du`
// scan on the working directory every 45s for instances that have no quota.
const CHECK_INTERVAL_MS = 1000 * 45;

export default class InstanceDiskCheckTask implements ILifeCycleTask {
  public status: number = 0;
  public name: string = "AnyInstanceStats";

  private task: any = null;

  async start(instance: Instance) {
    this.task = setInterval(() => {
      if (Number(instance.config.docker?.maxSpace) > 0) {
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
