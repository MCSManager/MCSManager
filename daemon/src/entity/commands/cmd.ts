import Instance from "../instance/instance";
import InstanceCommand from "./base/command";

export default class SendCommand extends InstanceCommand {
  public static CTRL_C = "\x03";

  constructor(public readonly cmd: string) {
    super("SendCommand");
  }

  async exec(instance: Instance) {
    // If it is "Ctrl+C" or "^c" command, bypass RCON and other command execution behaviors,
    // send signals directly or write commands directly.
    if (this.cmd.toLowerCase() === "^c") {
      instance.process?.kill("SIGINT");
      return;
    }
    if (this.cmd == SendCommand.CTRL_C) {
      instance.process?.write(SendCommand.CTRL_C);
      return;
    }
    return await instance.execPreset("command", this.cmd);
  }
}
