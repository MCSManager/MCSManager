import { $t } from "../../i18n";
import Instance from "../instance/instance";
import InstanceCommand from "../commands/base/command";

export default class MinecraftUpdateCommand extends InstanceCommand {
  constructor() {
    super("MinecraftUpdateCommand");
  }

  async exec(instance: Instance) {
    // Not supported yet
  }
}
