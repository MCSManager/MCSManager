import Instance from "../instance/instance";
import InstanceCommand from "./base/command";
import SendCommand from "./cmd";

export default class UpdateCommand extends InstanceCommand {
  constructor() {
    super("UpdateCommand");
  }

  async exec(instance: Instance) {
    // Execute the update preset, the preset and function scheduler are set before starting
    return await instance.execPreset("update");
  }
}
