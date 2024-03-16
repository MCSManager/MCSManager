import { v4 } from "uuid";
import fs from "fs-extra";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import os from "os";
import { killProcess } from "common";
import { ILifeCycleTask } from "../../instance/life_cycle";
import Instance from "../../instance/instance";
import KillCommand from "../kill";
import logger from "../../../service/log";
import { $t } from "../../../i18n";
import { ProcessWrapper } from "common";
import { FRPC_PATH } from "../../../const";
import { downloadFileToLocalFile } from "../../../service/download";
export class OpenFrp {
  public processWrapper?: ProcessWrapper;

  constructor(public readonly token: string, public readonly tunnelId: string) {
    // ./frpc -u <passowrd> -p <channel id>
    this.processWrapper = new ProcessWrapper(
      FRPC_PATH,
      ["-u", this.token, "-p", this.tunnelId],
      path.dirname(FRPC_PATH)
    );
  }

  public open() {
    logger.info("Start openfrp:", FRPC_PATH);
    this.processWrapper?.start();
    if (!this.processWrapper?.getPid()) {
      throw new Error("pid is null");
    }
  }

  public stop() {
    try {
      if (this.processWrapper?.exitCode() == null) {
        this.processWrapper?.kill();
      }
      this.processWrapper = undefined;
    } catch (error: any) {}
  }
}

export default class OpenFrpTask implements ILifeCycleTask {
  public status: number = 0;
  public name: string = "openfrp";
  public static readonly FRP_EXE_NAME = `frpc_${os.platform()}_${os.arch()}${
    os.platform() === "win32" ? ".exe" : ""
  }`;
  public static readonly FRP_EXE_PATH = path.normalize(
    path.join(process.cwd(), "lib", OpenFrpTask.FRP_EXE_NAME)
  );
  public static readonly FRP_DOWNLOAD_ADDR = "https://mcsmanager.oss-cn-guangzhou.aliyuncs.com/";

  async start(instance: Instance) {
    const { openFrpToken, openFrpTunnelId } = instance.config?.extraServiceConfig;
    if (!openFrpToken || !openFrpTunnelId) return;

    if (!fs.existsSync(OpenFrpTask.FRP_EXE_PATH)) {
      const tmpTask = setInterval(() => {
        instance.println("FRP", $t("TXT_CODE_frp.installing"));
      }, 2000);
      try {
        await downloadFileToLocalFile(
          OpenFrpTask.FRP_DOWNLOAD_ADDR + OpenFrpTask.FRP_EXE_NAME,
          OpenFrpTask.FRP_EXE_PATH
        );
        instance.println("FRP", $t("TXT_CODE_frp.done"));
      } catch (error: any) {
        logger.error($t("TXT_CODE_frp.downloadErr"), error);
        instance.println("ERROR", $t("TXT_CODE_frp.downloadErr") + `: ${error}`);
        fs.remove(OpenFrpTask.FRP_EXE_PATH, () => {});
        return;
      } finally {
        clearInterval(tmpTask);
      }
    }

    const frpProcess = new OpenFrp(openFrpToken, openFrpTunnelId);
    frpProcess.processWrapper?.on("start", (pid: number) => {
      if (pid) {
        logger.info(
          `Instance ${instance.config.nickname}(${instance.instanceUuid}) ${pid} Frp task started!`
        );
        logger.info(`Params: ${openFrpTunnelId} | ${openFrpToken}`);
        instance.openFrp = frpProcess;
        instance.info.openFrpStatus = true;
      } else {
        logger.warn(
          `Instance ${instance.config.nickname}(${instance.instanceUuid}) Frp task start failed! Process ID is ${pid}`
        );
      }
    });
    frpProcess.processWrapper?.on("exit", () => {
      logger.info(
        `Instance ${instance.config.nickname}(${instance.instanceUuid}) Frp task stopped!`
      );
      instance.info.openFrpStatus = false;
      instance.openFrp = undefined;
    });

    try {
      frpProcess.open();
    } catch (error: any) {
      logger.warn(
        `Instance ${instance.config.nickname}(${instance.instanceUuid}) Frp task Start failure! ERR:`
      );
      logger.warn(error);
    }
  }

  async stop(instance: Instance) {
    if (instance.openFrp) {
      const frpProcess = instance.openFrp;
      frpProcess.stop();
    }
  }
}
