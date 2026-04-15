import { monitorOverview } from "@/services/apis";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { t } from "@/lang/i18n";
import { formatMemoryUsage } from "@/tools/memory";
import { parseTimestamp } from "@/tools/time";
import { INSTANCE_STATUS, INSTANCE_STATUS_CODE } from "@/types/const";
import type { ControlDashboardMetaItem, ControlDashboardMetric, ControlTarget } from "@/types/control";
import { computed, onMounted, onUnmounted, ref, watch, type Ref } from "vue";

const DASHBOARD_REFRESH_INTERVAL_MS = 5000;
const GIB = 1024 ** 3;
const TIB = 1024 ** 4;

type MonitorServerRecord = IMcsmMonitorOverviewResponse["servers"][number];
type MonitorNodeRecord = IMcsmMonitorOverviewResponse["nodes"][number];

type PreviewInstanceMetrics = {
  cpuPercent: number;
  memoryBytes: number;
  memoryPercent: number;
  tps: number;
  onlinePlayers: number;
  maxPlayers: number;
  serverVersion: string;
};

type PreviewHostMetrics = {
  cpuPercent: number;
  totalmem: number;
  freemem: number;
  hostname: string;
  platform: string;
  loadavg: number[];
  primaryDisk?: IMcsmMonitorDiskSnapshot;
};

const previewInstanceMetricsMap: Record<string, PreviewInstanceMetrics> = {
  "home-daemon-a:instance:paper-lobby": {
    cpuPercent: 26.4,
    memoryBytes: Math.round(3.3 * GIB),
    memoryPercent: 31.2,
    tps: 19.98,
    onlinePlayers: 18,
    maxPlayers: 80,
    serverVersion: "Paper 1.20.4"
  },
  "home-daemon-a:instance:survival-main": {
    cpuPercent: 54.8,
    memoryBytes: Math.round(5.8 * GIB),
    memoryPercent: 48.6,
    tps: 19.73,
    onlinePlayers: 42,
    maxPlayers: 100,
    serverVersion: "Paper 1.20.4"
  },
  "home-daemon-a:instance:proxy-gate": {
    cpuPercent: 4.6,
    memoryBytes: Math.round(0.9 * GIB),
    memoryPercent: 12.4,
    tps: 20,
    onlinePlayers: 63,
    maxPlayers: 120,
    serverVersion: "Velocity 3.3"
  },
  "nas-daemon-b:instance:creative-test": {
    cpuPercent: 21.9,
    memoryBytes: Math.round(2.4 * GIB),
    memoryPercent: 24.5,
    tps: 19.99,
    onlinePlayers: 7,
    maxPlayers: 30,
    serverVersion: "Paper 1.20.4"
  },
  "nas-daemon-b:instance:forge-pack": {
    cpuPercent: 46.3,
    memoryBytes: Math.round(6.7 * GIB),
    memoryPercent: 56.8,
    tps: 19.41,
    onlinePlayers: 12,
    maxPlayers: 24,
    serverVersion: "Forge 1.20.1"
  },
  "backup-daemon-c:instance:backup-world": {
    cpuPercent: 0,
    memoryBytes: 0,
    memoryPercent: 0,
    tps: 0,
    onlinePlayers: 0,
    maxPlayers: 20,
    serverVersion: "Paper 1.20.4"
  }
};

