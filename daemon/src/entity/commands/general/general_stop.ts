import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import SendCommand from "../cmd";
import RconCommand from "../steam/rcon_command";

export default class GeneralStopCommand extends InstanceCommand {
  constructor() {
    super("StopCommand");
  }

  async exec(instance: Instance) {
    const stopCommand = instance.config.stopCommand;
    if (instance.status() === Instance.STATUS_STOP || !instance.process)
      return instance.failure(new Error($t("TXT_CODE_general_stop.notRunning")));

    instance.status(Instance.STATUS_STOPPING);

    const stopCommandList = stopCommand.split("\n");
    for (const stopCommand of stopCommandList) {
      await instance.exec(new SendCommand(stopCommand));
    }

    instance.print("\n");
    instance.println("INFO", $t("TXT_CODE_general_stop.execCmd", { stopCommand }));
    const cacheStartCount = instance.startCount;

    // If the instance is still in the stopped state after 10 minutes, restore the state
    setTimeout(() => {
      if (
        instance.status() === Instance.STATUS_STOPPING &&
        instance.startCount === cacheStartCount
      ) {
        instance.println("ERROR", $t("TXT_CODE_general_stop.stopErr"));
        instance.status(Instance.STATUS_RUNNING);
      }
    }, 1000 * 60 * 10);

    return instance;
  }
}
