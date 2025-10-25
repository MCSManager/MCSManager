import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";

export default class GeneralStopCommand extends InstanceCommand {
  constructor() {
    super("StopCommand");
  }

  async exec(instance: Instance) {
    const userUuid: string = instance.config.userUuid;

    const stopCommand = instance.config.stopCommand;
    if (instance.status() === Instance.STATUS_STOP || !instance.process)
      return instance.failure(new Error($t("TXT_CODE_general_stop.notRunning", userUuid)));

    instance.status(Instance.STATUS_STOPPING);
    instance.ignoreEventTaskOnce();

    const stopCommandList = stopCommand.split("\n");
    for (const stopCommand of stopCommandList) {
      await instance.execPreset("command", stopCommand);
    }

    instance.print("\n");
    instance.println("INFO", $t("TXT_CODE_pty_stop.execCmd", { stopCommand: `\n${stopCommand}` }, userUuid));

    const cacheStartCount = instance.startCount;

    // If the instance is still in the stopped state after 10 minutes, restore the state
    setTimeout(() => {
      if (
        instance.status() === Instance.STATUS_STOPPING &&
        instance.startCount === cacheStartCount
      ) {
        instance.println("ERROR", $t("TXT_CODE_general_stop.stopErr", userUuid));
        instance.status(Instance.STATUS_RUNNING);
      }
    }, 1000 * 60 * 10);

    return instance;
  }
}