const previewHostMetricsMap: Record<string, PreviewHostMetrics> = {
  "home-daemon-a": {
    cpuPercent: 37.4,
    totalmem: Math.round(16 * GIB),
    freemem: Math.round(6.1 * GIB),
    hostname: "relay-home-a",
    platform: "Linux",
    loadavg: [0.82, 0.69, 0.57],
    primaryDisk: {
      mount: "/data",
      device: "/dev/nvme0n1p2",
      totalBytes: Math.round(1 * TIB),
      usedBytes: Math.round(0.42 * TIB),
      freeBytes: Math.round(0.58 * TIB),
      usagePercent: 42.1
    }
  },
  "nas-daemon-b": {
    cpuPercent: 18.6,
    totalmem: Math.round(32 * GIB),
    freemem: Math.round(17.8 * GIB),
    hostname: "relay-nas-b",
    platform: "Linux",
    loadavg: [0.41, 0.38, 0.35],
    primaryDisk: {
      mount: "/volume1",
      device: "/dev/md0",
      totalBytes: Math.round(4 * TIB),
      usedBytes: Math.round(1.73 * TIB),
      freeBytes: Math.round(2.27 * TIB),
      usagePercent: 43.2
    }
  },
  "backup-daemon-c": {
    cpuPercent: 0,
    totalmem: Math.round(8 * GIB),
    freemem: Math.round(8 * GIB),
    hostname: "backup-node-c",
    platform: "Linux",
    loadavg: [0, 0, 0]
  }
};

const makeTargetKey = (target: Pick<ControlTarget, "daemonId" | "mode" | "instanceId">) =>
  `${target.daemonId}:${target.mode}:${target.instanceId}`;

const formatPercent = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return "--";
  return `${value.toFixed(1)}%`;
};

const formatLoad = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return "--";
  return value.toFixed(2);
};

const formatUpdatedAt = (timestamp?: number) => parseTimestamp(timestamp ?? 0) || "--";

const getPercentTone = (value?: number | null): ControlDashboardMetric["tone"] => {
  if (value == null || Number.isNaN(value)) return "muted";
  if (value >= 80) return "danger";
  if (value >= 60) return "warning";
  return "success";
};

const getTpsTone = (value?: number | null): ControlDashboardMetric["tone"] => {
  if (value == null || Number.isNaN(value)) return "muted";
  if (value < 12) return "danger";
  if (value < 18) return "warning";
  return "success";
};

const getStatusText = (status?: number) => {
  if (status == null) return "--";
  return INSTANCE_STATUS[status as INSTANCE_STATUS_CODE] || "--";
};

const getMemoryTone = (used?: number, total?: number) => {
  if (!total) return "muted";
  return getPercentTone((used ?? 0) / total * 100);
};

const getPreviewInstanceMetrics = (target: ControlTarget) =>
  previewInstanceMetricsMap[makeTargetKey(target)];

const getPreviewHostMetrics = (daemonId: string) => previewHostMetricsMap[daemonId];

const buildOfflineMetrics = (labels: string[]) =>
  labels.map<ControlDashboardMetric>((label, index) => ({
    key: `${label}-${index}`,
    label,
    value: "--",
    detail: t("TXT_CODE_CONTROL_NODE_OFFLINE"),
    tone: "muted"
  }));

