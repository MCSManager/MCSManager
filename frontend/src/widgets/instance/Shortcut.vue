<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "@/lang/i18n";
import CardPanel from "@/components/CardPanel.vue";
import type { InstanceDetail, LayoutCard } from "@/types/index";
import { message } from "ant-design-vue";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  RedoOutlined,
  CloseOutlined,
  CloudDownloadOutlined,
  CodeOutlined,
  UserOutlined,
  TagsOutlined,
  DeleteOutlined
} from "@ant-design/icons-vue";
import {
  openInstance,
  stopInstance,
  restartInstance,
  killInstance,
  updateInstance
} from "@/services/apis/instance";
import { Modal } from "ant-design-vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useInstanceInfo, verifyEULA } from "@/hooks/useInstance";
import { useAppRouters } from "@/hooks/useAppRouters";
import { parseTimestamp } from "@/tools/time";
import { arrayFilter } from "@/tools/array";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { reportErrorMsg } from "@/tools/validator";
import { openInstanceTagsEditor, useDeleteInstanceDialog } from "@/components/fc/index";
import _ from "lodash";

const props = defineProps<{
  card: LayoutCard;
  targetInstanceInfo?: InstanceDetail;
  targetDaemonId?: string;
}>();

const emits = defineEmits(["refreshList"]);

const { containerState } = useLayoutContainerStore();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const { toPage } = useAppRouters();
const instanceId = props.targetInstanceInfo?.instanceUuid || getMetaOrRouteValue("instanceId");
const daemonId = props.targetDaemonId || getMetaOrRouteValue("daemonId");

