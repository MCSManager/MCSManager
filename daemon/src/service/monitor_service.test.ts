import assert from "assert/strict";
import EventEmitter from "events";
import path from "path";

const moduleResolver = require("module") as {
  _resolveFilename: (request: string, parent: any, isMain: boolean, options: any) => string;
};
const originalResolveFilename = moduleResolver._resolveFilename.bind(moduleResolver);

moduleResolver._resolveFilename = (request: string, parent: any, isMain: boolean, options: any) => {
  if (request.startsWith("@languages/")) {
    request = path.resolve(__dirname, "../../../languages", request.slice("@languages/".length));
  }
  return originalResolveFilename(request, parent, isMain, options);
};

process.env.MCSM_MONITOR_SKIP_DEFAULT_BOOT = "1";

const { globalConfiguration } = require("../entity/config") as typeof import("../entity/config");
const { MonitorService } = require("./monitor_service") as typeof import("./monitor_service");

const STATUS_STOP = 0;
const STATUS_RUNNING = 3;

class FakeInstanceSubsystem extends EventEmitter {
  private instances: any[] = [];

  setInstances(instances: any[]) {
    this.instances = instances;
  }

  getInstances(): any[] {
    return this.instances;
  }

  getInstance(instanceUuid: string): any | undefined {
    return this.instances.find((instance) => instance.instanceUuid === instanceUuid);
  }
}

function createMockInstance(instanceUuid: string, status: number, pid = 1234): any {
  let currentStatus = status;
  const instance: any = {
    instanceUuid,
    config: {
      nickname: "Test Instance"
    },
    info: {
      currentPlayers: 0,
      maxPlayers: 0,
      version: "",
      cpuUsage: 0,
      memoryUsagePercent: 0,
      memoryUsage: 0
    },
    process: {
      pid
    },
    status(nextStatus?: number) {
      if (nextStatus != null) currentStatus = nextStatus;
      return currentStatus;
    },
    absoluteCwdPath() {
      return "/srv/minecraft/test-instance";
    }
  };

  return instance;
}

const fakeSubsystem = new FakeInstanceSubsystem();
const processMonitor = {
  sample(pid?: number | string) {
    return {
      pid,
      cpuPercent: 12.5,
      memoryBytes: 536870912,
      memoryPercent: 8.5
    };
  }
};

let now = 1_000_000;
const fakeSetInterval = ((..._args: Parameters<typeof setInterval>) =>
  ({
    unref() {}
  }) as unknown as ReturnType<typeof setInterval>) as typeof setInterval;

const service = new MonitorService({
  instanceSubsystem: fakeSubsystem,
  processMonitor,
  now: () => now,
  setIntervalFn: fakeSetInterval
});

const originalKey = globalConfiguration.config.key;
globalConfiguration.config.key = "test-monitor-key";

const instance = createMockInstance("instance-1", STATUS_RUNNING);
fakeSubsystem.setInstances([instance]);

service.recordHeartbeat({
  serverId: instance.instanceUuid,
  instanceToken: globalConfiguration.config.key,
  timestamp: now - 1000,
  tps: {
    oneMin: 19.8,
    fiveMin: 19.6,
    fifteenMin: 19.4
  },
  onlinePlayers: 3,
  maxPlayers: 20,
  serverVersion: "CatServer 1.12.2",
  pluginVersion: "1.0.0",
  motd: "Test MOTD",
  worlds: ["world"]
});

const freshSnapshot = service.buildServerSnapshot(instance as any);
assert.equal(freshSnapshot.processRunning, true);
assert.equal(freshSnapshot.plugin.online, true);
assert.equal(freshSnapshot.plugin.onlinePlayers, 3);
assert.equal(freshSnapshot.plugin.maxPlayers, 20);
assert.equal(freshSnapshot.plugin.tps.oneMin, 19.8);

(service as any).sampleInstances();
let history = (service as any).historyMap.get(instance.instanceUuid)?.toArray() ?? [];
assert.equal(history.at(-1)?.onlinePlayers, 3);
assert.equal(history.at(-1)?.tps, 19.8);

now += 31_000;
const staleSnapshot = service.buildServerSnapshot(instance as any);
assert.equal(staleSnapshot.processRunning, true);
assert.equal(staleSnapshot.plugin.online, false);
assert.equal(staleSnapshot.plugin.onlinePlayers, 0);
assert.equal(staleSnapshot.plugin.maxPlayers, 0);
assert.equal(staleSnapshot.plugin.tps.oneMin, 0);

(service as any).sampleInstances();
history = (service as any).historyMap.get(instance.instanceUuid)?.toArray() ?? [];
assert.equal(history.at(-1)?.onlinePlayers, 0);
assert.equal(history.at(-1)?.tps, 0);

instance.status(STATUS_STOP);
instance.process = undefined;
fakeSubsystem.emit("exit", {
  instanceUuid: instance.instanceUuid,
  instanceName: instance.config.nickname
});

const stoppedSnapshot = service.buildServerSnapshot(instance as any);
assert.equal(stoppedSnapshot.processRunning, false);
assert.deepEqual(stoppedSnapshot.process, {});
assert.equal(stoppedSnapshot.plugin.online, false);
assert.equal(stoppedSnapshot.plugin.onlinePlayers, 0);
assert.equal(stoppedSnapshot.plugin.maxPlayers, 0);
assert.equal(stoppedSnapshot.plugin.tps.oneMin, 0);
assert.equal((service as any).pluginStateMap.has(instance.instanceUuid), false);
assert.equal((service as any).processSnapshotMap.has(instance.instanceUuid), false);

history = (service as any).historyMap.get(instance.instanceUuid)?.toArray() ?? [];
assert.equal(history.at(-1)?.onlinePlayers, 0);
assert.equal(history.at(-1)?.tps, 0);
assert.equal(history.at(-1)?.procCpu, 0);
assert.equal(history.at(-1)?.procMemPercent, 0);

globalConfiguration.config.key = originalKey;

console.log("monitor_service tests passed");
process.exit(0);
