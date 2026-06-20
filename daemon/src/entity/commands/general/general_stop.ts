import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";

export default class GeneralStopCommand extends InstanceCommand {
  constructor() {
    super("StopCommand");
  }

  async exec(instance: Instance) {
    const stopCommand = instance.config.stopCommand;
    if (instance.status() === Instance.STATUS_STOP || !instance.process)
      return instance.failure(new Error($t("TXT_CODE_general_stop.notRunning")));

    instance.status(Instance.STATUS_STOPPING);
    instance.ignoreEventTaskOnce();

    const stopCommandList = stopCommand.split("\n");
    for (const stopCommand of stopCommandList) {
      await instance.execPreset("command", stopCommand);
    }

    instance.print("\n");
    instance.println("INFO", $t("TXT_CODE_pty_stop.execCmd", { stopCommand: `\n${stopCommand}` }));

    const cacheStartCount = instance.startCount;
    const stopTimeoutSec = Number(instance.config.stopTimeout) || 0;

    if (stopTimeoutSec > 0) {
      // Enabled: if the instance is still stopping after stopTimeout seconds, escalate to a force kill
      setTimeout(async () => {
        if (
          instance.status() === Instance.STATUS_STOPPING &&
          instance.startCount === cacheStartCount
        ) {
          instance.println(
            "WARN",
            $t("TXT_CODE_general_stop.timeoutKill", { seconds: stopTimeoutSec })
          );
          try {
            await instance.execPreset("kill");
          } catch (err) {
            instance.println("ERROR", `${err}`);
          }
        }
      }, stopTimeoutSec * 1000);
    } else {
      // Disabled (0): keep the original behavior - revert to RUNNING after 10 minutes
      setTimeout(() => {
        if (
          instance.status() === Instance.STATUS_STOPPING &&
          instance.startCount === cacheStartCount
        ) {
          instance.println("ERROR", $t("TXT_CODE_general_stop.stopErr"));
          instance.status(Instance.STATUS_RUNNING);
        }
      }, 1000 * 60 * 10);
    }

    return instance;
  }
}
