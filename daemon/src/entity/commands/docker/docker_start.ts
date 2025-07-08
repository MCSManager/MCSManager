import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import logger from "../../../service/log";
import fs from "fs-extra";
import DockerPullCommand from "./docker_pull";
import {
  DockerProcessAdapter,
  SetupDockerContainer,
  StartupDockerProcessError
} from "../../../service/docker_process_service";
import AbsStartCommand from "../start";

export default class DockerStartCommand extends AbsStartCommand {
  protected async createProcess(instance: Instance) {
    if (!instance.hasCwdPath() || !instance.config.ie || !instance.config.oe)
      throw new StartupDockerProcessError($t("TXT_CODE_a6424dcc"));
    if (!fs.existsSync(instance.absoluteCwdPath())) fs.mkdirpSync(instance.absoluteCwdPath());

    // Docker Image check
    try {
      await instance.forceExec(new DockerPullCommand());
    } catch (error: any) {
      throw error;
    }

    // Docker docks to the process adapter
    const processAdapter = new DockerProcessAdapter(new SetupDockerContainer(instance));
    await processAdapter.start({
      isTty: instance.config.terminalOption.pty,
      w: instance.config.terminalOption.ptyWindowCol,
      h: instance.config.terminalOption.ptyWindowRow
    });

    instance.started(processAdapter);
    logger.info(
      $t("TXT_CODE_instance.successful", {
        v: `${instance.config.nickname} ${instance.instanceUuid}`
      })
    );
  }
}
