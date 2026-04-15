<script setup lang="ts">
import TerminalCore from "@/components/TerminalCore.vue";
import TerminalTopTags from "@/components/TerminalTopTags.vue";
import { INSTANCE_TYPE_TRANSLATION, verifyEULA } from "@/hooks/useInstance";
import { t } from "@/lang/i18n";
import {
  killInstance,
  openInstance,
  restartInstance,
  stopInstance
} from "@/services/apis/instance";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { formatMemoryUsage } from "@/tools/memory";
import { parseTimestamp } from "@/tools/time";
import { reportErrorMsg } from "@/tools/validator";
import type { InstanceDetail, LayoutCard } from "@/types";
import { INSTANCE_STATUS, INSTANCE_STATUS_CODE } from "@/types/const";
import {
  CheckCircleOutlined,
  CloseOutlined,
  CloudServerOutlined,
  CodeOutlined,
  ControlOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
  FolderOpenOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  UsbOutlined
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useTerminal } from "../../hooks/useTerminal";

type WorkspaceInstance = InstanceDetail & {
  daemonIp?: string;
  daemonPort?: number;
  daemonRemarks?: string;
};

type ActionItem = {
  title: string;
  icon: any;
  click: () => void;
  danger?: boolean;
  loading?: boolean;
  confirm?: boolean;
};

type FunctionItem = {
  title: string;
  icon: any;
  click: () => void;
};

const props = defineProps<{
  card: LayoutCard;
  targetInstanceInfo: WorkspaceInstance;
  targetDaemonId: string;
}>();

const emit = defineEmits<{
  refreshList: [];
}>();

const router = useRouter();
const { state: appState, isAdmin } = useAppStateStore();
const terminalHook = useTerminal();
const { state: terminalState, clearTerminal, resetTerminalSession } = terminalHook;

const { execute: executeOpen, isLoading: openLoading } = openInstance();
const { execute: executeStop, isLoading: stopLoading } = stopInstance();
const { execute: executeRestart, isLoading: restartLoading } = restartInstance();
const { execute: executeKill, isLoading: killLoading } = killInstance();

const instanceId = computed(() => props.targetInstanceInfo.instanceUuid);
const daemonId = computed(() => props.targetDaemonId);
const currentTerminalState = computed(() =>
  terminalState.value?.instanceUuid === instanceId.value ? terminalState.value : undefined
);
const workspaceInfo = computed(() => currentTerminalState.value || props.targetInstanceInfo);
const terminalKey = computed(() => `${daemonId.value}:${instanceId.value}`);
const terminalReady = ref(true);
const terminalHeight = computed(() => "clamp(320px, calc(100vh - 440px), 560px)");

const instanceName = computed(() => workspaceInfo.value?.config?.nickname || "--");
const instanceTypeText = computed(
  () => INSTANCE_TYPE_TRANSLATION[workspaceInfo.value?.config?.type ?? ""] || "--"
);
const instanceStatusText = computed(
  () => INSTANCE_STATUS[workspaceInfo.value?.status ?? -1] || "--"
);
const isRunning = computed(() => workspaceInfo.value?.status === INSTANCE_STATUS_CODE.RUNNING);
const isStopped = computed(() => workspaceInfo.value?.status === INSTANCE_STATUS_CODE.STOPPED);
const isBusy = computed(() => workspaceInfo.value?.status === INSTANCE_STATUS_CODE.BUSY);
const isStarting = computed(() => workspaceInfo.value?.status === INSTANCE_STATUS_CODE.STARTING);
const isMinecraftJava = computed(() =>
  workspaceInfo.value?.config?.type?.startsWith("minecraft/java")
);
const canFileManager = computed(() => appState.settings.canFileManager || isAdmin.value);

const nodeName = computed(() => {
  if (props.targetInstanceInfo.daemonRemarks) return props.targetInstanceInfo.daemonRemarks;
  if (props.targetInstanceInfo.daemonIp) {
    return `${props.targetInstanceInfo.daemonIp}:${props.targetInstanceInfo.daemonPort || ""}`;
  }
  return daemonId.value;
});

const memoryText = computed(() => {
  const info = workspaceInfo.value?.info;
  if (info?.memoryUsage == null) return "--";
  return formatMemoryUsage(info.memoryUsage, info.memoryLimit);
});