const { statusText, isRunning, isStopped, instanceTypeText, instanceInfo } = useInstanceInfo({
  instanceId: props.targetInstanceInfo ? undefined : instanceId,
  daemonId: props.targetInstanceInfo ? undefined : daemonId,
  autoRefresh: props.targetInstanceInfo ? false : true,
  instanceInfo: props.targetInstanceInfo ? ref(props.targetInstanceInfo) : undefined
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

const refreshList = () => {
  setTimeout(() => {
    emits("refreshList");
  }, 500);
};

const actions = {
  start: async () => {
    const flag = await verifyEULA(
      instanceId ?? "",
      daemonId ?? "",
      instanceInfo.value?.config.type ?? ""
    );
    if (!flag) return;
    await executeOpen(operationConfig);
    message.success(t("TXT_CODE_e13abbb1"));
  },
  stop: async () => {
    await executeStop(operationConfig);
    message.success(t("TXT_CODE_efb6d377"));
  },
  restart: async () => {
    await executeRestart(operationConfig);
    message.success(t("TXT_CODE_efb6d377"));
  },
  kill: async () => {
    await executeKill(operationConfig);
    message.success(t("TXT_CODE_efb6d377"));
  },
  update: async () => {
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
  }
};

const execInstanceAction = async (
  event: MouseEvent,
  actName: "start" | "stop" | "restart" | "kill" | "update"
) => {
  const action = actions[actName];
  try {
    if (action) {
      await action();
      refreshList();
    }
  } catch (error) {
    reportErrorMsg(error);
  }
};

const instanceOperations = computed(() =>
  arrayFilter([
    {
      title: t("TXT_CODE_57245e94"),
      icon: PlayCircleOutlined,
      click: async (event: MouseEvent) => {
        event.stopPropagation();
        await execInstanceAction(event, "start");
      },
      loading: openLoading.value,
      disabled: containerState.isDesignMode,
      condition: () => isStopped.value
    },
    {
      title: t("TXT_CODE_b1dedda3"),
      icon: PauseCircleOutlined,
      click: (event: MouseEvent) => {
        event.stopPropagation();
        Modal.confirm({
          title: t("TXT_CODE_893567ac"),
          content: t("TXT_CODE_6da85509"),
          onOk: async () => {
            execInstanceAction(event, "stop");
          }
        });
        return false;
      },
      loading: stopLoading.value,
      disabled: containerState.isDesignMode,
      condition: () => isRunning.value
    },
    {
      title: t("TXT_CODE_47dcfa5"),
      icon: RedoOutlined,
      click: async (event: MouseEvent) => {
        event.stopPropagation();
        Modal.confirm({
          title: t("TXT_CODE_893567ac"),
          content: t("TXT_CODE_f6bd907d"),
          onOk: async () => {
            execInstanceAction(event, "restart");
          }
        });
      },
      loading: restartLoading.value,
      disabled: containerState.isDesignMode,
      condition: () => isRunning.value
    },
    {
      title: t("TXT_CODE_40ca4f2"),
      icon: CloudDownloadOutlined,
      click: async (event: MouseEvent) => {
        event.stopPropagation();
        execInstanceAction(event, "update");
      },
      loading: updateLoading.value,
      disabled: containerState.isDesignMode,
      condition: () => isStopped.value
    },
    {
      title: t("TXT_CODE_7b67813a"),
      icon: CloseOutlined,
      click: async (event: MouseEvent) => {
        event.stopPropagation();
        Modal.confirm({
          title: t("TXT_CODE_893567ac"),
          content: t("TXT_CODE_ec08484"),
          onOk: async () => {
            execInstanceAction(event, "kill");
          }
        });
      },
      loading: killLoading.value,
      disabled: containerState.isDesignMode,
      danger: true,
      condition: () => !isStopped.value
    },
    {
      area: true
    },
    {
      title: t("TXT_CODE_78e88c3f"),
      icon: TagsOutlined,
      click: async (event: MouseEvent) => {
        event.stopPropagation();
        if (instanceId && daemonId) {
          const tags = instanceInfo.value?.config.tag || [];
          const newTags = await openInstanceTagsEditor(instanceId, daemonId, tags);
          if (!_.isEqual(newTags, tags)) refreshList();
        }
      },
      disabled: containerState.isDesignMode
    },
    {
      title: t("TXT_CODE_524e3036"),
      icon: CodeOutlined,
      click: (event: MouseEvent) => {
        event.stopPropagation();
        toPage({
          path: "/instances/terminal",
          query: {
            daemonId,
            instanceId
          }
        });
      },
      disabled: containerState.isDesignMode
    },
    {
      title: t("TXT_CODE_a0e19f38"),
      icon: DeleteOutlined,
      click: async (event: MouseEvent) => {
        event.stopPropagation();
        const deleteInstanceResult = await useDeleteInstanceDialog(
          instanceId || "",
          daemonId || ""
        );
        if (!deleteInstanceResult) return;
        message.success(t("TXT_CODE_f486dbb4"));
        refreshList();
      },
      danger: true,
      disabled: containerState.isDesignMode
    }
  ])
);
</script>

<template>
  <CardPanel style="width: 100%; height: 100%; position: relative">
    <template #title>
      {{ instanceInfo?.config.nickname }}
    </template>
    <template #operator> </template>
    <template #body>
      <a-typography-paragraph>
        <div class="mb-6">
          <a-tag :color="isRunning ? 'green' : ''">
            <span v-if="isRunning">
              <CheckCircleOutlined />
              {{ statusText }}
            </span>
            <span v-else-if="isStopped" class="color-info">
              <ExclamationCircleOutlined />
              {{ statusText }}
            </span>
            <span v-else>
              <ExclamationCircleOutlined />
              {{ statusText }}
            </span>
          </a-tag>
          <a-tag>
            {{ instanceTypeText }}
          </a-tag>
        </div>

        <div
          v-if="instanceInfo?.config.tag && instanceInfo?.config.tag.length > 0"
          class="instance-tag-container mb-6"
        >
          <a-tag
            v-for="item in instanceInfo?.config.tag"
            :key="item"
            class="group-name-tag"
            color="blue"
          >
            {{ item }}
          </a-tag>
        </div>

        <div>
          {{ t("TXT_CODE_d31a684c") }}
          {{ parseTimestamp(instanceInfo?.config.lastDatetime) }}
        </div>
        <div>
          {{ t("TXT_CODE_ae747cc0") }}
          {{ parseTimestamp(instanceInfo?.config.endTime) }}
        </div>
        <div v-if="instanceInfo?.info.mcPingOnline">
          <span class="mr-2">{{ t("TXT_CODE_33a09033") }}</span>
          <span style="vertical-align: middle">
            <UserOutlined />
            {{ instanceInfo?.info.currentPlayers }} / {{ instanceInfo?.info.maxPlayers }}
          </span>
        </div>
      </a-typography-paragraph>
      <a-space warp :size="6" class="mb-4">
        <div v-for="item in instanceOperations" :key="item.title">
          <a-divider v-if="item.area" type="vertical" />
          <a-tooltip v-else :title="item.title">
            <a-button
              size="small"
              :loading="item.loading"
              :disabled="item.disabled"
              :danger="item.danger"
              @click="item.click"
            >
              <component :is="item.icon" style="font-size: 13px"></component>
            </a-button>
          </a-tooltip>
        </div>
      </a-space>
    </template>
  </CardPanel>
</template>

<style clang="scss" scoped>
.instance-card {
  cursor: pointer;
  min-height: 170px;
}
.instance-card:hover {
  border: 1px solid var(--color-gray-8);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
}
.instance-tag-container {
  margin-left: -4px;
  margin-right: -4px;
  .group-name-tag {
    margin: 4px;
  }
}
</style>
