import Dockerode from "dockerode";
import { DefaultDocker } from "../../../service/docker_service";
import Instance from "../../instance/instance";
import { ILifeCycleTask } from "../../instance/life_cycle";

export default class DockerStatsTask implements ILifeCycleTask {
  private static defaultDocker = new DefaultDocker();

  public status: number = 0;
  public name: string = "DockerStats";
  private task: NodeJS.Timeout | null = null;
  private lastStatsMap: Map<string, { [key: string]: number | undefined; timestamp: number }> =
    new Map();

  private calculateRealTimeRate<T extends Record<string, number | undefined>>(
    currentValues: T,
    statsName: string
  ): T {
    const currentTimestamp = Date.now();
    const result = {} as T;
    const lastStats = this.lastStatsMap.get(statsName);

    if (lastStats) {
      const timeDelta = (currentTimestamp - lastStats.timestamp) / 1000;

      if (timeDelta > 0) {
        for (const key in currentValues) {
          const currentValue = currentValues[key];
          const lastValue = lastStats[key];

          if (currentValue !== undefined && lastValue !== undefined) {
            result[key] = Math.max(0, (currentValue - lastValue) / timeDelta) as T[Extract<
              keyof T,
              string
            >];
          }
        }
      }
    }

    this.lastStatsMap.set(statsName, {
      ...currentValues,
      timestamp: currentTimestamp
    });

    return result;
  }

  private getNetworkInterface(networks?: Dockerode.NetworkStats) {
    // If networks is not available (e.g., in host network mode), return undefined values
    if (!networks || typeof networks !== "object") {
      return {
        rxBytes: undefined,
        txBytes: undefined
      };
    }

    let networkInterface = networks?.["eth0"];
    if (!networkInterface) {
      for (const key in networks) {
        if (key.startsWith("eth")) {
          networkInterface = networks[key];
          break;
        }
      }
    }
    if (!networkInterface) {
      const networkKeys = Object.keys(networks).filter((v) => !v.startsWith("lo"));
      networkInterface = networks[networkKeys?.[0]] ?? undefined;
    }

    const currentValues = {
      rxBytes: networkInterface?.rx_bytes ?? undefined,
      txBytes: networkInterface?.tx_bytes ?? undefined
    };

    return this.calculateRealTimeRate(currentValues, "network");
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

  async updateStats(containerId: string, instance: Instance) {
    try {
      const container = DockerStatsTask.defaultDocker.getContainer(containerId);
      const stats = await container.stats({ stream: false });
      
      // Get network stats separately to avoid blocking other stats on failure
      let rxBytes: number | undefined = undefined;
      let txBytes: number | undefined = undefined;
      
      try {
        const networkStats = this.getNetworkInterface(stats.networks);
        rxBytes = networkStats.rxBytes;
        txBytes = networkStats.txBytes;
      } catch (error) {
        // Network stats may not be available in host mode, continue with other stats
      }

      const memoryUsage = stats.memory_stats.usage - (stats.memory_stats.stats.cache ?? 0);
      const memoryUsagePercent = Math.ceil((memoryUsage / stats.memory_stats.limit) * 100);

      const result = {
        cpuUsage: this.getCpuUsage(stats),
        rxBytes,
        txBytes,
        memoryUsagePercent,
        memoryUsage,
        memoryLimit: stats.memory_stats.limit
      };
      instance.info = { ...instance.info, ...result };
    } catch (error) {
      // ignore error
    }
  }

  async start(instance: Instance) {
    const containerId = String(instance.process?.pid ?? "");
    if (!containerId) return;
    if (!instance.config.docker?.image || instance.config.processType !== "docker") return;
    this.task = setInterval(() => {
      this.updateStats(containerId, instance);
    }, 4000);
  }

  async stop(instance: Instance) {
    if (this.task) {
      clearInterval(this.task);
      this.task = null;
    }
    this.lastStatsMap.clear();
    instance.info = {
      ...instance.info,
      cpuUsage: undefined,
      rxBytes: undefined,
      txBytes: undefined,
      memoryUsagePercent: undefined,
      readBytes: undefined,
      writeBytes: undefined
    };
  }
}
