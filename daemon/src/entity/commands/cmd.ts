import Instance from "../instance/instance";
import InstanceCommand from "./base/command";

export default class SendCommand extends InstanceCommand {
  public cmd: string;

  constructor(cmd: string) {
    super("SendCommand");
    this.cmd = cmd;
  }

  async exec(instance: Instance) {
    return await instance.execPreset("command", this.cmd);
  }
}
