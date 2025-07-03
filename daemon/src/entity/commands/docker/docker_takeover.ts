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

export default class DockerTakeoverCommand extends AbsStartCommand {
  protected async createProcess(instance: Instance) {
    // Docker docks to the process adapter
    const processAdapter = new DockerProcessAdapter(new SetupDockerContainer(instance));
    try {
      const docker = new DefaultDocker();
      const containers = (await docker.listContainers())
        .map((container) => {
          const label = container.Labels["mcsmanager.instance.uuid"];
          if (label == null || container.Status != "running") {
            return null;
          }
          return {
            uuid: label,
            container: container
          };
        })
        .filter((c) => c?.uuid == instance.instanceUuid);
      if (containers.length > 0) {
        await processAdapter.start(
          {
            isTty: instance.config.terminalOption.pty,
            w: instance.config.terminalOption.ptyWindowCol,
            h: instance.config.terminalOption.ptyWindowRow
          },
          docker.getContainer(containers[0]!.container.Id) // throw error if not found, and catch later
        );
      }
    } catch (e) {
      logger.error(e);
      logger.error("uuid:", instance.instanceUuid);
      logger.error("container:", instance.instanceUuid);
      throw new StartupDockerProcessError($t("TXT_CODE_786c22bd"));
    }

    instance.started(processAdapter);
    logger.info(
      $t("TXT_CODE_instance.successful", {
        v: `${instance.config.nickname} ${instance.instanceUuid}`
      })
    );
  }
}
