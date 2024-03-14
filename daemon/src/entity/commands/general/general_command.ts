import { $t } from "../../../i18n";

import Instance from "../../instance/instance";
import { encode } from "iconv-lite";
import InstanceCommand from "../base/command";

export default class GeneralSendCommand extends InstanceCommand {
  constructor() {
    super("SendCommand");
  }

  async exec(instance: Instance, buf?: any): Promise<any> {
    // The server shutdown command needs to send a command, but before the server shutdown command is executed, the status will be set to the shutdown state.
    // So here the command can only be executed by whether the process exists or not
    if (instance?.process) {
      instance.process.write(encode(buf, instance.config.oe));
      if (instance.config.crlf === 2) return instance.process.write("\r\n");
      return instance.process.write("\n");
    } else {
      instance.failure(new Error($t("TXT_CODE_command.instanceNotOpen")));
    }
  }
}
