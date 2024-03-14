import { logger } from "./log";
import { systemInfo } from "common";
import RemoteServiceSubsystem from "./remote_service";
import RemoteRequest from "./remote_command";

// Visual data subsystem: responsible for collecting system data and event data, and providing some methods to display them
class LineQueue<T> {
  private readonly arr = new Array<T>();

  constructor(public readonly maxSize: number, defaultValue: T) {
    for (let index = 0; index < maxSize; index++) {
      this.arr.push(defaultValue);
    }
  }

  push(data: T) {
    if (this.arr.length < this.maxSize) {
      this.arr.push(data);
    } else {
      this.arr.shift();
      this.arr.push(data);
    }
  }

  getArray() {
    return this.arr;
  }
}

interface ISystemChartInfo {
  cpu: number;
  mem: number;
}

interface IWebChartInfo {
  value: number;
  totalInstance: number;
  runningInstance: number;
}

class VisualDataSubsystem {
  public readonly countMap: Map<string, number> = new Map<string, number>();

  // system information table
  public readonly systemChart = new LineQueue<ISystemChartInfo>(60, { cpu: 0, mem: 0 });
  // panel state table
  public readonly statusChart = new LineQueue<IWebChartInfo>(60, {
    value: 0,
    totalInstance: 0,
    runningInstance: 0
  });

  // request count counter
  private requestCount = 0;

  constructor() {
    // system information table
    setInterval(() => {
      const info = systemInfo();
      if (info) {
        this.systemChart.push({
          cpu: Number((info.cpuUsage * 100).toFixed(1)),
          mem: Number((info.memUsage * 100).toFixed(1))
        });
      } else {
        this.systemChart.push({
          cpu: 0,
          mem: 0
        });
      }
    }, 1000 * 10);

    // state table
    setInterval(async () => {
      // Calculate the total number of instances and the number of running instances
      const remoteInfoList = new Array();
      for (const iterator of RemoteServiceSubsystem.services.entries()) {
        try {
          remoteInfoList.push(await new RemoteRequest(iterator[1]).request("info/overview"));
        } catch (err) {}
      }
      let totalInstance = 0;
      let runningInstance = 0;
      for (const iterator of remoteInfoList) {
        if (iterator.instance) {
          totalInstance += iterator.instance.total;
          runningInstance += iterator.instance.running;
        }
      }
      this.statusChart.push({
        value: this.requestCount,
        totalInstance,
        runningInstance
      });
      this.requestCount = 0;
    }, 1000 * 10);
  }

  addRequestCount() {
    this.requestCount++;
  }

  getSystemChartArray() {
    return this.systemChart.getArray();
  }

  getStatusChartArray() {
    return this.statusChart.getArray();
  }

  // Trigger counting event
  emitCountEvent(eventName: string) {
    const v = this.countMap.get(eventName);
    if (v) {
      this.countMap.set(eventName, v + 1);
    } else {
      this.countMap.set(eventName, 1);
    }
  }

  // Trigger counting event
  eventCount(eventName: string) {
    return this.countMap.get(eventName);
  }

  // Trigger log event
  emitLogEvent(eventName: string, source: any) {
    const time = new Date().toLocaleString();
    logger.info(`The object [${source}] triggered the [${eventName}] event at ${time}`);
  }
}

export default new VisualDataSubsystem();
