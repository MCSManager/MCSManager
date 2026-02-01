<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import DataStatistic from "@/components/DataStatistic.vue";
import { useInstanceInfo } from "@/hooks/useInstance";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { t } from "@/lang/i18n";
import { getRandomId } from "@/tools/randId";
import type { InstanceDetail, LayoutCard } from "@/types";
import { init, graphic, type ECharts } from "echarts";
import prettyBytes from "pretty-bytes";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const { instanceInfo, execute } = useInstanceInfo({
  instanceId,
  daemonId,
  autoRefresh: true
});

const isDockerMode = computed(() => instanceInfo.value?.config.processType === "docker");
const isMinecraftJava = computed(() => String(instanceInfo.value?.config.type || "").includes("minecraft/java"));

const cpuChartDomId = getRandomId();
const memChartDomId = getRandomId();
const cpuChart = ref<ECharts>();
const memChart = ref<ECharts>();
const handleResize = () => {
  cpuChart.value?.resize();
  memChart.value?.resize();
};

type TrendPoint = {
  time: string;
  cpu?: number;
  memMB?: number;
};

const MAX_POINTS = 60;
const trend = ref<TrendPoint[]>([]);

function toFixedNumber(v: unknown, digits = 1): number | undefined {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Number(n.toFixed(digits));
}

function getCpuValue(detail?: InstanceDetail): number | undefined {
  if (!detail) return undefined;
  if (detail.config.processType === "docker") return toFixedNumber(detail.info.cpuUsage, 0);
  return toFixedNumber(detail.processInfo?.cpu, 0);
}

function getMemUsageBytes(detail?: InstanceDetail): number | undefined {
  if (!detail) return undefined;
  if (detail.config.processType === "docker") return detail.info.memoryUsage;
  return detail.processInfo?.memory;
}

function getMemLimitBytes(detail?: InstanceDetail): number | undefined {
  if (!detail) return undefined;
  if (detail.config.processType === "docker") return detail.info.memoryLimit;
  return undefined;
}

function getMemUsageMB(detail?: InstanceDetail): number | undefined {
  const bytes = getMemUsageBytes(detail);
  if (typeof bytes !== "number") return undefined;
  return toFixedNumber(bytes / 1024 / 1024, 1);
}

function formatBytes(v?: number, fallback = "--") {
  if (typeof v !== "number") return fallback;
  return prettyBytes(v);
}

function formatBytesPerSecond(v?: number, fallback = "--") {
  if (typeof v !== "number") return fallback;
  return `${prettyBytes(v)}/s`;
}

