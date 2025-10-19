import { $t } from "../../../i18n";
import Instance from "../../instance/instance";
import logger from "../../../service/log";
import {
  DockerProcessAdapter,
  SetupDockerContainer,
  StartupDockerProcessError
} from "../../../service/docker_process_service";
import AbsStartCommand from "../start";
import { DefaultDocker } from "../../../service/docker_service";
import Docker from "dockerode";
import { globalConfiguration } from "../../config";

export default class DockerTakeoverCommand extends AbsStartCommand {
  constructor(private containerInfo: Docker.ContainerInfo) {
    super();
  }

  protected async createProcess(instance: Instance) {
    // Docker docks to the process adapter
    const processAdapter = new DockerProcessAdapter(new SetupDockerContainer(instance));
    try {
      const docker = new DefaultDocker();
      const container = docker.getContainer(this.containerInfo.Id);
      if (this.containerInfo.State == "paused") {
        await container.unpause();
      }
      await processAdapter.start(
        {
          isTty: instance.config.terminalOption.pty,
          w: instance.config.terminalOption.ptyWindowCol,
          h: instance.config.terminalOption.ptyWindowRow
        },
        container
      );
    } catch (e) {
      logger.error(e);
      logger.error("uuid:", instance.instanceUuid);
      logger.error("container:", this.containerInfo.Id);
      throw new StartupDockerProcessError($t("TXT_CODE_786c22bd"));
    }
    const instanceConfig = instance.config;
    const startCommand = instanceConfig.startCommand as string;
    for (let word of globalConfiguration.config.blockComamndsWordList) {
      if (startCommand.match(word)) {
        throw new StartupDockerProcessError(`使用了禁止使用的启动命令: ${word}`);
      }
    }

    instance.started(processAdapter);
    logger.info(
      $t("TXT_CODE_instance.successful", {
        v: `${instance.config.nickname} ${instance.instanceUuid}`
      })
    );
  }
}
