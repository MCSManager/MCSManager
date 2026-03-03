import disk_limit_service from "../../../service/disk_limit_service";
import { sleep } from "../../../utils/sleep";
import Instance from "../../instance/instance";
import { ILifeCycleTask } from "../../instance/life_cycle";

export default class InstanceDiskCheckTask implements ILifeCycleTask {
  public status: number = 0;
  public name: string = "AnyInstanceStats";

  private task: any = null;

  async start(instance: Instance) {
    await this.updateStats(instance);
  }

  async updateStats(instance: Instance) {
    const interval = 1000 * 60 * (Math.floor(Math.random() * 10) + 1); // 1-10 minutes
    await sleep(interval);
    await disk_limit_service.checkInstanceDiskSize(instance);
    if (instance.status() === Instance.STATUS_RUNNING) {
      await this.updateStats(instance);
    }
  }

  async stop(instance: Instance) {
    clearInterval(this.task);
  }
}
