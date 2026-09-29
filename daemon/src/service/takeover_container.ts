/**
 * MANDATORY TEST GATE — DO NOT MODIFY WITHOUT RE-RUNNING THE INTEGRATION TESTS.
 *
 * This service is exercised by the real instance/Docker integration suite in
 * `src/routers/Instance_router.integration.test.ts` (real Docker containers).
 * Any change here can break container takeover / cleanup.
 *
 * After editing this file, AI assistants and developers MUST run the
 * `mcsmanager-docker-instance-test` skill and confirm the Docker + instance
 * cases pass before finishing.
 *   Skill: `.agents/skills/mcsmanager-docker-instance-test/SKILL.md`
 */
import { ContainerInfo } from "dockerode";
import DockerTakeoverCommand from "../entity/commands/docker/docker_takeover";
import { DefaultDocker } from "./docker_service";
import InstanceSubsystem from "./system_instance";

async function killContainer(containerInfo: ContainerInfo) {
  const docker = new DefaultDocker();
  const container = docker.getContainer(containerInfo.Id);
  container.kill().catch(() => {});
  container.remove().catch(() => {});
}

export default async function takeoverContainer() {
  const docker = new DefaultDocker();
  const containers = new Map<string, ContainerInfo>();
  (await docker.listContainers()).forEach((containerInfo) => {
    const label = containerInfo.Labels["mcsmanager.instance.uuid"];
    if (label == null) {
      return;
    }
    if (containers.has(label)) {
      return; // Skip if already exists
    }
    containers.set(label, containerInfo);
  });

  for (const item of containers) {
    const [uuid, container] = item;
    const instance = InstanceSubsystem.getInstance(uuid);
    try {
      if (instance && instance.config.processType == "docker") {
        await instance.forceExec(new DockerTakeoverCommand(container));
      }
    } catch (e) {
      docker.getContainer(container.Id).kill();
      killContainer(container);
      throw e;
    }
  }
}
