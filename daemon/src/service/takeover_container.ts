import { DefaultDocker } from "./docker_service";
import InstanceSubsystem from "./system_instance";
import DockerTakeoverCommand from "../entity/commands/docker/docker_takeover";
import { ContainerInfo } from "dockerode";

export default async function takeoverContainer() {
  const docker = new DefaultDocker();
  const containers = new Map<string, ContainerInfo>();
  (await docker.listContainers()).forEach((container) => {
    const label = container.Labels["mcsmanager.instance.uuid"];
    if (label == null) {
      return;
    }
    if (containers.has(label)) {
      return; // Skip if already exists
    }
    containers.set(label, container);
  });

  for (const c of containers) {
    const [uuid, container] = c;
    const instance = InstanceSubsystem.getInstance(uuid);
    if (instance && instance.config.processType == "docker") {
      await instance.forceExec(new DockerTakeoverCommand(container));
    }
  }
}
