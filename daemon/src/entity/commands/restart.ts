import Instance from "../instance/instance";
import InstanceCommand from "./base/command";

export default class RestartCommand extends InstanceCommand {
  constructor() {
    super("RestartCommand");
  }

  async exec(instance: Instance) {
    // If the automatic restart function is enabled, the setting is ignored once
    if (instance.config.eventTask && instance.config.eventTask.autoRestart)
      instance.config.eventTask.ignore = true;

    return await instance.execPreset("restart");
  }
}
