import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import SendCommand from "../cmd";

export default class PtyStopCommand extends InstanceCommand {
  constructor() {
    super("PtyStopCommand");
  }

  async exec(instance: Instance) {
    let stopCommand = instance.config.stopCommand;

    if (instance.status() === Instance.STATUS_STOP || !instance.process)
      return instance.failure(new Error($t("TXT_CODE_pty_stop.notRunning")));
    instance.status(Instance.STATUS_STOPPING);

    instance.println("INFO", $t("TXT_CODE_pty_stop.execCmd", { stopCommand: stopCommand }));

    const stopCommandList = stopCommand.split("\n");
    for (const stopCommandColumn of stopCommandList) {
      if (stopCommandColumn.toLocaleLowerCase() == "^c") {
        await instance.exec(new SendCommand("\x03"));
      } else {
        await instance.exec(new SendCommand(stopCommandColumn));
      }
    }

    // If the instance is still in the stopped state after 10 minutes, restore the state
    const cacheStartCount = instance.startCount;
    setTimeout(() => {
      if (
        instance.status() === Instance.STATUS_STOPPING &&
        instance.startCount === cacheStartCount
      ) {
        instance.println("ERROR", $t("TXT_CODE_pty_stop.stopErr"));
        instance.status(Instance.STATUS_RUNNING);
      }
    }, 1000 * 60 * 10);

    return instance;
  }
}