const buildInstanceMetricsFromPreview = (target: ControlTarget): ControlDashboardMetric[] => {
  const labels = [
    t("TXT_CODE_CONTROL_CPU"),
    t("TXT_CODE_CONTROL_MEMORY"),
    t("TXT_CODE_CONTROL_TPS"),
    t("TXT_CODE_CONTROL_PLAYERS")
  ];

  if (!target.daemonAvailable) return buildOfflineMetrics(labels);

  const base = getPreviewInstanceMetrics(target);
  const statusText = getStatusText(target.status);
  const isRunning = target.status === INSTANCE_STATUS_CODE.RUNNING;
  const isWarmingUp =
    target.status === INSTANCE_STATUS_CODE.STARTING || target.status === INSTANCE_STATUS_CODE.BUSY;

  if (!base) {
    return labels.map<ControlDashboardMetric>((label, index) => ({
      key: `${label}-${index}`,
      label,
      value: "--",
      detail: statusText,
      tone: "muted"
    }));
  }

  const effectiveCpu = isRunning ? base.cpuPercent : isWarmingUp ? base.cpuPercent * 0.46 : undefined;
  const effectiveMemoryBytes = isRunning
    ? base.memoryBytes
    : isWarmingUp
      ? base.memoryBytes * 0.58
      : undefined;
  const effectiveMemoryPercent = isRunning
    ? base.memoryPercent
    : isWarmingUp
      ? Math.max(base.memoryPercent * 0.52, 8)
      : undefined;

  return [
    {
      key: "cpu",
      label: t("TXT_CODE_CONTROL_CPU"),
      value: formatPercent(effectiveCpu),
      detail: statusText,
      tone: getPercentTone(effectiveCpu)
    },
    {
      key: "memory",
      label: t("TXT_CODE_CONTROL_MEMORY"),
      value: effectiveMemoryBytes ? formatMemoryUsage(effectiveMemoryBytes) : "--",
      detail: effectiveMemoryPercent != null ? `${formatPercent(effectiveMemoryPercent)} RSS` : statusText,
      tone: getPercentTone(effectiveMemoryPercent)
    },
    {
      key: "tps",
      label: t("TXT_CODE_CONTROL_TPS"),
      value: isRunning ? base.tps.toFixed(2) : "--",
      detail: isRunning ? t("TXT_CODE_CONTROL_1M_AVG") : statusText,
      tone: getTpsTone(isRunning ? base.tps : undefined)
    },
    {
      key: "players",
      label: t("TXT_CODE_CONTROL_PLAYERS"),
      value: isRunning ? `${base.onlinePlayers} / ${base.maxPlayers}` : "--",
      detail: isRunning ? base.serverVersion : statusText,
      tone: isRunning ? "default" : "muted"
    }
  ];
};

const buildGlobalMetricsFromPreview = (target: ControlTarget): ControlDashboardMetric[] => {
  const labels = [
    t("TXT_CODE_CONTROL_CPU"),
    t("TXT_CODE_CONTROL_MEMORY"),
    t("TXT_CODE_CONTROL_DISK"),
    t("TXT_CODE_CONTROL_LOAD_AVG")
  ];

  if (!target.daemonAvailable) return buildOfflineMetrics(labels);

  const host = getPreviewHostMetrics(target.daemonId);
  if (!host) {
    return labels.map<ControlDashboardMetric>((label, index) => ({
      key: `${label}-${index}`,
      label,
      value: "--",
      detail: "--",
      tone: "muted"
    }));
  }

  const memoryUsed = Math.max(0, host.totalmem - host.freemem);

  return [
    {
      key: "cpu",
      label: t("TXT_CODE_CONTROL_CPU"),
      value: formatPercent(host.cpuPercent),
      detail: host.platform,
      tone: getPercentTone(host.cpuPercent)
    },
    {
      key: "memory",
      label: t("TXT_CODE_CONTROL_MEMORY"),
      value: formatMemoryUsage(memoryUsed, host.totalmem),
      detail: formatPercent(memoryUsed / host.totalmem * 100),
      tone: getMemoryTone(memoryUsed, host.totalmem)
    },
    {
      key: "disk",
      label: t("TXT_CODE_CONTROL_DISK"),
      value: host.primaryDisk
        ? formatMemoryUsage(host.primaryDisk.usedBytes, host.primaryDisk.totalBytes)
        : "--",
      detail: host.primaryDisk?.mount || "--",
      tone: getPercentTone(host.primaryDisk?.usagePercent)
    },
    {
      key: "load",
      label: t("TXT_CODE_CONTROL_LOAD_AVG"),
      value: formatLoad(host.loadavg[0]),
      detail: host.hostname,
      tone: "default"
    }
  ];
};

