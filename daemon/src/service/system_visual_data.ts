import { systemInfo } from "common";

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

class VisualDataSubsystem {
  public readonly countMap: Map<string, number> = new Map<string, number>();

  public readonly systemChart = new LineQueue<ISystemChartInfo>(200, { cpu: 0, mem: 0 });

  private requestCount = 0;

  constructor() {
    setInterval(() => {
      const info = systemInfo();
      if (info) {
        this.systemChart.push({
          cpu: Number((info.cpuUsage * 100).toFixed(0)),
          mem: Number((info.memUsage * 100).toFixed(0))
        });
      } else {
        this.systemChart.push({
          cpu: 0,
          mem: 0
        });
      }
    }, 1000 * 3);
  }

  addRequestCount() {
    this.requestCount++;
  }

  getSystemChartArray() {
    return this.systemChart.getArray();
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
  }
}

export default new VisualDataSubsystem();
