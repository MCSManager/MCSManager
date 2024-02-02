import { t } from "i18next";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import Rcon from "rcon-srcds";

async function sendRconCommand(instance: Instance, command: string) {
  const targetIp = instance.config.rconIp || "localhost";
  const rconServer = new Rcon({
    port: instance.config.rconPort,
    host: targetIp,
    encoding: "utf8",
    timeout: 1000 * 6
  });
  await rconServer.authenticate(instance.config.rconPassword);
  if (!rconServer.isAuthenticated()) {
    throw new Error(
      t("因密码错误导致发送 RCON 命令失败，请检查 Steam Rcon 协议中设置的访问密码！")
    );
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      rconServer.disconnect().catch(() => {});
      instance.print(`[RCON] ${t("命令已送达，但没有任何响应，请在游戏中查看。")}\n`);
      resolve("");
    }, 1000 * 10);
    rconServer
      .execute(command)
      .then((res) => {
        instance.print(`[RCON] ${res}\n`);
        rconServer.disconnect().catch(() => {});
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
    instance.print(`[RCON] <<< ${command}\n`);
  });
}

export default class RconCommand extends InstanceCommand {
  constructor() {
    super("RconSendCommand");
  }

  async exec(instance: Instance, text?: string): Promise<any> {
    sendRconCommand(instance, text);
  }
}
