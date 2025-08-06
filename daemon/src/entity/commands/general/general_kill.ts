import { t } from "i18next";
import { sleep } from "../../../tools/time";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";

export default class GeneralKillCommand extends InstanceCommand {
  constructor() {
    super("KillCommand");
  }

  async exec(instance: Instance) {
    if (instance.status() === Instance.STATUS_STOP) return;

    // The program must run for more than 6 seconds before it can be forced to stop!
    const waitTime = instance.startTimestamp + 6 * 1000 - Date.now();
    if (instance.startTimestamp && waitTime > 0) {
      await sleep(waitTime);
    }

    instance.ignoreEventTaskOnce();

    const task = instance?.asynchronousTask;
    if (task && typeof task.stop === "function") {
      task.stop(instance).catch((err) => {
        instance.println(
          "ERROR",
          `Instance ${instance.config.nickname} asynchronousTask stop failed: ${err}`
        );
      });
    }

    if (instance.process) {
      try {
        await instance.process.kill("SIGKILL");
      } catch (err) {
        instance.println(
          "ERROR",
          `Instance ${instance.config.nickname} process kill failed: ${err}`
        );
      }
    }
  }
}
