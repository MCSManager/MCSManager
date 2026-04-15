import type { AppConfig, McsmMonitorOverviewResponse } from "./types.js";

export function createTestConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    panelBaseUrl: "http://127.0.0.1:23333/api",
    apiKey: "test-api-key",
    confirmationTtlMs: 60000,
    requestTimeoutMs: 5000,
    allowedInstanceCommands: [],
    alertEnabled: false,
    alertPushUrl: undefined,
    alertPollIntervalMs: 60000,
    ...overrides
  };
}

export function createOverviewFixture(): McsmMonitorOverviewResponse {
  return {
    generatedAt: 1000,
    summary: {
      nodesTotal: 2,
      nodesOnline: 1,
      serversTotal: 3,
      serversRunning: 1,
      pluginOnline: 1
    },
    nodes: [
      {
        daemonId: "daemon-a",
        daemonIp: "10.0.0.1",
        daemonPort: 24444,
        daemonPrefix: "",
        daemonRemarks: "A节点",
        available: true,
        host: {
          cpuPercent: 12.3,
          memPercent: 45.6,
          totalmem: 17179869184,
          freemem: 8589934592,
          hostname: "node-a",
          platform: "linux",
          loadavg: [0.1, 0.2, 0.3],
          primaryDisk: {
            mount: "/",
            device: "/dev/sda1",
            totalBytes: 1000,
            usedBytes: 600,
            freeBytes: 400,
            usagePercent: 60
          },
          disks: []
        },
        servers: []
      },
      {
        daemonId: "daemon-b",
        daemonIp: "10.0.0.2",
        daemonPort: 24444,
        daemonPrefix: "",
        daemonRemarks: "B节点",
        available: false,
        servers: []
      }
    ],
    servers: [
      {
        serverId: "uuid-ce1",
        instanceId: "uuid-ce1",
        instanceName: "ce1",
        daemonTime: 1000,
        status: 3,
        statusText: "running",
        processRunning: true,
        process: {
          pid: 123,
          cpuPercent: 10,
          memoryBytes: 1073741824,
          memoryPercent: 20
        },
        plugin: {
          online: true,
          worlds: ["world"],
          mainThreadBlocked: false,
          tps: { oneMin: 20, fiveMin: 19.9, fifteenMin: 19.8 },
          onlinePlayers: 2,
          maxPlayers: 100
        },
        history: [],
        daemonId: "daemon-a",
        daemonRemarks: "A节点",
        daemonIp: "10.0.0.1",
        daemonPort: 24444,
        daemonPrefix: "",
        daemonAvailable: true
      },
      {
        serverId: "uuid-ce2",
        instanceId: "uuid-ce2",
        instanceName: "ce2",
        daemonTime: 1000,
        status: 0,
        statusText: "stopped",
        processRunning: false,
        process: {},
        plugin: {
          online: false,
          worlds: [],
          mainThreadBlocked: false,
          tps: { oneMin: 0, fiveMin: 0, fifteenMin: 0 },
          onlinePlayers: 0,
          maxPlayers: 0
        },
        history: [],
        daemonId: "daemon-a",
        daemonRemarks: "A节点",
        daemonIp: "10.0.0.1",
        daemonPort: 24444,
        daemonPrefix: "",
        daemonAvailable: true
      },
      {
        serverId: "uuid-copy",
        instanceId: "uuid-copy",
        instanceName: "ce1-copy",
        daemonTime: 1000,
        status: 0,
        statusText: "stopped",
        processRunning: false,
        process: {},
        plugin: {
          online: false,
          worlds: [],
          mainThreadBlocked: false,
          tps: { oneMin: 0, fiveMin: 0, fifteenMin: 0 },
          onlinePlayers: 0,
          maxPlayers: 0
        },
        history: [],
        daemonId: "daemon-b",
        daemonRemarks: "B节点",
        daemonIp: "10.0.0.2",
        daemonPort: 24444,
        daemonPrefix: "",
        daemonAvailable: false
      }
    ]
  };
}