function initLineChart(chart: ECharts, color: string) {
  chart.setOption({
    grid: {
      top: 8,
      bottom: 24,
      left: 36,
      right: 10
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line" }
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      axisLabel: { show: false },
      axisTick: { show: false },
      axisLine: { show: false }
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLabel: { show: true },
      splitLine: { show: true, lineStyle: { color: "rgba(0,0,0,0.06)" } }
    },
    series: [
      {
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${color}66` },
            { offset: 1, color: `${color}00` }
          ])
        },
        data: []
      }
    ]
  });
}

function updateCharts(points: TrendPoint[]) {
  const timeList = points.map((p) => p.time);
  const cpuList = points.map((p) => p.cpu ?? null);
  const memList = points.map((p) => p.memMB ?? null);

  cpuChart.value?.setOption({
    xAxis: { data: timeList },
    series: [{ data: cpuList }]
  });
  memChart.value?.setOption({
    xAxis: { data: timeList },
    series: [{ data: memList }]
  });
}

watch(
  instanceInfo,
  (detail) => {
    if (!detail) return;
    const now = new Date();
    const time = now.toLocaleTimeString();
    const cpu = getCpuValue(detail);
    const memMB = getMemUsageMB(detail);
    if (cpu === undefined && memMB === undefined) return;

    const next: TrendPoint = { time, cpu, memMB };
    const list = trend.value.concat(next);
    trend.value = list.slice(Math.max(0, list.length - MAX_POINTS));
    updateCharts(trend.value);
  },
  { deep: false }
);

const cpuText = computed(() => {
  const cpu = getCpuValue(instanceInfo.value);
  return cpu === undefined ? "--" : `${cpu}%`;
});

const memText = computed(() => {
  const usage = getMemUsageBytes(instanceInfo.value);
  if (typeof usage !== "number") return "--";
  const limit = getMemLimitBytes(instanceInfo.value);
  if (typeof limit !== "number") return formatBytes(usage);
  const percent = limit > 0 ? Math.round((usage / limit) * 100) : undefined;
  if (percent === undefined) return `${formatBytes(usage)}/${formatBytes(limit)}`;
  return `${formatBytes(usage)}/${formatBytes(limit)} (${percent}%)`;
});

const networkText = computed(() => {
  if (!isDockerMode.value) return { rx: "--", tx: "--" };
  const rx = formatBytesPerSecond(instanceInfo.value?.info?.rxBytes);
  const tx = formatBytesPerSecond(instanceInfo.value?.info?.txBytes);
  return { rx, tx };
});

const storageText = computed(() => {
  if (!isDockerMode.value) return "--";
  const usage = instanceInfo.value?.info?.storageUsage;
  const limit = instanceInfo.value?.info?.storageLimit;
  if (typeof usage !== "number" || typeof limit !== "number") return "--";
  const percent = limit > 0 ? Math.round((usage / limit) * 100) : undefined;
  if (percent === undefined) return `${formatBytes(usage)}/${formatBytes(limit)}`;
  return `${formatBytes(usage)}/${formatBytes(limit)} (${percent}%)`;
});

const playersText = computed(() => {
  const info = instanceInfo.value?.info;
  if (!info?.mcPingOnline) return "--";
  return `${info.currentPlayers}/${info.maxPlayers}`;
});

const latencyText = computed(() => {
  const info = instanceInfo.value?.info;
  if (!info?.mcPingOnline) return "--";
  const latency = info.latency;
  return `${latency}ms`;
});

const metricsList = computed(() => {
  return [
    { title: "CPU", value: cpuText.value },
    { title: t("TXT_CODE_593ee330"), value: memText.value },
    { title: t("TXT_CODE_INSTANCE_METRICS_NET_RX"), value: networkText.value.rx, condition: () => isDockerMode.value },
    { title: t("TXT_CODE_INSTANCE_METRICS_NET_TX"), value: networkText.value.tx, condition: () => isDockerMode.value },
    { title: t("TXT_CODE_INSTANCE_METRICS_STORAGE"), value: storageText.value, condition: () => isDockerMode.value },
    { title: t("TXT_CODE_855c4a1c"), value: playersText.value, condition: () => isMinecraftJava.value }
  ].filter((v) => (v.condition ? v.condition() : true));
});

onMounted(async () => {
  if (instanceId && daemonId) {
    await execute({
      params: {
        uuid: instanceId,
        daemonId
      }
    });
  }

  await nextTick();
  const cpuEl = document.getElementById(cpuChartDomId);
  const memEl = document.getElementById(memChartDomId);
  if (cpuEl) {
    cpuChart.value = init(cpuEl);
    initLineChart(cpuChart.value, "#1677ff");
  }
  if (memEl) {
    memChart.value = init(memEl);
    initLineChart(memChart.value, "#52c41a");
  }

  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  cpuChart.value?.dispose();
  memChart.value?.dispose();
  cpuChart.value = undefined;
  memChart.value = undefined;
});
</script>

<template>
  <CardPanel style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <a-row :gutter="[16, 16]">
        <a-col v-for="item in metricsList" :key="item.title" :span="12" :md="12" :lg="8">
          <DataStatistic :title="item.title" :value="item.value"></DataStatistic>
        </a-col>
        <a-col :span="12" :md="12" :lg="8">
          <DataStatistic :title="t('TXT_CODE_INSTANCE_METRICS_LATENCY')" :value="latencyText" />
        </a-col>
      </a-row>

      <div class="charts">
        <div class="chart-block">
          <div class="chart-title">{{ t("TXT_CODE_INSTANCE_METRICS_CPU_TREND") }}</div>
          <div :id="cpuChartDomId" class="chart"></div>
        </div>
        <div class="chart-block">
          <div class="chart-title">{{ t("TXT_CODE_INSTANCE_METRICS_MEM_TREND") }}</div>
          <div :id="memChartDomId" class="chart"></div>
        </div>
      </div>
    </template>
  </CardPanel>
</template>

<style scoped lang="scss">
.charts {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chart-block {
  border: 1px solid var(--card-border-color);
  border-radius: 6px;
  padding: 10px;
  background: var(--background-color-white);
}

.chart-title {
  color: var(--color-gary-4);
  font-size: 12px;
  margin-bottom: 6px;
}

.chart {
  width: 100%;
  height: 180px;
}

@media (max-width: 992px) {
  .charts {
    grid-template-columns: 1fr;
  }
  .chart {
    height: 160px;
  }
}
</style>
