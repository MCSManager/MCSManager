import dgram from "dgram";
import Instance from "../instance/instance";
import InstanceCommand from "../commands/base/command";

// Get Minecraft Bedrock server MOTD information
// Author: https://github.com/Mcayear
async function request(ip: string, port: number) {
  const message = Buffer.from(
    "01 00 00 00 00 00 06 18 20 00 FF FF 00 FE FE FE FE FD FD FD FD 12 34 56 78 A3 61 1C F8 BA 8F D5 60".replace(
      / /g,
      ""
    ),
    "hex"
  );
  const client = dgram.createSocket("udp4");
  var Config = {
    ip,
    port
  };
  return new Promise((r, j) => {
    client.on("error", (err: any) => {
      try {
        client.close();
      } finally {
        j(err);
      }
    });
    client.on("message", (data: any) => {
      const result = data.toString().split(";");
      try {
        client.close();
      } finally {
        r(result);
      }
    });
    client.send(message, Config.port, Config.ip, (err: any) => {
      if (err) {
        try {
          client.close();
        } finally {
          j(err);
        }
      }
    });
    setTimeout(() => {
      j("request timeout");
      try {
        client.close();
      } catch (error: any) {}
    }, 3000);
  });
}

// Adapt to MCSManager lifecycle tasks
export default class MinecraftBedrockGetPlayersCommand extends InstanceCommand {
  constructor() {
    super("MinecraftBedrockGetPlayersCommand");
  }

  async exec(instance: Instance) {
    if (instance.config.pingConfig.ip && instance.config.pingConfig.port) {
      try {
        const info: any = await request(
          instance.config.pingConfig.ip,
          instance.config.pingConfig.port
        );
        return {
          version: info[3],
          motd: info[0],
          current_players: info[4],
          max_players: info[5]
        };
      } catch (error: any) {}
    }
    return null;
  }
}
