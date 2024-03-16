import { $t } from "../../i18n";
import Instance from "../instance/instance";
import InstanceCommand from "./base/command";

class StartupError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export default class StartCommand extends InstanceCommand {
  public source: string;

  constructor(source = "Unknown") {
    super("StartCommand");
    this.source = source;
  }

  private async sleep() {
    return new Promise((ok) => {
      setTimeout(ok, 1000 * 3);
    });
  }

  async exec(instance: Instance) {
    if (instance.status() !== Instance.STATUS_STOP)
      return instance.failure(new StartupError($t("TXT_CODE_start.instanceNotDown")));
    try {
      instance.setLock(true);
      instance.status(Instance.STATUS_STARTING);
      instance.startCount++;

      // expiration time check
      if (instance.config.endTime) {
        const endTime = instance.config.endTime;
        if (endTime) {
          const currentTime = Date.now();
          if (endTime <= currentTime) {
            throw new Error($t("TXT_CODE_start.instanceMaturity"));
          }
        }
      }

      const currentTimestamp = Date.now();
      instance.startTimestamp = currentTimestamp;

      instance.print("\n");
      instance.println("INFO", $t("TXT_CODE_start.startInstance"));

      // prevent the dead-loop from starting
      await this.sleep();

      return await instance.execPreset("start", this.source);
    } catch (error: any) {
      try {
        await instance.execPreset("kill");
      } catch (ignore) {}
      instance.releaseResources();
      instance.status(Instance.STATUS_STOP);
      instance.failure(error);
    } finally {
      instance.setLock(false);
    }
  }
}