const buildInstanceMetricsFromLive = (server: MonitorServerRecord): ControlDashboardMetric[] => {
  const labels = [
    t("TXT_CODE_CONTROL_CPU"),
    t("TXT_CODE_CONTROL_MEMORY"),
    t("TXT_CODE_CONTROL_TPS"),
    t("TXT_CODE_CONTROL_PLAYERS")
  ];

  if (!server.daemonAvailable) return buildOfflineMetrics(labels);

  const statusText = getStatusText(server.status);
  const isRunning = server.processRunning;
  const memoryPercent = server.process.memoryPercent;

  return [
    {
      key: "cpu",
      label: t("TXT_CODE_CONTROL_CPU"),
      value: isRunning ? formatPercent(server.process.cpuPercent) : "--",
      detail: isRunning && server.process.pid != null ? `PID ${server.process.pid}` : statusText,
      tone: getPercentTone(isRunning ? server.process.cpuPercent : undefined)
    },
    {
      key: "memory",
      label: t("TXT_CODE_CONTROL_MEMORY"),
      value: isRunning && server.process.memoryBytes != null ? formatMemoryUsage(server.process.memoryBytes) : "--",
      detail: isRunning && memoryPercent != null ? `${formatPercent(memoryPercent)} RSS` : statusText,
      tone: getPercentTone(isRunning ? memoryPercent : undefined)
    },
    {
      key: "tps",
      label: t("TXT_CODE_CONTROL_TPS"),
      value: server.plugin.online ? server.plugin.tps.oneMin.toFixed(2) : "--",
      detail: server.plugin.online ? t("TXT_CODE_CONTROL_1M_AVG") : t("TXT_CODE_CONTROL_PLUGIN_OFFLINE"),
      tone: getTpsTone(server.plugin.online ? server.plugin.tps.oneMin : undefined)
    },
    {
      key: "players",
      label: t("TXT_CODE_CONTROL_PLAYERS"),
      value: server.plugin.online ? `${server.plugin.onlinePlayers} / ${server.plugin.maxPlayers}` : "--",
      detail: server.plugin.online ? server.plugin.serverVersion || statusText : t("TXT_CODE_CONTROL_PLUGIN_OFFLINE"),
      tone: server.plugin.online ? "default" : "muted"
    }
  ];
};

const buildGlobalMetricsFromLive = (node: MonitorNodeRecord): ControlDashboardMetric[] => {
  const labels = [
    t("TXT_CODE_CONTROL_CPU"),
    t("TXT_CODE_CONTROL_MEMORY"),
    t("TXT_CODE_CONTROL_DISK"),
    t("TXT_CODE_CONTROL_LOAD_AVG")
  ];

  if (!node.available || !node.host) return buildOfflineMetrics(labels);

  const host = node.host;
  const memoryUsed = Math.max(0, host.totalmem - host.freemem);

  return [
    {
      key: "cpu",
      label: t("TXT_CODE_CONTROL_CPU"),
      value: formatPercent(host.cpuPercent),
      detail: host.platform,
      tone: getPercentTone(host.cpuPercent)
    },
    {
      key: "memory",
      label: t("TXT_CODE_CONTROL_MEMORY"),
      value: formatMemoryUsage(memoryUsed, host.totalmem),
      detail: formatPercent(host.memPercent),
      tone: getMemoryTone(memoryUsed, host.totalmem)
    },
    {
      key: "disk",
      label: t("TXT_CODE_CONTROL_DISK"),
      value: host.primaryDisk ? formatMemoryUsage(host.primaryDisk.usedBytes, host.primaryDisk.totalBytes) : "--",
      detail: host.primaryDisk?.mount || "--",
      tone: getPercentTone(host.primaryDisk?.usagePercent)
    },
    {
      key: "load",
      label: t("TXT_CODE_CONTROL_LOAD_AVG"),
      value: formatLoad(host.loadavg[0]),
      detail: host.hostname,
      tone: "default"
    }
  ];
};

