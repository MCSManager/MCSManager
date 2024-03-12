import { $t } from "../../i18n";
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

    if (instance.status() !== Instance.STATUS_RUNNING) {
      throw new Error($t("TXT_CODE_d58ffa0f"));
    }

    return await instance.execPreset("restart");
  }
}
