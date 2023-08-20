import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";

export default class GeneralKillCommand extends InstanceCommand {
  constructor() {
    super("KillCommand");
  }

  async exec(instance: Instance) {
    if (instance.process) {
      await instance.process.kill("SIGKILL");
    }
    instance.setLock(false);
  }
}
