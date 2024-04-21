<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { ref, computed } from "vue";
import { t } from "@/lang/i18n";
import {
  SettingOutlined,
  CodeOutlined,
  BlockOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CloudServerOutlined,
  CheckCircleOutlined
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

const nodeDetailDialog = ref<InstanceType<typeof NodeDetailDialog>>();

const props = defineProps<{
  item?: ComputedNodeInfo;
  card?: LayoutCard;
}>();

const { state: AllDaemonData } = useOverviewInfo();
const itemDaemonId = ref<string>();
const specifiedDaemonVersion = computed(() => AllDaemonData.value?.specifiedDaemonVersion);

const item = computed(() => {
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
    title: t("TXT_CODE_c9609785"),
    value: node.available ? t("TXT_CODE_823bfe63") : t("TXT_CODE_66ce073e"),
    warn: node.available === false,
    success: node.available === true,
    warnText: t("TXT_CODE_1c2efd38")
  },
  {
    title: t("TXT_CODE_593ee330"),
    value: node.memText
  },
  {
    title: "CPU",
    value: node.cpuInfo
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
    warn: specifiedDaemonVersion.value !== node.version,
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
      condition: () => item.value!.available
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
      condition: () => item.value!.available
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
      condition: () => item.value!.available
    },
    {
      title: t("TXT_CODE_f8b28901"),
      icon: ReloadOutlined,
      click: async (node: ComputedNodeInfo) => {
        await tryConnectNode(node.uuid);
      },
      condition: () => !item.value!.available
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
</script>

<template>
  <div style="height: 100%" class="container">
    <CardPanel style="height: 100%">
      <template #title>
        <div class="flex-center">
          <span :class="{ 'color-danger': !item?.available }">
            <CloudServerOutlined />
            {{ item?.remarks || item?.ip }}
          </span>
        </div>
      </template>
      <template v-if="item" #operator>
        <span
          v-for="operation in nodeOperations"
          :key="operation.title"
          size="default"
          class="mr-2"
        >
          <IconBtn
            :icon="operation.icon"
            :title="operation.title"
            @click="operation.click(item)"
          ></IconBtn>
        </span>
      </template>
      <template v-if="item" #body>
        <a-row :gutter="[24, 24]" class="mt-2">
          <a-col v-for="detail in detailList(item)" :key="detail.title + detail.value" :span="6">
            <a-typography-paragraph>
              <div>
                {{ detail.title }}
              </div>
              <div v-if="detail.onlyCopy">
                <a-typography-text :copyable="{ text: detail.value ?? '' }"></a-typography-text>
              </div>
              <div v-else>
                <a-tooltip v-if="detail.warn && detail.value">
                  <template #title>
                    {{ detail.warnText }}
                  </template>
                  <span class="color-danger"><InfoCircleOutlined /> {{ detail.value }}</span>
                </a-tooltip>
                <span v-else-if="detail.success">
                  <span class="color-success"><CheckCircleOutlined /> {{ detail.value }}</span>
                </span>
                <span v-else>{{ detail.value }}</span>
              </div>
            </a-typography-paragraph>
          </a-col>
        </a-row>
        <NodeSimpleChart
          class="mt-24"
          :cpu-data="item.cpuChartData ?? []"
          :mem-data="item.memChartData ?? []"
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
