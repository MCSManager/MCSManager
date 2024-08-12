import Instance from "../instance/instance";
import InstanceCommand from "./base/command";

export default class SendCommand extends InstanceCommand {
  constructor(public readonly cmd: string) {
    super("SendCommand");
  }

  async exec(instance: Instance) {
    return await instance.execPreset("command", this.cmd);
  }
}
