import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { isExitCommand } from "../general/general_command";
import { executeWebRcon, WebRconError } from "./web_rcon_client";

function errorMessage(error: WebRconError) {
  switch (error.code) {
    case "invalidTarget":
      return $t("TXT_CODE_RCON_WEB_invalidTarget");
    case "missingPassword":
      return $t("TXT_CODE_RCON_WEB_missingPassword");
    case "handshake":
      return $t("TXT_CODE_RCON_WEB_handshake");
    case "invalidResponse":
      return $t("TXT_CODE_RCON_WEB_invalidResponse");
    case "timeout":
      return $t("TXT_CODE_RCON_WEB_timeout");
    case "sendFailed":
      return $t("TXT_CODE_RCON_WEB_sendFailed");
    case "connectionError":
      return $t("TXT_CODE_RCON_WEB_connectionError");
    case "closed":
      return $t("TXT_CODE_RCON_WEB_closed");
    default:
      return $t("TXT_CODE_RCON_WEB_connect");
  }
}

export default class WebRconCommand extends InstanceCommand {
  constructor(public readonly cmd?: string) {
    super("WebRconSendCommand");
  }

  async exec(instance: Instance, text?: string): Promise<any> {
    if (isExitCommand(instance, text)) return;
    const command = text ?? this.cmd;
    if (!command) return;
    if (!instance.process) {
      instance.println("RCON ERROR", $t("TXT_CODE_command.instanceNotOpen"));
      return;
    }

    instance.print(`[RCON] <<< ${command}\n`);
    try {
      const response = await executeWebRcon({
        host: instance.config.rconIp || "localhost",
        port: instance.config.rconPort || 0,
        password: instance.config.rconPassword || "",
        command
      });
      if (response) instance.print(`[RCON] ${response}\n`);
    } catch (error: any) {
      if (
        error instanceof WebRconError &&
        error.code === "closed" &&
        error.writeConfirmed &&
        instance.status() === Instance.STATUS_STOPPING
      )
        return;
      instance.println(
        "RCON ERROR",
        error instanceof WebRconError ? errorMessage(error) : $t("TXT_CODE_RCON_WEB_connect")
      );
    }
  }
}
