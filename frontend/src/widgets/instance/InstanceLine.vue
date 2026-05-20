<script setup lang="ts">
import { useDeleteInstanceDialog } from "@/components/fc/index";
import { useAppRouters } from "@/hooks/useAppRouters";
import { verifyEULA } from "@/hooks/useInstance";
import { t } from "@/lang/i18n";
import { openInstance, restartInstance, stopInstance } from "@/services/apis/instance";
import { formatMemoryUsage } from "@/tools/memory";
import { parseTimestamp } from "@/tools/time";
import { reportErrorMsg } from "@/tools/validator";
import type { InstanceDetail } from "@/types";
import { INSTANCE_STATUS, INSTANCE_STATUS_CODE } from "@/types/const";
import {
  CheckCircleOutlined,
  CodeOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FrownOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  UserOutlined
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import type { ColumnType } from "ant-design-vue/es/table";

const props = defineProps<{
  column: ColumnType<any>;
  record: Record<string, any>;
  targetInstanceInfo: InstanceDetail;
  targetDaemonId: string;
}>();

const emits = defineEmits(["refreshList"]);
const node = props.record?.node;

const instanceId = props.targetInstanceInfo?.instanceUuid;
const daemonId = props.targetDaemonId;

const operationConfig = {
  params: {
    uuid: instanceId || "",
    daemonId: daemonId || ""
  }
};

const { isLoading: openLoading, execute: executeOpen } = openInstance();
const { isLoading: stopLoading, execute: executeStop } = stopInstance();
const { isLoading: restartLoading, execute: executeRestart } = restartInstance();

const refreshList = () => {
  setTimeout(() => {
    emits("refreshList", daemonId, instanceId);
  }, 500);
};

const actions = {
  start: async () => {
    const flag = await verifyEULA(instanceId ?? "", daemonId ?? "");
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
  }
};

const execInstanceAction = async (actName: "start" | "stop" | "restart") => {
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

const tryDeleteInstance = async () => {
  const deleteInstanceResult = await useDeleteInstanceDialog(instanceId || "", daemonId || "");
  if (!deleteInstanceResult) return;
  message.success(t("TXT_CODE_f486dbb4"));
  refreshList();
};

const { toPage } = useAppRouters();
const toInstanceTerminal = async () => {
  toPage({
    path: "/instances/terminal",
    query: {
      daemonId,
      instanceId
    }
  });
};
</script>

<template>
  <div>
    <template v-if="column.key === 'name'">
      <DatabaseOutlined v-if="node && node?.available" style="margin-right: 8px" />
      <FrownOutlined v-else-if="node" style="margin-right: 8px" />
      <a v-if="!node" @click="toInstanceTerminal()">
        <a-typography-text
          :style="{ fontWeight: 'normal', maxWidth: '190px' }"
          :ellipsis="{ tooltip: record.name }"
          :content="record.name"
        />
      </a>
      <span v-else :style="{ fontWeight: 'bold' }">
        {{ record.name }}
      </span>
    </template>

    <template v-else-if="column.key === 'status' && !node">
      <a-tag
        :color="
          props.targetInstanceInfo?.status === INSTANCE_STATUS_CODE.RUNNING
            ? 'green'
            : props.targetInstanceInfo?.status === INSTANCE_STATUS_CODE.STARTING
            ? 'pink'
            : ''
        "
      >
        <span>
          <CheckCircleOutlined v-if="record.inst?.moreInfo?.isRunning" />
          <ExclamationCircleOutlined v-else />
          {{
            t(String(INSTANCE_STATUS[props.targetInstanceInfo?.status ?? -1])) ||
            t("TXT_CODE_c8333afa")
          }}
        </span>
      </a-tag>
    </template>

    <template v-else-if="column.key === 'type' && !node">
      {{ record.inst.moreInfo?.instanceTypeText }}
    </template>

    <template v-else-if="column.key === 'lastDatetime' && !node">
      {{ parseTimestamp(record.inst.config?.lastDatetime) }}
    </template>

    <template v-else-if="column.key === 'resources' && !node">
      <a-space warp :size="4">
        <a-tag v-if="record.inst.info?.cpuUsage != null">
          CPU: {{ parseInt(String(record.inst.info.cpuUsage)) }}%
        </a-tag>
        <a-tag v-if="record.inst.info?.memoryUsage != null">
          RAM:
          {{ formatMemoryUsage(record.inst.info.memoryUsage, record.inst.info.memoryLimit) }}
        </a-tag>
      </a-space>
    </template>

    <template v-else-if="column.key === 'players' && !node">
      <div v-if="record.inst.info?.mcPingOnline">
        <UserOutlined />
        {{ record.inst.info?.currentPlayers }} / {{ record.inst.info?.maxPlayers }}
      </div>
    </template>

    <template v-else-if="column.key === 'actions' && !node">
      <a-space warp :size="6" style="padding-right: 10px">
        <a-button
          v-if="record.inst.moreInfo?.isStopped"
          size="small"
          :loading="openLoading"
          @click.stop="execInstanceAction('start')"
        >
          <PlayCircleOutlined style="font-size: 13px" />
        </a-button>
        <a-button
          v-if="record.inst.moreInfo?.isRunning"
          size="small"
          :loading="stopLoading"
          @click.stop="execInstanceAction('stop')"
        >
          <PauseCircleOutlined style="font-size: 13px" />
        </a-button>
        <a-button
          size="small"
          :disabled="!record.inst.moreInfo?.isRunning"
          :loading="restartLoading"
          @click.stop="execInstanceAction('restart')"
        >
          <RedoOutlined style="font-size: 13px" />
        </a-button>
        <a-button size="small" @click.stop="toInstanceTerminal()">
          <CodeOutlined style="font-size: 13px" />
        </a-button>
        <a-button size="small" danger @click.stop="tryDeleteInstance()">
          <DeleteOutlined style="font-size: 13px" />
        </a-button>
      </a-space>
    </template>
  </div>
</template>
