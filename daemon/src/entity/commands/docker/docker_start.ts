import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import Docker from "dockerode";
import logger from "../../../service/log";
import { EventEmitter } from "events";
import { IInstanceProcess } from "../../instance/interface";
import fs from "fs-extra";
import { t } from "i18next";
import DockerPullCommand from "./docker_pull";
import {
  DockerProcessAdapter,
  SetupDockerContainer,
  StartupDockerProcessError
} from "../../../service/docker_process_service";

export default class DockerStartCommand extends InstanceCommand {
  constructor() {
    super("DockerStartCommand");
  }

  async exec(instance: Instance, source = "Unknown") {
    if (!instance.config.cwd || !instance.config.ie || !instance.config.oe)
      throw new StartupDockerProcessError($t("TXT_CODE_instance.dirEmpty"));
    if (!fs.existsSync(instance.absoluteCwdPath()))
      throw new StartupDockerProcessError($t("TXT_CODE_instance.dirNoE"));

    // Docker Image check
    try {
      await instance.forceExec(new DockerPullCommand());
    } catch (error: any) {
      throw error;
    }

    const containerWrapper = new SetupDockerContainer(instance);
    await containerWrapper.start();

    // Docker docks to the process adapter
    const isTty = instance.config.terminalOption.pty;
    const workingDir = instance.config.docker.workingDir ?? "/workspace/";
    const processAdapter = new DockerProcessAdapter(containerWrapper.getContainer());
    await processAdapter.start({
      isTty,
      w: instance.config.terminalOption.ptyWindowCol,
      h: instance.config.terminalOption.ptyWindowCol
    });

    instance.println("CONTAINER", t("TXT_CODE_e76e49e9") + workingDir);
    instance.started(processAdapter);
    logger.info(
      $t("TXT_CODE_instance.successful", {
        v: `${instance.config.nickname} ${instance.instanceUuid}`
      })
    );
  }
}
