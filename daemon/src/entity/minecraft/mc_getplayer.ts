import Instance from "../instance/instance";
import InstanceCommand from "../commands/base/command";
import { MCServerStatus } from "common";

export default class MinecraftGetPlayersCommand extends InstanceCommand {
  constructor() {
    super("MinecraftGetPlayersCommand");
  }

  async exec(instance: Instance) {
    if (instance.config.pingConfig.ip && instance.config.pingConfig.port) {
      const player = await new MCServerStatus(
        instance.config.pingConfig.port,
        instance.config.pingConfig.ip
      ).getStatus();
      return player;
    }
    return null;
  }
}
