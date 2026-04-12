import fs from "fs";
import os from "os";

export interface IProcessRuntimeSnapshot {
  pid?: number | string;
  cpuPercent?: number;
  memoryBytes?: number;
  memoryPercent?: number;
}

const DEFAULT_PAGE_SIZE = 4096;
const LINUX_CLOCK_TICKS = 100;

class LinuxProcessMonitor {
  private readonly lastSampleMap = new Map<number, { processTicks: number; uptime: number }>();

  sample(pid?: number | string): IProcessRuntimeSnapshot {
    const numericPid = Number(pid);
    if (!pid || Number.isNaN(numericPid) || numericPid <= 0) return {};
    if (process.platform !== "linux") return { pid: numericPid };

    try {
      const statRaw = fs.readFileSync(`/proc/${numericPid}/stat`, "utf-8");
      const uptimeRaw = fs.readFileSync("/proc/uptime", "utf-8");
      const closeBracketIndex = statRaw.lastIndexOf(")");
      const statTokens = statRaw.slice(closeBracketIndex + 2).trim().split(/\s+/);
      const processTicks = Number(statTokens[11]) + Number(statTokens[12]);
      const rssPages = Number(statTokens[21]);
      const uptime = Number((uptimeRaw.split(/\s+/)[0] || "0").trim());
      const memoryBytes = rssPages * DEFAULT_PAGE_SIZE;
      const previous = this.lastSampleMap.get(numericPid);

      let cpuPercent = 0;
      if (previous && uptime > previous.uptime) {
        const deltaTicks = processTicks - previous.processTicks;
        const deltaSeconds = uptime - previous.uptime;
        const rawCpuPercent =
          ((deltaTicks / LINUX_CLOCK_TICKS) / deltaSeconds / Math.max(1, os.cpus().length)) * 100;
        cpuPercent = Number.isFinite(rawCpuPercent) ? Math.max(0, rawCpuPercent) : 0;
      }

      this.lastSampleMap.set(numericPid, {
        processTicks,
        uptime
      });

      return {
        pid: numericPid,
        cpuPercent: Number(cpuPercent.toFixed(1)),
        memoryBytes,
        memoryPercent: Number(((memoryBytes / os.totalmem()) * 100).toFixed(1))
      };
    } catch (error) {
      return {
        pid: numericPid
      };
    }
  }
}

export default new LinuxProcessMonitor();
