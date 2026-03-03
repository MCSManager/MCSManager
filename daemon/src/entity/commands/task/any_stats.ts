import disk_limit_service from "../../../service/disk_limit_service";
import Instance from "../../instance/instance";
import { ILifeCycleTask } from "../../instance/life_cycle";

export default class InstanceDiskCheckTask implements ILifeCycleTask {
  public status: number = 0;
  public name: string = "AnyInstanceStats";

  private task: any = null;

  async start(instance: Instance) {
    this.task = setInterval(() => {
      disk_limit_service.checkInstanceDiskSize(instance);
    }, 1000 * 45);
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
