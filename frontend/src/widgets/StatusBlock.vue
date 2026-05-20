<script setup lang="ts">
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useOverviewInfo } from "@/hooks/useOverviewInfo";
import { t } from "@/lang/i18n";
import { getProgressStrokeColor } from "@/tools/progressColor";
import type { LayoutCard } from "@/types";
import {
  AppstoreOutlined,
  FlagOutlined,
  HddOutlined,
  NodeExpandOutlined
} from "@ant-design/icons-vue";
import type { Component } from "vue";
import { computed } from "vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { state } = useOverviewInfo();
const { getMetaValue } = useLayoutCardTools(props.card);

const type = getMetaValue<string>("type");

interface BaseStatusItem {
  type: string;
  title: string;
  icon: Component;
}

interface NodeStatusItem extends BaseStatusItem {
  type: "node";
  available: number;
  total: number;
}

interface InstanceStatusItem extends BaseStatusItem {
  type: "instance";
  running: number;
  total: number;
}

interface UsersStatusItem extends BaseStatusItem {
  type: "users";
  loginFailed: number;
  logined: number;
}

interface SystemStatusItem extends BaseStatusItem {
  type: "system";
  cpuPercent: number;
  memUsedPercent: number;
  memUsedGB: number;
  memTotalGB: number;
}

type StatusItem = NodeStatusItem | InstanceStatusItem | UsersStatusItem | SystemStatusItem;

const computedStatusList = computed<StatusItem[]>(() => {
  if (!state.value) return [];

  const s = state.value;
  const memUsedPercent = Math.round(100 - Number(s.mem));
  const memTotalGB = Number((s.system.totalmem / 1024 / 1024 / 1024).toFixed(1));
  const memUsedGB = Number((memTotalGB - s.system.freemem / 1024 / 1024 / 1024).toFixed(1));

  return [
    {
      type: "node",
      title: t("TXT_CODE_4b7eba50"),
      icon: NodeExpandOutlined,
      available: s?.remoteCount?.available ?? 0,
      total: s?.remoteCount?.total ?? 0
    },
    {
      type: "instance",
      title: t("TXT_CODE_8201d2c6"),
      icon: AppstoreOutlined,
      running: s.runningInstance,
      total: s.totalInstance
    },
    {
      type: "users",
      title: t("TXT_CODE_871fb0d6"),
      icon: FlagOutlined,
      loginFailed: s.record.loginFailed,
      logined: s.record.logined
    },
    {
      type: "system",
      title: t("TXT_CODE_f4244bbf"),
      icon: HddOutlined,
      cpuPercent: s.cpu,
      memUsedPercent,
      memUsedGB,
      memTotalGB
    }
  ];
});

const realStatus = computed(() => computedStatusList.value.find((v) => v.type === type));

const systemBars = computed(() => {
  const s = realStatus.value;
  if (!s || s.type !== "system") return [];
  return [
    { label: "CPU", percent: s.cpuPercent },
    {
      label: t("TXT_CODE_593ee330"),
      percent: s.memUsedPercent,
      detail: `${s.memUsedGB} GB / ${s.memTotalGB} GB`
    }
  ];
});

const breakInNeed = (a: number, b: number = 0) => {
  const bigger = a > b ? a : b;
  if (bigger >= 10000)
    return {
      display: "block"
    };
  else return "";
};
</script>

<template>
  <CardPanel class="StatusBlock" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <div class="status-header">
        <a-typography-text class="status-header__title color-info">
          {{ realStatus?.title }}
        </a-typography-text>
      </div>

      <!-- Nodes: progress bar + two tags -->
      <template v-if="realStatus?.type === 'node'">
        <div class="status-text">
          <span class="status-text__highlight" :style="breakInNeed(realStatus.total)">
            {{ realStatus.available }}
          </span>
          / {{ realStatus.total }}
        </div>

        <component :is="realStatus?.icon" class="status-card-icon" />
      </template>

      <!-- Instances: progress bar + two tags -->
      <template v-else-if="realStatus?.type === 'instance'">
        <div class="status-text mb-10">
          <span class="status-text__highlight" :style="breakInNeed(realStatus.total)">{{
            realStatus.running
          }}</span>
          / {{ realStatus.total }}
        </div>

        <a-progress
          :percent="
            realStatus.total ? Math.round((realStatus.running / realStatus.total) * 100) : 0
          "
          :stroke-color="
            getProgressStrokeColor(
              realStatus.total ? Math.round((realStatus.running / realStatus.total) * 100) : 0
            )
          "
          :show-info="false"
          :stroke-width="12"
          style="max-width: 60%"
        />

        <component :is="realStatus?.icon" class="status-card-icon" />
      </template>

      <!-- User login: two tags -->
      <template v-else-if="realStatus?.type === 'users'">
        <div class="status-text">
          <span
            class="status-text__highlight"
            :style="breakInNeed(realStatus.loginFailed, realStatus.logined)"
          >
            {{ realStatus.loginFailed }}
          </span>
          / {{ realStatus.logined }}
        </div>

        <component :is="realStatus?.icon" class="status-card-icon" />
      </template>

      <!-- System CPU / RAM -->
      <template v-else-if="realStatus?.type === 'system'">
        <div class="status-bars">
          <div v-for="bar in systemBars" :key="bar.label" class="status-bar-item">
            <div class="status-bar-label">
              <span>{{ bar.label }}</span>
              <div class="status-bar-value">
                <span class="status-bar-value__percent">{{ bar.percent }}%</span>
                <span v-if="bar.detail" class="status-bar-value__detail">{{ bar.detail }}</span>
              </div>
            </div>
            <a-progress
              :percent="bar.percent"
              :stroke-color="getProgressStrokeColor(bar.percent)"
              :stroke-width="12"
              :show-info="false"
            />
          </div>
        </div>
      </template>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.status-text {
  font-size: 2rem;
  font-weight: 500;
  letter-spacing: -0.1em;
  color: #606060;
  font-family: auto;

  &__highlight {
    font-size: 3rem;
    font-weight: 600;
    color: var(--color-primary);
  }
}

.status-card-icon {
  position: absolute;
  right: 12px;
  font-size: 4rem;
  bottom: 10px;
  opacity: 0.1;
  transition: transform 0.25s ease-out;
  svg {
    fill: #fff;
  }
}

.status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  &__icon {
    font-size: 18px;
    color: var(--color-primary);
  }

  &__title {
    font-size: var(--font-body);
  }
}

.status-bars {
  display: flex;
  gap: 20px;
  margin-top: 4px;
  flex-direction: column;

  .status-bar-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-bar-value {
    display: flex;
    gap: 8px;
    align-items: center;

    &__percent {
      font-weight: 500;
    }

    &__detail {
      font-size: 12px;
      color: #909090;
    }
  }
}

.StatusBlock {
  position: relative;
}
</style>
