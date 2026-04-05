<script setup lang="ts">
import DataStatistic from "@/components/DataStatistic.vue";
import { useOverviewInfo } from "@/hooks/useOverviewInfo";
import { t } from "@/lang/i18n";
import { arrayFilter } from "@/tools/array";
import type { LayoutCard } from "@/types";
import {
  ApiOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  GlobalOutlined,
  LaptopOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  UserOutlined
} from "@ant-design/icons-vue";
import type { Component } from "vue";
import { computed } from "vue";

interface OverviewTextItem {
  type: "text";
  title: string;
  value: string;
  icon?: Component;
  condition?: () => boolean;
}

interface OverviewMemoryItem {
  type: "memory";
  title: string;
  used: number;
  total: number;
  condition?: () => boolean;
}

interface OverviewCpuItem {
  type: "cpu";
  title: string;
  percent: number;
  condition?: () => boolean;
}

interface OverviewLoadAvgItem {
  type: "loadavg";
  title: string;
  values: [number, number, number];
  condition?: () => boolean;
}

type OverviewItem = OverviewTextItem | OverviewMemoryItem | OverviewCpuItem | OverviewLoadAvgItem;

defineProps<{
  card: LayoutCard;
}>();

const { state } = useOverviewInfo();

const overviewList = computed(() => {
  if (!state.value) {
    return [
      {
        type: "text" as const,
        title: t("TXT_CODE_b197be11"),
        value: ""
      }
    ];
  }

  const { system, version, record, specifiedDaemonVersion, process } = state.value;
  const free = Number((system.freemem / 1024 / 1024 / 1024).toFixed(1));
  const totalMem = Number((system.totalmem / 1024 / 1024 / 1024).toFixed(1));
  const usedMem = Number(Number(totalMem) - Number(free));
  const cpuPercent = Math.min(100, Math.round((state.value as { cpu?: number }).cpu ?? 0));

  const items: (OverviewItem & { condition?: () => boolean })[] = [
    {
      type: "text",
      title: t("TXT_CODE_413b9c01"),
      value: system.node,
      icon: CodeOutlined
    },
    {
      type: "text",
      title: t("TXT_CODE_af21e6b"),
      value: version,
      icon: AppstoreOutlined
    },
    {
      type: "text",
      title: t("TXT_CODE_a0e70887"),
      value: specifiedDaemonVersion,
      icon: ApiOutlined
    },
    {
      type: "text",
      title: t("TXT_CODE_fdb6c369"),
      value: system.user.username,
      icon: UserOutlined
    },
    {
      type: "text",
      title: t("TXT_CODE_f54e6d1f"),
      value: new Date(system.time).toLocaleString(),
      icon: ClockCircleOutlined
    },
    {
      type: "text",
      title: t("TXT_CODE_4ab6a0b5"),
      value: new Date().toLocaleString(),
      icon: GlobalOutlined
    },
    {
      type: "text",
      title: t("TXT_CODE_856bd2f3"),
      value: String(record.banips),
      icon: SafetyCertificateOutlined
    },
    {
      type: "text",
      title: t("TXT_CODE_da8f97a7"),
      value: String(record.illegalAccess),
      icon: LockOutlined
    },
    {
      type: "memory",
      title: t("TXT_CODE_593ee330"),
      used: usedMem,
      total: totalMem
    },
    {
      type: "cpu",
      title: "CPU",
      percent: cpuPercent
    },
    {
      type: "loadavg",
      title: t("TXT_CODE_190ecd56"),
      values: system.loadavg.map((v) => Number(Number(v).toFixed(2))) as [number, number, number],
      condition: () => !system.type.toLowerCase().includes("windows")
    },
    {
      type: "text",
      title: t("TXT_CODE_77d038f7"),
      value: `${(process.memory / 1024 / 1024).toFixed(1)}MB`,
      icon: DesktopOutlined
    },
    {
      type: "text",
      title: t("TXT_CODE_4df7e9bd"),
      value: system.hostname,
      icon: CloudServerOutlined
    },
    {
      type: "text",
      title: t("TXT_CODE_b4d8588"),
      value: `${
        system.version.length > 16 ? system.version.slice(0, 16) + "..." : system.version
      } ${system.release}`,
      icon: CodeOutlined
    },
    {
      type: "text",
      title: t("TXT_CODE_edf84830"),
      value: `${system.type} ${system.platform}`,
      icon: LaptopOutlined
    }
  ];

  return arrayFilter(items);
});
</script>

