<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { ref, computed, onMounted } from "vue";
import { t } from "@/lang/i18n";
import {
  SettingOutlined,
  CodeOutlined,
  BlockOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CloudServerOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from "@ant-design/icons-vue";
import { useOverviewInfo, type ComputedNodeInfo } from "@/hooks/useOverviewInfo";
import IconBtn from "@/components/IconBtn.vue";
import NodeSimpleChart from "@/components/NodeSimpleChart.vue";
import { connectNode } from "@/services/apis";
import { message } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import { useAppRouters } from "@/hooks/useAppRouters";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import type { LayoutCard } from "@/types";
import { arrayFilter } from "@/tools/array";
import { GLOBAL_INSTANCE_UUID } from "@/config/const";
import NodeDetailDialog from "./NodeDetailDialog.vue";
import { SocketStatus, useSocketIoClient } from "@/hooks/useSocketIo";
import { hasVersionUpdate } from "@/tools/version";

const { testFrontendSocket, socketStatus } = useSocketIoClient();

const nodeDetailDialog = ref<InstanceType<typeof NodeDetailDialog>>();

const props = defineProps<{
  item?: ComputedNodeInfo;
  card?: LayoutCard;
}>();

const { state: AllDaemonData } = useOverviewInfo();

const itemDaemonId = ref<string>();
const specifiedDaemonVersion = computed(() => AllDaemonData.value?.specifiedDaemonVersion);

const remoteNode = computed(() => {
  const myDaemon = AllDaemonData.value?.remote.find((node) => {
    return node.uuid === itemDaemonId.value;
  });
  return myDaemon ?? props.item;
});

if (props.card) {
  const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
  const daemonId = getMetaOrRouteValue("daemonId");
  if (daemonId) {
    itemDaemonId.value = daemonId;
  }
}

const tryConnectNode = async (uuid: string, showMsg = true) => {
  const { execute } = connectNode();
  try {
    await execute({
      params: {
        uuid: uuid
      }
    });
    if (showMsg) message.success(t("TXT_CODE_7f0c746d"));
  } catch (error: any) {
    reportErrorMsg(t("TXT_CODE_6a365d01"));
  }
};

const { toPage } = useAppRouters();

const detailList = (node: ComputedNodeInfo) => [
  {
    title: t("TXT_CODE_f52079a0"),
    value: `${node.ip}:${node.port}`
  },
  {
    title: t("TXT_CODE_7c0b7608"),
    value: node.available ? t("TXT_CODE_823bfe63") : t("TXT_CODE_66ce073e"),
    warn: node.available === false,
    success: node.available === true,
    warnText: t("TXT_CODE_1c2efd38")
  },
  {
    title: t("TXT_CODE_930d2524"),
    value:
      socketStatus.value === SocketStatus.Connected
        ? t("TXT_CODE_e039b9b5")
        : t("TXT_CODE_23a3bd72"),
    warn: socketStatus.value === SocketStatus.Error,
    success: socketStatus.value === SocketStatus.Connected,
    loading: socketStatus.value === SocketStatus.Connecting,
    warnText: t("TXT_CODE_6b4a27dd")
  },
  {
    title: t("TXT_CODE_a788e3eb"),
    value: (node.memText || "") + "\n" + (node.cpuInfo || "")
  },

  {
    title: t("TXT_CODE_3d602459"),
    value: node.instanceStatus
  },

  {
    title: t("TXT_CODE_3d0885c0"),
    value: node.platformText
  },
  {
    title: t("TXT_CODE_81634069"),
    value: node.version,
    success: !hasVersionUpdate(specifiedDaemonVersion.value, node.version),
    warn: hasVersionUpdate(specifiedDaemonVersion.value, node.version) && node.available,
    warnText: t("TXT_CODE_e520908a")
  },
  {
    title: "Daemon ID",
    value: node.uuid,
    onlyCopy: true
  }
];

const nodeOperations = computed(() =>
  arrayFilter([
    {
      title: t("TXT_CODE_ae533703"),
      icon: FolderOpenOutlined,
      click: (item: ComputedNodeInfo) => {
        const daemonId = item.uuid;
        const instanceId = GLOBAL_INSTANCE_UUID;
        toPage({
          path: "/instances/terminal/files",
          query: {
            daemonId,
            instanceId
          }
        });
      },
      condition: () => remoteNode.value!.available
    },
    {
      title: t("TXT_CODE_524e3036"),
      icon: CodeOutlined,
      click: (item: ComputedNodeInfo) => {
        const daemonId = item.uuid;
        const instanceId = GLOBAL_INSTANCE_UUID;
        toPage({
          path: "/instances/terminal",
          query: {
            daemonId,
            instanceId
          }
        });
      },
      condition: () => remoteNode.value!.available
    },
    {
      title: t("TXT_CODE_e6c30866"),
      icon: BlockOutlined,
      click: (item: ComputedNodeInfo) => {
        const daemonId = item.uuid;
        toPage({
          path: "/node/image",
          query: {
            daemonId
          }
        });
      },
      condition: () => remoteNode.value!.available
    },
    {
      title: t("TXT_CODE_f8b28901"),
      icon: ReloadOutlined,
      click: async (node: ComputedNodeInfo) => {
        await tryConnectNode(node.uuid);
      },
      condition: () => !remoteNode.value!.available
    },
    {
      title: t("TXT_CODE_b5c7b82d"),
      icon: SettingOutlined,
      click: (node: ComputedNodeInfo) => {
        nodeDetailDialog.value?.openDialog(node, node.uuid);
      }
    }
  ])
);

onMounted(() => {
  testFrontendSocket(remoteNode.value);
});
</script>

<template>
  <div style="height: 100%" class="container">
    <CardPanel style="height: 100%">
      <template #title>
        <div class="flex-center">
          <span :class="{ 'color-danger': !remoteNode?.available }">
            <CloudServerOutlined />
            {{ remoteNode?.remarks || remoteNode?.ip }}
          </span>
        </div>
      </template>
      <template v-if="remoteNode" #operator>
        <span
          v-for="operation in nodeOperations"
          :key="operation.title"
          size="default"
          class="mr-2"
        >
          <IconBtn
            :icon="operation.icon"
            :title="operation.title"
            @click="remoteNode && operation.click(remoteNode)"
          ></IconBtn>
        </span>
      </template>
      <template v-if="remoteNode" #body>
        <a-row :gutter="[24, 24]" class="mt-2">
          <a-col
            v-for="detail in detailList(remoteNode)"
            :key="detail.title + detail.value"
            :span="6"
          >
            <a-typography-paragraph>
              <div :title="detail.onlyCopy ? detail.value : ''">
                {{ detail.title }}
              </div>

              <div v-if="detail.onlyCopy">
                <a-typography-text :copyable="{ text: detail.value ?? '' }"></a-typography-text>
              </div>
              <div v-else style="font-size: 13px">
                <a-tooltip v-if="detail.warn && detail.value">
                  <template #title>
                    {{ detail.warnText }}
                  </template>
                  <span class="color-danger"><InfoCircleOutlined /> {{ detail.value }}</span>
                </a-tooltip>
                <span v-else-if="detail.loading">
                  <div class="flex mt-4">
                    <LoadingOutlined style="font-size: 18px" />
                  </div>
                </span>
                <span v-else-if="detail.success">
                  <span class="color-success"><CheckCircleOutlined /> {{ detail.value }}</span>
                </span>
                <span v-else style="white-space: pre-wrap">{{
                  String(detail.value ?? "").trim() ? detail.value : "--"
                }}</span>
              </div>
            </a-typography-paragraph>
          </a-col>
        </a-row>
        <NodeSimpleChart
          class="mt-24"
          :cpu-data="remoteNode.cpuChartData ?? []"
          :mem-data="remoteNode.memChartData ?? []"
        />
      </template>
    </CardPanel>
  </div>
  <NodeDetailDialog ref="nodeDetailDialog"></NodeDetailDialog>
</template>

<style lang="scss" scoped>
.search-input {
  transition: all 0.4s;
  text-align: center;
  width: 50%;
}

@media (max-width: 992px) {
  .search-input {
    transition: all 0.4s;
    text-align: center;
    width: 100% !important;
  }
}

.search-input:hover {
  width: 100%;
}
</style>
