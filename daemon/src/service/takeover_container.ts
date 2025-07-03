import { DefaultDocker } from "./docker_service";
import InstanceSubsystem from "./system_instance";
import DockerTakeoverCommand from "../entity/commands/docker/docker_takeover";

export default async function takeoverContainer() {
  const docker = new DefaultDocker();
  const uuids = (await docker.listContainers())
    .map((container) => {
      const label = container.Labels["mcsmanager.instance.uuid"];
      if (label == null || container.Status != "running") {
        return null;
      }
      return label;
    })
    .filter((c) => c != null);

  for (const uuid of uuids) {
    const instance = InstanceSubsystem.getInstance(uuid!);
    if (instance && instance.config.processType == "docker") {
      await instance.forceExec(new DockerTakeoverCommand());
    }
  }
}