<template>
  <div class="panel-overview">
    <CardPanel style="height: 100%">
      <template #title>{{ card.title }}</template>
      <template #body>
        <a-row :gutter="[24, 24]">
          <a-col
            v-for="(item, index) in overviewList"
            :key="`${item.title}-${index}`"
            :span="12"
            :md="12"
            :lg="6"
          >
            <!-- Memory: progress bar + percent and value -->
            <div v-if="item.type === 'memory'" class="overview-item overview-item--progress">
              <div class="overview-item__title">
                <DatabaseOutlined class="overview-item__icon" />
                <span style="opacity: 0.7">{{ item.title }}</span>
              </div>
              <div class="overview-item__value">
                <span class="overview-item__percent">
                  {{ item.total > 0 ? Math.round((item.used / item.total) * 100) : 0 }}%
                </span>
                <span class="overview-item__unit">
                  {{ item.used.toFixed(1) }} GB / {{ item.total.toFixed(1) }} GB
                </span>
              </div>
            </div>

            <!-- CPU: progress bar + percent and value -->
            <div v-else-if="item.type === 'cpu'" class="overview-item overview-item--progress">
              <div class="overview-item__title">
                <ThunderboltOutlined class="overview-item__icon" />
                <span style="opacity: 0.7">{{ item.title }}</span>
              </div>

              <div class="overview-item__value">
                <span class="overview-item__percent">{{ item.percent }}%</span>
              </div>
            </div>

            <!-- Load Average: three tags with separator -->
            <div v-else-if="item.type === 'loadavg'" class="overview-item overview-item--loadavg">
              <div class="overview-item__title">
                <ThunderboltOutlined class="overview-item__icon" />
                <span style="opacity: 0.7">{{ item.title }}</span>
              </div>
              <div class="loadavg-tags">
                <template v-for="(v, i) in item.values" :key="i">
                  <a-tag
                    :color="i === 0 ? 'green' : i === 1 ? 'gold' : 'volcano'"
                    class="loadavg-tag"
                  >
                    {{ v.toFixed(2) }}
                  </a-tag>
                  <span v-if="i < item.values.length - 1" class="loadavg-sep">·</span>
                </template>
              </div>
            </div>

            <!-- Other: icon + text -->
            <DataStatistic v-else :title="item.title" :value="item.value" :icon="item.icon" />
          </a-col>
        </a-row>
      </template>
    </CardPanel>
  </div>
</template>

<style lang="scss" scoped>
.panel-overview {
  height: 100%;
}

.overview-item {
  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-gary-4);
    font-size: var(--font-body);
    margin-bottom: 8px;

    .overview-item__icon {
      font-size: 16px;
      color: var(--color-primary);
    }
  }

  &__value {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
    margin-top: 8px;
    color: var(--color-gary-6);
    font-size: var(--font-h5);

    .overview-item__percent {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .overview-item__unit {
      opacity: 0.9;
    }
  }

  &--progress {
    .ant-progress {
      margin-bottom: 0;
    }

    :deep(.ant-progress-outer),
    :deep(.ant-progress-inner) {
      border-radius: 8px;
    }
  }

  &--loadavg {
    .loadavg-tags {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin-top: 4px;

      .loadavg-tag {
        margin: 0;
        font-variant-numeric: tabular-nums;
      }

      .loadavg-sep {
        color: var(--color-gary-4);
        font-size: 12px;
        margin: 0 2px;
      }
    }
  }
}
</style>
