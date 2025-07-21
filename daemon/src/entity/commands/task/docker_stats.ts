import Dockerode from "dockerode";
import { DefaultDocker } from "../../../service/docker_service";
import Instance from "../../instance/instance";
import { ILifeCycleTask } from "../../instance/life_cycle";

export default class DockerStatsTask implements ILifeCycleTask {
  private static defaultDocker = new DefaultDocker();

  public status: number = 0;
  public name: string = "DockerStats";
  private task: NodeJS.Timeout | null = null;
  private lastDiskStats: { readBytes?: number; writeBytes?: number; timestamp: number } | null =
    null;
  private lastNetworkStats: { rxBytes?: number; txBytes?: number; timestamp: number } | null = null;

  private calculateRealTimeRate<T extends Record<string, number | undefined>>(
    currentValues: T,
    lastStats: (Partial<T> & { timestamp: number }) | null,
    updateLastStats: (newStats: { timestamp: number } & T) => void
  ): T {
    const currentTimestamp = Date.now();
    const result = {} as T;

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

    updateLastStats({
      ...currentValues,
      timestamp: currentTimestamp
    });

    return result;
  }

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

    const currentValues = {
      rxBytes: networkInterface?.rx_bytes ?? undefined,
      txBytes: networkInterface?.tx_bytes ?? undefined
    };

    return this.calculateRealTimeRate(currentValues, this.lastNetworkStats, (newStats) => {
      this.lastNetworkStats = newStats;
    });
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

  private findIoStatValue = (stats: Dockerode.BlkioStatEntry[], op: string) =>
    stats.find((stat) => stat.op === op)?.value;

  private getDiskIO(stats: Dockerode.ContainerStats) {
    const ioStats = stats.blkio_stats;
    if (!ioStats?.io_service_bytes_recursive)
      return {
        readBytes: undefined,
        writeBytes: undefined
      };

    const currentValues = {
      readBytes: this.findIoStatValue(ioStats.io_service_bytes_recursive, "read"),
      writeBytes: this.findIoStatValue(ioStats.io_service_bytes_recursive, "write")
    };

    return this.calculateRealTimeRate(currentValues, this.lastDiskStats, (newStats) => {
      this.lastDiskStats = newStats;
    });
  }

  async updateStats(containerId: string, instance: Instance) {
    try {
      const container = DockerStatsTask.defaultDocker.getContainer(containerId);
      const stats = await container.stats({ stream: false });
      const { rxBytes, txBytes } = this.getNetworkInterface(stats.networks);
      const { readBytes, writeBytes } = this.getDiskIO(stats);

      const memoryUsage = stats.memory_stats.usage - (stats.memory_stats.stats.cache ?? 0);
      const memoryUsagePercent = Math.ceil((memoryUsage / stats.memory_stats.limit) * 100);

      const result = {
        cpuUsage: this.getCpuUsage(stats),
        rxBytes,
        txBytes,
        memoryUsagePercent,
        readBytes,
        writeBytes
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
    }, 3000);
  }

  async stop(instance: Instance) {
    if (this.task) {
      clearInterval(this.task);
      this.task = null;
    }
    this.lastDiskStats = null;
    this.lastNetworkStats = null;
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
