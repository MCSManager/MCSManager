import { $t } from "../../i18n";
import Instance from "../instance/instance";
import InstanceCommand from "./base/command";

export class StartupError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export default abstract class AbsStartCommand extends InstanceCommand {
  private async sleep() {
    return new Promise((ok) => {
      setTimeout(ok, 1000 * 2);
    });
  }

  async exec(instance: Instance) {
    if (instance.status() !== Instance.STATUS_STOP)
      return instance.failure(new StartupError($t("TXT_CODE_start.instanceNotDown")));

    try {
      const userUuid: string = instance.config.userUuid;
      instance.setLock(true);
      instance.status(Instance.STATUS_STARTING);
      instance.startCount++;

      instance.startTimestamp = Date.now();

      if (instance.config.endTime) {
        const endTime = instance.config.endTime;
        if (endTime) {
          if (endTime <= instance.startTimestamp) {
            throw new Error($t("TXT_CODE_start.instanceMaturity", userUuid));
          }
        }
      }

      instance.println("INFO", $t("TXT_CODE_start.startInstance", userUuid));

      // prevent the dead-loop from starting
      await this.sleep();

      return await this.createProcess(instance);
    } catch (error: any) {
      instance.execPreset("kill");
      instance.releaseResources();
      instance.status(Instance.STATUS_STOP);
      instance.failure(error);
    } finally {
      instance.setLock(false);
    }
  }

  protected abstract createProcess(instance: Instance): Promise<void>;
}
