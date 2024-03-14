import { $t } from "../i18n";
import readline from "readline";

import * as protocol from "./protocol";
import InstanceSubsystem from "./system_instance";
import { globalConfiguration } from "../entity/config";
import logger from "./log";
import StartCommand from "../entity/commands/start";
import StopCommand from "../entity/commands/stop";
import KillCommand from "../entity/commands/kill";
import SendCommand from "../entity/commands/cmd";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log($t("TXT_CODE_ui.help"));

function stdin() {
  rl.question("> ", async (answer) => {
    try {
      const cmds = answer.split(" ");
      logger.info(`[Terminal] ${answer}`);
      const result = await command(cmds[0], cmds[1], cmds[2], cmds[3]);
      if (result) console.log(result);
      else console.log(`Command ${answer} does not exist, type help to get help.`);
    } catch (err) {
      logger.error("[Terminal]", err);
    } finally {
      // next
      stdin();
    }
  });
}

stdin();

/**
 * Pass in relevant UI commands and output command results
 * @param {String} cmd
 * @return {String}
 */
async function command(cmd: string, p1: string, p2: string, p3: string) {
  if (cmd === "instance") {
    if (p1 === "start") {
      InstanceSubsystem?.getInstance(p2)?.exec(new StartCommand("Terminal"));
      return "Done.";
    }
    if (p1 === "stop") {
      InstanceSubsystem?.getInstance(p2)?.exec(new StopCommand());
      return "Done.";
    }
    if (p1 === "kill") {
      InstanceSubsystem?.getInstance(p2)?.exec(new KillCommand());
      return "Done.";
    }
    if (p1 === "send") {
      InstanceSubsystem?.getInstance(p2)?.exec(new SendCommand(p3));
      return "Done.";
    }
    return "Parameter error";
  }

  if (cmd === "instances") {
    const objs = InstanceSubsystem.instances;
    let result = "instance name | instance UUID | status code\n";
    objs.forEach((v) => {
      result += `${v.config.nickname} ${v.instanceUuid} ${v.status()}\n`;
    });
    result += "\nStatus Explanation:\n Busy=-1;Stop=0;Stopping=1;Starting=2;Running=3;\n";
    return result;
  }

  if (cmd === "sockets") {
    const sockets = protocol.socketObjects();
    let result = "IP address   |   identifier\n";
    sockets.forEach((v) => {
      result += `${v.handshake.address} ${v.id}\n`;
    });
    result += `Total ${sockets.size} online.\n`;
    return result;
  }

  if (cmd == "key") {
    return globalConfiguration.config.key;
  }

  if (cmd == "exit") {
    try {
      logger.info("Preparing to shut down the daemon...");
      await InstanceSubsystem.exit();
      // logger.info("Data saved, thanks for using, goodbye!");
      logger.info("The data is saved, thanks for using, goodbye!");
      logger.info("closed.");
      process.exit(0);
    } catch (err) {
      logger.error(
        "Failed to end the program. Please check the file permissions and try again. If you still can't close it, please use Ctrl+C to close.",
        err
      );
    }
  }

  if (cmd == "help") {
    console.log("----------- Help document -----------");
    console.log(" instances view all instances");
    console.log(" Sockets view all linkers");
    console.log(" key view key");
    console.log(" exit to close this program (recommended method)");
    console.log(" instance start <UUID> to start the specified instance");
    console.log(" instance stop <UUID> to start the specified instance");
    console.log(" instance kill <UUID> to start the specified instance");
    console.log(" instance send <UUID> <CMD> to send a command to the instance");
    console.log("----------- Help document -----------");
    return "\n";
  }
}
