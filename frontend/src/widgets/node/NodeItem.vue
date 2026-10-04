<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import IconBtn from "@/components/IconBtn.vue";
import NodeSimpleChart from "@/components/NodeSimpleChart.vue";
import { GLOBAL_INSTANCE_UUID } from "@/config/const";
import { useAppRouters } from "@/hooks/useAppRouters";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useOverviewInfo, type ComputedNodeInfo } from "@/hooks/useOverviewInfo";
import { SocketStatus, useSocketIoClient } from "@/hooks/useSocketIo";
import { getCurrentLang, t } from "@/lang/i18n";
import {
  connectNode,
  getDaemonUpgradeInfo,
  upgradeDaemon,
  type IUpgradeInfo
} from "@/services/apis";
import { arrayFilter } from "@/tools/array";
import { pickLocalizedNotes } from "@/tools/localizedNotes";
import { reportErrorMsg } from "@/tools/validator";
import { hasVersionUpdate } from "@/tools/version";
import type { LayoutCard } from "@/types";
import {
  BlockOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  CloudUploadOutlined,
  CodeOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SettingOutlined
} from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import { computed, defineProps, onMounted, ref, watch } from "vue";
import NodeDetailDialog from "./NodeDetailDialog.vue";

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

// Self-update the daemon: download the latest package and overlay it. The new
// build only takes effect after a manual daemon restart (no auto-restart).
const triggerDaemonUpdate = (uuid: string) => {
  Modal.confirm({
    title: t("TXT_CODE_AUTOUPDATE_DAEMON_BTN"),
    content: t("TXT_CODE_AUTOUPDATE_DAEMON_CONFIRM"),
    okText: t("TXT_CODE_AUTOUPDATE_BTN_OK"),
    cancelText: t("TXT_CODE_AUTOUPDATE_BTN_CANCEL"),
    onOk: async () => {
      try {
        const { execute } = upgradeDaemon();
        const res = await execute({ params: { uuid } });
        if (res.value?.started) {
          // Update files are applied on disk; ask the operator to restart the
          // daemon manually for the new version to take effect.
          Modal.success({
            content: t("TXT_CODE_AUTOUPDATE_DAEMON_STARTED", { v: res.value?.onlineVersion })
          });
        } else {
          message.info(res.value?.message || t("TXT_CODE_AUTOUPDATE_ALREADY_LATEST"));
        }
      } catch (error: any) {
        reportErrorMsg(error?.message ? error.message : t("TXT_CODE_AUTOUPDATE_DAEMON_FAILED"));
      }
    }
  });
};

const { toPage } = useAppRouters();

// Upgrade availability of this daemon according to the update manifest
// (updateSourceUrl). Drives the update icon next to the version number and the
// "Update Daemon" button group entry.
const daemonUpgradeInfo = ref<IUpgradeInfo>();

const daemonUpdateAvailable = computed(() =>
  Boolean(remoteNode.value?.available && daemonUpgradeInfo.value?.updateAvailable)
);

// Release notes of the online version, matched against the current panel
// language (falls back to English when that locale is missing).
const daemonUpdateNotes = computed(() =>
  pickLocalizedNotes(daemonUpgradeInfo.value?.onlineNotes, getCurrentLang())
);

const refreshDaemonUpgradeInfo = async () => {
  const uuid = remoteNode.value?.uuid;
  if (!uuid || !remoteNode.value?.available) return;
  try {
    const { execute } = getDaemonUpgradeInfo();
    daemonUpgradeInfo.value = (await execute({ params: { uuid } })).value;
  } catch (error: any) {
    // silent: keep last known state
  }
};

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
    success:
      !daemonUpdateAvailable.value && !hasVersionUpdate(specifiedDaemonVersion.value, node.version),
    warn:
      !daemonUpdateAvailable.value &&
      hasVersionUpdate(specifiedDaemonVersion.value, node.version) &&
      node.available,
    warnText: t("TXT_CODE_e520908a"),
    update: daemonUpdateAvailable.value,
    updateVersion: daemonUpgradeInfo.value?.onlineVersion ?? "",
    updateNotes: daemonUpdateNotes.value
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
      title: t("TXT_CODE_AUTOUPDATE_DAEMON_BTN"),
      icon: CloudUploadOutlined,
      click: (item: ComputedNodeInfo) => {
        triggerDaemonUpdate(item.uuid);
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
  refreshDaemonUpgradeInfo();
});

// Overview data is polled every few seconds: once the daemon restarts on a new
// version (after a self-update) the version below changes, so refresh the
// upgrade info then and the update icon disappears.
watch(
  () => [remoteNode.value?.version, remoteNode.value?.available] as const,
  () => refreshDaemonUpgradeInfo()
);
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
        <a-row :gutter="[24, 0]" class="mt-2">
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
                <a-tooltip v-if="detail.update && detail.value">
                  <template #title>
                    <div style="max-width: 320px">
                      <div>
                        {{
                          t("TXT_CODE_AUTOUPDATE_DAEMON_UPDATE_TIP", {
                            v: detail.updateVersion
                          })
                        }}
                      </div>
                      <div v-if="detail.updateNotes" class="daemon-update-notes">
                        {{ detail.updateNotes }}
                      </div>
                    </div>
                  </template>
                  <span class="color-warning">
                    {{ detail.value }}
                    <CloudUploadOutlined class="daemon-update-icon" />
                  </span>
                </a-tooltip>
                <a-tooltip v-else-if="detail.warn && detail.value">
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
          class="mt-8"
          :cpu-usage="remoteNode.cpuInfo ?? ''"
          :mem-usage="remoteNode.memText ?? ''"
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

.daemon-update-icon {
  margin-left: 4px;
  cursor: help;
}

.daemon-update-notes {
  margin-top: 8px;
  white-space: pre-wrap;
}
</style>
