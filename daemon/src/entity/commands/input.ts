import Instance from "../instance/instance";
import InstanceCommand from "./base/command";

export default class SendInput extends InstanceCommand {
  public cmd: string;

  constructor(cmd: string) {
    super("SendInput");
    this.cmd = cmd;
  }

  async exec(instance: Instance) {
    return await instance.execPreset("input", this.cmd);
  }
}