const playerText = computed(() => {
  const info = workspaceInfo.value?.info;
  if (!info?.mcPingOnline) return "--";
  return `${info.currentPlayers} / ${info.maxPlayers}`;
});

const refreshListLater = () => {
  setTimeout(() => emit("refreshList"), 700);
};

const getOperationParams = () => ({
  params: {
    uuid: instanceId.value,
    daemonId: daemonId.value
  }
});

const startInstance = async () => {
  try {
    if (isMinecraftJava.value) {
      const flag = await verifyEULA(instanceId.value, daemonId.value);
      if (!flag) return;
    }
    clearTerminal();
    await executeOpen(getOperationParams());
    message.success(t("TXT_CODE_e13abbb1"));
    refreshListLater();
  } catch (error: any) {
    reportErrorMsg(error);
  }
};

const stopSelectedInstance = async () => {
  try {
    await executeStop(getOperationParams());
    message.success(t("TXT_CODE_efb6d377"));
    refreshListLater();
  } catch (error: any) {
    reportErrorMsg(error);
  }
};

const restartSelectedInstance = async () => {
  try {
    clearTerminal();
    await executeRestart(getOperationParams());
    message.success(t("TXT_CODE_efb6d377"));
    refreshListLater();
  } catch (error: any) {
    reportErrorMsg(error);
  }
};

const killSelectedInstance = async () => {
  try {
    await executeKill(getOperationParams());
    message.success(t("TXT_CODE_efb6d377"));
    refreshListLater();
  } catch (error: any) {
    reportErrorMsg(error);
  }
};

const openFeatureRoute = (path: string, extraQuery: Record<string, any> = {}) => {
  router.push({
    path,
    query: {
      daemonId: daemonId.value,
      instanceId: instanceId.value,
      ...extraQuery
    }
  });
};

const actionItems = computed<ActionItem[]>(() => {
  const items: ActionItem[] = [];
  if (isStopped.value) {
    items.push({
      title: t("TXT_CODE_57245e94"),
      icon: PlayCircleOutlined,
      click: startInstance,
      loading: openLoading.value
    });
  }
  if (isRunning.value) {
    items.push({
      title: t("TXT_CODE_b1dedda3"),
      icon: PauseCircleOutlined,
      click: stopSelectedInstance,
      loading: stopLoading.value,
      confirm: true
    });
    items.push({
      title: t("TXT_CODE_47dcfa5"),
      icon: RedoOutlined,
      click: restartSelectedInstance,
      loading: restartLoading.value,
      confirm: true
    });
  }
  if (!isStopped.value) {
    items.push({
      title: t("TXT_CODE_7b67813a"),
      icon: CloseOutlined,
      click: killSelectedInstance,
      loading: killLoading.value,
      danger: true,
      confirm: true
    });
  }
  return items;
});

const functionItems = computed<FunctionItem[]>(() =>
  [
    {
      title: t("TXT_CODE_524e3036"),
      icon: CodeOutlined,
      click: () => openFeatureRoute("/instances/terminal")
    },
    canFileManager.value && {
      title: t("TXT_CODE_ae533703"),
      icon: FolderOpenOutlined,
      click: () => openFeatureRoute("/instances/terminal/files")
    },
    {
      title: t("TXT_CODE_d07742fe"),
      icon: ControlOutlined,
      click: () =>
        openFeatureRoute("/instances/terminal/serverConfig", {
          type: workspaceInfo.value?.config?.type
        })
    },
    isMinecraftJava.value &&
      canFileManager.value && {
        title: t("TXT_CODE_MOD_MANAGER"),
        icon: UsbOutlined,
        click: () => openFeatureRoute("/instances/terminal/mods")
      },
    {
      title: t("TXT_CODE_b7d026f8"),
      icon: FieldTimeOutlined,
      click: () => openFeatureRoute("/instances/schedule")
    }
  ].filter(Boolean) as FunctionItem[]
);

watch(terminalKey, async () => {
  terminalReady.value = false;
  resetTerminalSession();
  await nextTick();
  terminalReady.value = true;
});
</script>

