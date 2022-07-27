/*
  Copyright (C) 2022 https://github.com/mcsmanager team.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  可视化数据子系统：负责收集系统数据和事件数据，并且提供一些方法展示出来
*/
import { logger } from "./log";
import { systemInfo } from "../common/system_info";
import RemoteServiceSubsystem from "../service/system_remote_service";
import RemoteRequest from "./remote_command";

class LineQueue<T> {
  private readonly arr = new Array<T>();

  constructor(public readonly maxSize: number, defaultValue?: T) {
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

  // 系统信息表
  public readonly systemChart = new LineQueue<ISystemChartInfo>(60, { cpu: 0, mem: 0 });
  // 面板状态表
  public readonly statusChart = new LineQueue<IWebChartInfo>(60, {
    value: 0,
    totalInstance: 0,
    runningInstance: 0
  });

  // 请求次数计数器
  private requestCount = 0;

  constructor() {
    // 系统信息表
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

    // 状态表
    setInterval(async () => {
      // 计算总实例与运行实例数
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
