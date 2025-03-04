import { $t } from "../../../i18n";
import logger from "../../../service/log";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";

export default class GeneralKillCommand extends InstanceCommand {
  constructor() {
    super("KillCommand");
  }

  async exec(instance: Instance) {
    if (instance.status() === Instance.STATUS_STOP) return;

    if (instance.startTimestamp && instance.startTimestamp + 6 * 1000 > Date.now()) {
      return instance.failure(new Error($t("TXT_CODE_6259357c")));
    }

    instance.ignoreEventTaskOnce();

    const task = instance?.asynchronousTask;
    if (task && task.stop) {
      task
        .stop(instance)
        .then(() => {})
        .catch((err) => {
          logger.error(`Instance ${instance.config.nickname} asynchronousTask stop error:`, err);
        });
    }

    if (instance.process) {
      await instance.process.kill("SIGKILL");
    }
  }
}
