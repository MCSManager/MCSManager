import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import logger from "../../../service/log";
import fs from "fs-extra";
import DockerPullCommand from "./docker_pull";
import {
  DockerProcessAdapter,
  SetupDockerContainer,
  StartupDockerProcessError
} from "../../../service/docker_process_service";
import AbsStartCommand from "../start";
import { DefaultDocker } from "../../../service/docker_service";

export default class DockerTakeoverCommand extends AbsStartCommand {
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
    try {
      const docker = new DefaultDocker();
      const containers = (await docker.listContainers())
        .map((container) => {
          const label = container.Labels["mcsmanager.instance.uuid"];
          if (label == null) {
            return null;
          }
          return {
            uuid: label,
            container: container
          };
        })
        .filter((c) => c != null && c.uuid == instance.instanceUuid);
      if (containers.length > 0) {
        await processAdapter.start(
          {
            isTty: instance.config.terminalOption.pty,
            w: instance.config.terminalOption.ptyWindowCol,
            h: instance.config.terminalOption.ptyWindowCol
          },
          docker.getContainer(containers[0]!!.container.Id) // throw error if not found, and catch later
        );
      }
    } catch (e) {
      throw new StartupDockerProcessError($t("容器接管失败"));
    }

    instance.started(processAdapter);
    logger.info(
      $t("TXT_CODE_instance.successful", {
        v: `${instance.config.nickname} ${instance.instanceUuid}`
      })
    );
  }
}
