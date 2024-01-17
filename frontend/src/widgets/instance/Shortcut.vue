<script setup lang="ts">
import { h, computed } from "vue";
import { t } from "@/lang/i18n";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { message } from "ant-design-vue";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  RedoOutlined,
  CloseOutlined,
  CloudDownloadOutlined,
  CodeOutlined
} from "@ant-design/icons-vue";
import {
  openInstance,
  stopInstance,
  restartInstance,
  killInstance,
  updateInstance
} from "@/services/apis/instance";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useInstanceInfo } from "@/hooks/useInstance";
import { useAppRouters } from "@/hooks/useAppRouters";
import { parseTimestamp } from "@/tools/time";
import { arrayFilter } from "@/tools/array";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";

const props = defineProps<{
  card: LayoutCard;
}>();

const { containerState } = useLayoutContainerStore();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const { toPage } = useAppRouters();
const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const { statusText, isRunning, isStopped, instanceTypeText, instanceInfo } = useInstanceInfo({
  instanceId,
  daemonId,
  autoRefresh: true
});

const operationConfig = {
  params: {
    uuid: instanceId || "",
    daemonId: daemonId || ""
  }
};

const { isLoading: openLoading, execute: executeOpen } = openInstance();
const { isLoading: stopLoading, execute: executeStop } = stopInstance();
const { isLoading: restartLoading, execute: executeRestart } = restartInstance();
const { isLoading: killLoading, execute: executeKill } = killInstance();
const { isLoading: updateLoading, execute: executeUpdate } = updateInstance();

const instanceOperations = computed(() =>
  arrayFilter([
    {
      title: t("TXT_CODE_57245e94"),
      icon: PlayCircleOutlined,
      click: async () => {
        await executeOpen(operationConfig);
        message.success(t("TXT_CODE_e13abbb1"));
      },
      loading: openLoading.value,
      disabled: containerState.isDesignMode,
      condition: () => isStopped.value
    },
    {
      title: t("TXT_CODE_b1dedda3"),
      icon: PauseCircleOutlined,
      click: async () => {
        await executeStop(operationConfig);
        message.success(t("TXT_CODE_efb6d377"));
      },
      loading: stopLoading.value,
      disabled: containerState.isDesignMode,
      condition: () => isRunning.value
    },
    {
      title: t("TXT_CODE_47dcfa5"),
      icon: RedoOutlined,
      click: async () => {
        await executeRestart(operationConfig);
        message.success(t("TXT_CODE_b11166e7"));
      },
      loading: restartLoading.value,
      disabled: containerState.isDesignMode,
      condition: () => isRunning.value
    },
    {
      title: t("TXT_CODE_7b67813a"),
      icon: CloseOutlined,
      click: async () => {
        await executeKill(operationConfig);
        message.success(t("TXT_CODE_efb6d377"));
      },
      loading: killLoading.value,
      disabled: containerState.isDesignMode,
      condition: () => isRunning.value
    },
    {
      title: t("TXT_CODE_40ca4f2"),
      icon: CloudDownloadOutlined,
      click: async () => {
        await executeUpdate({
          params: {
            uuid: instanceId || "",
            daemonId: daemonId || "",
            task_name: "update"
          },
          data: {
            time: new Date().getTime()
          }
        });
        message.success(t("TXT_CODE_b1600db0"));
      },
      loading: updateLoading.value,
      disabled: containerState.isDesignMode,
      condition: () => isStopped.value
    },
    {
      title: t("TXT_CODE_524e3036"),
      icon: CodeOutlined,
      click: () => {
        toPage({
          path: "/instances/terminal",
          query: {
            daemonId,
            instanceId
          }
        });
      },
      disabled: containerState.isDesignMode
    }
  ])
);
</script>

<template>
  <div style="width: 100%; position: relative">
    <CardPanel>
      <template #title>
        {{ instanceInfo?.config.nickname }}
      </template>
      <template #body>
        <a-typography-paragraph>
          <div>
            {{ t("TXT_CODE_e70a8e24") }}
            <span v-if="isRunning" class="color-success">
              <CheckCircleOutlined />
              {{ statusText }}
            </span>
            <span v-else-if="isStopped" class="color-info">
              {{ statusText }}
            </span>
            <span v-else>
              <ExclamationCircleOutlined />
              {{ statusText }}
            </span>
          </div>
          <div>
            {{ t("TXT_CODE_68831be6") }}
            {{ instanceTypeText }}
          </div>
          <div>
            {{ t("TXT_CODE_d31a684c") }}
            {{ parseTimestamp(instanceInfo?.config.lastDatetime) }}
          </div>
          <div>
            {{ t("TXT_CODE_ae747cc0") }}
            {{ parseTimestamp(instanceInfo?.config.endTime) }}
          </div>
        </a-typography-paragraph>
        <a-space warp :size="15">
          <a-tooltip v-for="item in instanceOperations" :key="item.title" :title="item.title">
            <a-button
              :icon="h(item.icon)"
              :loading="item.loading"
              :disabled="item.disabled"
              @click="item.click"
            />
          </a-tooltip>
        </a-space>
      </template>
    </CardPanel>
  </div>
</template>
