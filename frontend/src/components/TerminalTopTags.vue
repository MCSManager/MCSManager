<script setup lang="ts">
import { t } from "@/lang/i18n";
import {
  ApartmentOutlined,
  BlockOutlined,
  DashboardOutlined,
  HddOutlined
} from "@ant-design/icons-vue";
import { useLocalStorage } from "@vueuse/core";
import prettyBytes, { type Options as PrettyOptions } from "pretty-bytes";
import { computed, type Component } from "vue";

interface TerminalRuntimeInfo {
  cpuUsage?: number;
  memoryUsage?: number;
  memoryLimit?: number;
  memoryUsagePercent?: number;
  rxBytes?: number;
  txBytes?: number;
  rxRate?: number;
  txRate?: number;
  networkInterfaces?: string[];
  networkStatsSource?: "docker";
  storageUsage?: number;
  storageLimit?: number;
}

interface PerfCardItem {
  key: string;
  label: string;
  value: string;
  icon: Component;
  theme: string;
  barPercent: number;
  onClick?: () => void;
}

const props = defineProps<{
  info?: TerminalRuntimeInfo | null;
  isStopped: boolean;
}>();

const useByteUnit = useLocalStorage("useByteUnit", true);
const prettyBytesConfig: PrettyOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  binary: true
};

const formatMemoryUsage = (usage?: number, limit?: number) => {
  const fUsage = prettyBytes(usage ?? 0, prettyBytesConfig);
  const fLimit = prettyBytes(limit ?? 0, prettyBytesConfig);
  return limit ? `${fUsage} / ${fLimit}` : fUsage;
};

const formatNetworkSpeed = (bytes?: number) =>
  useByteUnit.value
    ? prettyBytes(bytes ?? 0, { ...prettyBytesConfig, binary: false }) + "/s"
    : prettyBytes((bytes ?? 0) * 8, { ...prettyBytesConfig, bits: true, binary: false }).replace(
        /bit$/,
        "b"
      ) + "ps";

const formatTrafficUsage = (bytes?: number) =>
  prettyBytes(bytes ?? 0, { ...prettyBytesConfig, binary: false });

const cards = computed<PerfCardItem[]>(() => {
  const info = props.info;
  if (!info || props.isStopped) return [];

  const {
    cpuUsage,
    memoryUsage,
    memoryLimit,
    memoryUsagePercent,
    rxBytes,
    txBytes,
    rxRate,
    txRate,
    storageUsage,
    storageLimit
  } = info;

  const cpuStatus =
    cpuUsage != null && cpuUsage > 600
      ? "error"
      : cpuUsage != null && cpuUsage > 200
      ? "warning"
      : "normal";
  const cpuPercent = Math.min(parseInt(String(cpuUsage ?? 0)), 100);
  const memPercent = Math.min(memoryUsagePercent ?? 0, 100);
  const storagePercent =
    storageUsage && storageLimit ? Math.min((storageUsage / storageLimit) * 100, 100) : 0;

  const items: (PerfCardItem | null)[] = [
    cpuUsage != null
      ? {
          key: "cpu",
          label: t("TXT_CODE_b862a158"),
          value: `${parseInt(String(cpuUsage))}%`,
          icon: BlockOutlined,
          theme: `perf-card--cpu-${cpuStatus}`,
          barPercent: cpuPercent
        }
      : null,

    memoryUsage != null
      ? {
          key: "memory",
          label: t("TXT_CODE_593ee330"),
          value: formatMemoryUsage(memoryUsage, memoryLimit),
          icon: DashboardOutlined,
          theme: "perf-card--memory",
          barPercent: memPercent
        }
      : null,

    storageUsage
      ? {
          key: "disk",
          label: t("TXT_CODE_DISK_USAGE"),
          value: formatMemoryUsage(storageUsage || 0, storageLimit || 0),
          icon: HddOutlined,
          theme: "perf-card--disk",
          barPercent: storagePercent
        }
      : null,

    rxRate != null || txRate != null
      ? {
          key: "network-bandwidth",
          label: `${t("TXT_CODE_NETWORK_CURRENT")}`,
          value: `↓${formatNetworkSpeed(rxRate)} ↑${formatNetworkSpeed(txRate)}`,
          icon: ApartmentOutlined,
          theme: "perf-card--network",
          barPercent: 0,
          onClick: () => {
            useByteUnit.value = !useByteUnit.value;
          }
        }
      : null,

    rxBytes != null || txBytes != null
      ? {
          key: "network-traffic",
          label: `${t("TXT_CODE_NETWORK_TOTAL")}`,
          value: `↓${formatTrafficUsage(rxBytes)} ↑${formatTrafficUsage(txBytes)}`,
          icon: ApartmentOutlined,
          theme: "perf-card--network",
          barPercent: 0
        }
      : null
  ];

  if (window.innerWidth < 660) {
    return items.filter(Boolean).slice(0, 2) as PerfCardItem[];
  }

  return items.filter(Boolean) as PerfCardItem[];
});
</script>

<template>
  <div v-if="cards.length > 0" class="perf-cards">
    <a-tag
      v-for="card in cards"
      :key="card.key"
      class="card"
      :class="card.theme"
      @click="card.onClick?.()"
    >
      {{ card.label }} {{ card.value }}
    </a-tag>
  </div>
</template>

<style scoped lang="scss">
.perf-cards {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0px;
  .card {
    user-select: none;
  }
}
</style>