<template>
  <div class="instance-workspace">
    <div class="instance-workspace__header">
      <div class="instance-workspace__title">
        <CloudServerOutlined />
        <div>
          <div class="instance-workspace__name">{{ instanceName }}</div>
          <div class="instance-workspace__node">{{ nodeName }}</div>
        </div>
      </div>
      <div class="instance-workspace__actions">
        <template v-for="item in actionItems" :key="item.title">
          <a-popconfirm
            v-if="item.confirm"
            :title="t('TXT_CODE_276756b2')"
            @confirm="item.click"
          >
            <a-button :danger="item.danger" :loading="item.loading">
              <component :is="item.icon" />
              {{ item.title }}
            </a-button>
          </a-popconfirm>
          <a-button
            v-else
            :danger="item.danger"
            :loading="item.loading"
            @click="item.click"
          >
            <component :is="item.icon" />
            {{ item.title }}
          </a-button>
        </template>
      </div>
    </div>

    <div class="instance-workspace__meta">
      <a-tag v-if="isRunning" color="green">
        <CheckCircleOutlined />
        {{ instanceStatusText }}
      </a-tag>
      <a-tag v-else-if="isBusy || isStarting" color="pink">
        <LoadingOutlined />
        {{ instanceStatusText }}
      </a-tag>
      <a-tag v-else>
        <ExclamationCircleOutlined />
        {{ instanceStatusText }}
      </a-tag>
      <a-tag color="purple">{{ instanceTypeText }}</a-tag>
      <a-tag v-for="tag in workspaceInfo?.config?.tag || []" :key="tag">{{ tag }}</a-tag>
    </div>

    <div class="instance-workspace__terminal">
      <div class="mb-10">
        <TerminalTopTags :info="workspaceInfo?.info" :is-stopped="isStopped" />
      </div>
      <TerminalCore
        v-if="terminalReady"
        :key="terminalKey"
        :use-terminal-hook="terminalHook"
        :instance-id="instanceId"
        :daemon-id="daemonId"
        :height="terminalHeight"
      />
    </div>

    <div class="instance-workspace__bottom">
      <div class="instance-workspace__panel">
        <div class="instance-workspace__panel-title">基本信息</div>
        <div class="instance-workspace__info-grid">
          <div>
            <span>内存</span>
            <strong>{{ memoryText }}</strong>
          </div>
          <div>
            <span>在线人数</span>
            <strong>{{ playerText }}</strong>
          </div>
          <div>
            <span>启动次数</span>
            <strong>{{ workspaceInfo?.started ?? "--" }}</strong>
          </div>
          <div>
            <span>自动重启</span>
            <strong>{{ workspaceInfo?.autoRestarted ?? "--" }}</strong>
          </div>
          <div>
            <span>最后启动</span>
            <strong>{{ parseTimestamp(workspaceInfo?.config?.lastDatetime) || "--" }}</strong>
          </div>
          <div>
            <span>实例 ID</span>
            <strong class="text-monospace">{{ instanceId }}</strong>
          </div>
        </div>
      </div>

      <div class="instance-workspace__panel">
        <div class="instance-workspace__panel-title">功能组</div>
        <div class="instance-workspace__functions">
          <button
            v-for="item in functionItems"
            :key="item.title"
            class="instance-workspace__function"
            type="button"
            @click="item.click"
          >
            <component :is="item.icon" />
            <span>{{ item.title }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.instance-workspace {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.instance-workspace__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.instance-workspace__title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  font-size: 22px;
}

.instance-workspace__name {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}

.instance-workspace__node {
  margin-top: 4px;
  color: var(--color-gray-7);
  font-size: 12px;
}

.instance-workspace__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.instance-workspace__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.instance-workspace__terminal {
  position: relative;
  min-width: 0;
}

.instance-workspace__bottom {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .instance-workspace__panel:first-child {
    order: 2;
  }

  .instance-workspace__panel:last-child {
    order: 1;
  }
}

.instance-workspace__panel {
  border: 1px solid var(--card-border-color);
  border-radius: 14px;
  padding: 14px 16px;
  background: rgba(250, 252, 255, 0.78);
}

.instance-workspace__panel-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
}

.instance-workspace__info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;

  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  span {
    color: var(--color-gray-7);
    font-size: 12px;
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }
}

.instance-workspace__functions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.instance-workspace__function {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid var(--card-border-color);
  border-radius: 10px;
  background: var(--color-gray-1);
  color: inherit;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.text-monospace {
  font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace;
}

</style>
