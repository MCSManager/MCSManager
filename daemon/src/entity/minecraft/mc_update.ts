import { $t } from "../../i18n";
import Instance from "../instance/instance";
import InstanceCommand from "../commands/base/command";

export default class MinecraftUpdateCommand extends InstanceCommand {
  constructor() {
    super("UpdateCommand");
  }

  async exec(instance: Instance) {
    console.log($t("TXT_CODE_mc_update.updateInstance"));
  }
}
