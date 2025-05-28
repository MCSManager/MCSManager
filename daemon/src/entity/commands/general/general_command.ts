import { $t } from "../../../i18n";

import Instance from "../../instance/instance";
import { encode } from "iconv-lite";
import InstanceCommand from "../base/command";

export const CTRL_C = "\x03";

export function isExitCommand(instance: Instance, buf: any) {
  if (String(buf).toLowerCase() === "^c" && instance.process) {
    if (instance.config.terminalOption.pty || instance.config.docker.image) {
      instance.process.write(CTRL_C);
      instance.process.write(instance.getCrlfValue());
    } else {
      instance.process.kill("SIGINT");
    }
    return true;
  }
  if (buf == CTRL_C) {
    instance.process?.write(CTRL_C);
    return true;
  }
  return false;
}

export default class GeneralSendCommand extends InstanceCommand {
  constructor() {
    super("SendCommand");
  }

  async exec(instance: Instance, buf?: any): Promise<any> {
    if (isExitCommand(instance, buf)) return;

    // The server shutdown command needs to send a command, but before the server shutdown command is executed, the status will be set to the shutdown state.
    // So here the command can only be executed by whether the process exists or not
    if (instance?.process) {
      instance.process.write(encode(buf, instance.config.ie));
      instance.process.write(instance.getCrlfValue());
    } else {
      instance.failure(new Error($t("TXT_CODE_command.instanceNotOpen")));
    }
  }
}
