import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { MCServerStatus } from "common";

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
          instance.info.currentPlayers = result.current_players;
          instance.info.maxPlayers = result.max_players;
          instance.info.version = result.version;
        } else {
          instance.resetPingInfo();
        }
        return result;
      }
    } catch (error) {
      // ignore error
    }
    return null;
  }
}
