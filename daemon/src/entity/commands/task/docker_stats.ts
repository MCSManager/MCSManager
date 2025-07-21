import Dockerode from "dockerode";
import { DefaultDocker } from "../../../service/docker_service";
import Instance from "../../instance/instance";
import { ILifeCycleTask } from "../../instance/life_cycle";

export default class DockerStatsTask implements ILifeCycleTask {
  private static defaultDocker = new DefaultDocker();

  public status: number = 0;
  public name: string = "DockerStats";

  private getNetworkInterface(stats: Dockerode.NetworkStats) {
    let networkInterface = stats?.["eth0"];
    if (!networkInterface) {
      for (const key in stats.networks) {
        if (key.startsWith("eth")) {
          networkInterface = stats[key];
          break;
        }
      }
    }
    if (!networkInterface) {
      const networkKeys = Object.keys(stats.networks).filter((v) => !v.startsWith("lo0"));
      networkInterface = stats[networkKeys?.[0]] ?? undefined;
    }

    const rxBytes = networkInterface?.rx_bytes
      ? Math.ceil(Number(networkInterface.rx_bytes) / 1024 / 1024)
      : undefined;
    const txBytes = networkInterface?.tx_bytes
      ? Math.ceil(Number(networkInterface.tx_bytes) / 1024 / 1024)
      : undefined;
    return {
      rxBytes,
      txBytes
    };
  }

  private getCpuUsage(stats: Dockerode.ContainerStats) {
    if (!stats?.cpu_stats?.cpu_usage) return undefined;
    const cpuDelta =
      stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemCpuDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    let numberCpus = 1;
    if (Array.isArray(stats.cpu_stats.cpu_usage.percpu_usage)) {
      numberCpus = stats.cpu_stats.cpu_usage.percpu_usage.length;
    } else if (typeof stats.cpu_stats.online_cpus === "number") {
      numberCpus = stats.cpu_stats.online_cpus;
    }
    if (systemCpuDelta > 0 && cpuDelta > 0) {
      return Math.ceil((cpuDelta / systemCpuDelta) * numberCpus * 100.0);
    }
    return 0;
  }

  async start(instance: Instance) {
    const containerId = String(instance.process?.pid ?? "");
    if (!containerId) return;
    if (!instance.config.docker?.image || instance.config.processType !== "docker") return;

    try {
      const container = await DockerStatsTask.defaultDocker.getContainer(containerId);
      const stats = await container.stats({ stream: false });
      const { rxBytes, txBytes } = this.getNetworkInterface(stats.networks);

      const memoryUsage = stats.memory_stats.usage - stats.memory_stats.stats.cache;
      const memoryUsagePercent = (memoryUsage / stats.memory_stats.limit) * 100;

      const result = {
        cpuUsage: this.getCpuUsage(stats),
        rxBytes,
        txBytes,
        memoryUsage: memoryUsagePercent
      };
      instance.info = { ...instance.info, ...result };
    } catch (error) {
      // ignore error
    }
  }

  async stop(instance: Instance) {
    instance.info = {
      ...instance.info,
      cpuUsage: undefined,
      rxBytes: undefined,
      txBytes: undefined,
      memoryUsage: undefined
    };
  }
}
