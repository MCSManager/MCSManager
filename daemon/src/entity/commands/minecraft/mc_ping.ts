import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { MCServerStatus, toNumber } from "mcsmanager-common";

export default class PingJavaMinecraftServerCommand extends InstanceCommand {
  constructor() {
    super("PingJavaMinecraftServerCommand");
  }

  async exec(instance: Instance) {
    const host = instance.config.pingConfig.ip || "localhost";
    try {
      if (instance.config.pingConfig.port) {
        const result = await new MCServerStatus(instance.config.pingConfig.port, host).getStatus();
        if (result.online) {
          instance.info.mcPingOnline = true;
          instance.info.currentPlayers = toNumber(result.current_players) ?? 0;
          instance.info.maxPlayers = toNumber(result.max_players) ?? 0;
          instance.info.version = result.version;
          instance.info.latency = toNumber(result.latency) ?? 0;
        } else {
          instance.resetPingInfo();
        }
        return result;
      }
    } catch (error) {
      instance.resetPingInfo();
      // ignore error
    }
    return null;
  }
}