export function useControlDashboard(currentTarget: Readonly<Ref<ControlTarget | undefined>>) {
  const { state: appState } = useAppStateStore();
  const result = monitorOverview();

  const liveState = ref<IMcsmMonitorOverviewResponse>();
  const isDashboardRefreshing = ref(false);
  const previewUpdatedAt = ref(Date.now());
  const timer = ref<number>();

  const isLocalPreviewMode = computed(() => appState.userInfo?.token === "local-preview-token");

  const currentLiveServer = computed(() => {
    const target = currentTarget.value;
    if (!target || target.mode !== "instance") return undefined;
    return (liveState.value?.servers ?? []).find(
      (server) =>
        server.daemonId === target.daemonId &&
        (server.instanceId === target.instanceId || server.serverId === target.instanceId)
    );
  });

  const currentLiveNode = computed(() => {
    const target = currentTarget.value;
    if (!target) return undefined;
    return (liveState.value?.nodes ?? []).find((node) => node.daemonId === target.daemonId);
  });

  const dashboardSource = computed<"live" | "preview">(() => {
    const target = currentTarget.value;
    if (!target) return "preview";
    if (target.mode === "global") {
      return currentLiveNode.value?.host ? "live" : "preview";
    }
    return currentLiveServer.value ? "live" : "preview";
  });

  const dashboardSourceText = computed(() =>
    dashboardSource.value === "live"
      ? t("TXT_CODE_CONTROL_SOURCE_LIVE")
      : t("TXT_CODE_CONTROL_SOURCE_PREVIEW")
  );

  const dashboardMetrics = computed<ControlDashboardMetric[]>(() => {
    const target = currentTarget.value;
    if (!target) return [];

    if (dashboardSource.value === "live") {
      if (target.mode === "global" && currentLiveNode.value) {
        return buildGlobalMetricsFromLive(currentLiveNode.value);
      }
      if (target.mode === "instance" && currentLiveServer.value) {
        return buildInstanceMetricsFromLive(currentLiveServer.value);
      }
    }

    return target.mode === "global"
      ? buildGlobalMetricsFromPreview(target)
      : buildInstanceMetricsFromPreview(target);
  });

  const dashboardMeta = computed<ControlDashboardMetaItem[]>(() => {
    const target = currentTarget.value;
    if (!target) return [];

    return [
      {
        key: "daemon",
        label: t("TXT_CODE_CONTROL_NODE_ID"),
        value: target.daemonId
      },
      {
        key: "target",
        label: t("TXT_CODE_CONTROL_TARGET_ID"),
        value: target.instanceId
      },
      {
        key: "source",
        label: t("TXT_CODE_CONTROL_SOURCE"),
        value: dashboardSourceText.value
      },
      {
        key: "updatedAt",
        label: t("TXT_CODE_CONTROL_UPDATED_AT"),
        value:
          dashboardSource.value === "live"
            ? formatUpdatedAt(liveState.value?.generatedAt)
            : formatUpdatedAt(previewUpdatedAt.value)
      }
    ];
  });

  const refreshDashboard = async (forceRequest = false) => {
    if (dashboardSource.value === "preview" || isLocalPreviewMode.value) {
      previewUpdatedAt.value = Date.now();
    }

    if (isLocalPreviewMode.value || isDashboardRefreshing.value) {
      return liveState.value;
    }

    isDashboardRefreshing.value = true;
    try {
      const nextState = await result.execute({ forceRequest });
      liveState.value = nextState.value;
    } catch (error) {
      console.warn("Control dashboard monitor overview refresh failed:", error);
    } finally {
      isDashboardRefreshing.value = false;
    }

    return liveState.value;
  };

  onMounted(() => {
    if (isLocalPreviewMode.value) return;
    void refreshDashboard();
    timer.value = window.setInterval(() => {
      void refreshDashboard(true);
    }, DASHBOARD_REFRESH_INTERVAL_MS);
  });

  watch(
    () => {
      const target = currentTarget.value;
      return target ? makeTargetKey(target) : "";
    },
    () => {
      previewUpdatedAt.value = Date.now();
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (timer.value) {
      window.clearInterval(timer.value);
      timer.value = undefined;
    }
  });

  return {
    dashboardMeta,
    dashboardMetrics,
    dashboardSource,
    dashboardSourceText,
    isDashboardRefreshing,
    refreshDashboard
  };
}
