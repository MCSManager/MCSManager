import { ILifeCycleTask } from "../../instance/life_cycle";
import Instance from "../../instance/instance";
import KillCommand from "../kill";

// When the instance is running, continue to check the expiration time
export default class TimeCheck implements ILifeCycleTask {
  public status: number = 0;
  public name: string = "TimeCheck";

  private task: any = null;

  async start(instance: Instance) {
    this.task = setInterval(async () => {
      if (instance.config.endTime) {
        const endTime = instance.config.endTime;
        if (endTime) {
          const currentTime = Date.now();
          if (endTime <= currentTime) {
            // Expired, execute the end process command
            await instance.exec(new KillCommand());
            clearInterval(this.task);
          }
        }
      }
    }, 1000 * 60 * 60);
  }

  async stop(instance: Instance) {
    clearInterval(this.task);
  }
}
