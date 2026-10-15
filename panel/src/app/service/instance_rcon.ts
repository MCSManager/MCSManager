import { hasRconConfigUpdate, type RconConfigUpdate } from "mcsmanager-common";
import type RemoteService from "../entity/remote_service";
import { $t } from "../i18n";
import RemoteRequest from "./remote_command";

export function updateInstanceWithRconAuthorization(
  remoteService: RemoteService | undefined,
  instanceUuid: string,
  config: RconConfigUpdate & Record<string, unknown>,
  allowWebRconConfiguration = false
) {
  if (config?.rconProtocol === "rust-web" && allowWebRconConfiguration !== true)
    throw new Error($t("TXT_CODE_RCON_WEB_adminOnly"));

  // Never fall back: an older daemon must reject RCON updates, not silently
  // apply them without the new authorization policy.
  const event = hasRconConfigUpdate(config) ? "instance/update_rcon" : "instance/update";
  return new RemoteRequest(remoteService).request(event, {
    instanceUuid,
    config,
    allowWebRconConfiguration: allowWebRconConfiguration === true
  });
}
