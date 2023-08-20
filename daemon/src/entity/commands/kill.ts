import Instance from "../instance/instance";
import InstanceCommand from "./base/command";

export default class KillCommand extends InstanceCommand {
  constructor() {
    super("KillCommand");
  }

  async exec(instance: Instance) {
    // If the automatic restart function is enabled, the setting is ignored once
    if (instance.config.eventTask && instance.config.eventTask.autoRestart)
      instance.config.eventTask.ignore = true;

    // send stop command
    return await instance.execPreset("kill");
  }
}
