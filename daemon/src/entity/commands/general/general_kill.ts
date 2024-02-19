import logger from "../../../service/log";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";

export default class GeneralKillCommand extends InstanceCommand {
  constructor() {
    super("KillCommand");
  }

  async exec(instance: Instance) {
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
    instance.setLock(false);
  }
}
