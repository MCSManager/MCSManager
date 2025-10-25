import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";

export default class GeneralRestartCommand extends InstanceCommand {
  constructor() {
    super("GeneralRestartCommand");
  }

  async exec(instance: Instance) {
    const userUuid: string = instance.config.userUuid;

    try {
      instance.ignoreEventTaskOnce();
      instance.println("INFO", $t("TXT_CODE_restart.start", userUuid));
      instance.setLock(true);
      await instance.execPreset("stop");
      const startCount = instance.startCount;
      // Check the instance status every second,
      // if the instance status is stopped, restart the server immediately
      const task = setInterval(async () => {
        try {
          if (startCount !== instance.startCount) {
            throw new Error($t("TXT_CODE_restart.error1", userUuid));
          }
          if (
            instance.status() !== Instance.STATUS_STOPPING &&
            instance.status() !== Instance.STATUS_STOP
          ) {
            throw new Error($t("TXT_CODE_restart.error2", userUuid));
          }
          if (instance.status() === Instance.STATUS_STOP) {
            instance.println("INFO", $t("TXT_CODE_restart.restarting", userUuid));
            instance.setLock(false);
            clearInterval(task);
            await instance.execPreset("start");
          }
        } catch (error: any) {
          clearInterval(task);
          instance.setLock(false);
          instance.failure(error);
        }
      }, 1000);
    } catch (error: any) {
      instance.setLock(false);
      instance.failure(error);
    }
  }
}
