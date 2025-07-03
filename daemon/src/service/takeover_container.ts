import { DefaultDocker } from "./docker_service";
import Docker from "dockerode";
import InstanceSubsystem from "./system_instance";
import DockerTakeoverCommand from "../entity/commands/docker/docker_takeover";

export default async function takeoverContainer() {
  const docker = new DefaultDocker();
  const option: Docker.ContainerListOptions = {
    all: true
  };
  const uuids = (await docker.listContainers(option))
    .map((container) => {
      const label = container.Labels["mcsmanager.instance.uuid"];
      if (label == null) {
        return null;
      }
      if (container.Status != "running") {
        docker
          .getContainer(container.Id)
          .remove()
          .catch(() => {});
      }
      return label;
    })
    .filter((c) => c != null);

  uuids.forEach((uuid) => {
    const instance = InstanceSubsystem.getInstance(uuid!!);
    if (instance && instance.config.processType == "docker") {
      instance.forceExec(new DockerTakeoverCommand());
    }
  });
}
