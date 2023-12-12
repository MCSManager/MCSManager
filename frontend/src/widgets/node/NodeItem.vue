<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { ref, computed } from "vue";
import { t } from "@/lang/i18n";
import {
  ProfileOutlined,
  SettingOutlined,
  CodeOutlined,
  BlockOutlined,
  FolderOpenOutlined,
  ReloadOutlined
} from "@ant-design/icons-vue";
import { useOverviewInfo, type ComputedNodeInfo } from "@/hooks/useOverviewInfo";
import IconBtn from "@/components/IconBtn.vue";
import NodeSimpleChart from "@/components/NodeSimpleChart.vue";
import { editNode as editNodeApi, deleteNode as deleteNodeApi, connectNode } from "@/services/apis";
import { message } from "ant-design-vue";
import { useAppRouters } from "@/hooks/useAppRouters";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import type { LayoutCard } from "@/types";
import { arrayFilter } from "@/tools/array";
import { GLOBAL_INSTANCE_UUID } from "@/config/const";

const props = defineProps<{
  item?: ComputedNodeInfo;
  card?: LayoutCard;
}>();

const { state: AllDaemonData } = useOverviewInfo();
const itemDaemonId = ref<string>();

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

const { toPage } = useAppRouters();

const detailList = (node: ComputedNodeInfo) => {
  return [
    {
      title: t("TXT_CODE_f52079a0"),
      value: `${node.ip}:${node.port}`
    },
    {
      title: t("TXT_CODE_593ee330"),
      value: node.memText
    },
    {
      title: t("TXT_CODE_2c2712a4"),
      value: node.cpuInfo
    },
    {
      title: t("TXT_CODE_3d602459"),
      value: node.instanceStatus
    },
    {
      title: t("TXT_CODE_c9609785"),
      value: node.available ? t("TXT_CODE_823bfe63") : t("TXT_CODE_66ce073e")
    },
    {
      title: t("TXT_CODE_3d0885c0"),
      value: node.platformText
    },
    {
      title: t("TXT_CODE_81634069"),
      value: node.version
    }
  ];
};

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
      title: t("重新连接"),
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
        editDialog.value.uuid = node.uuid;
        editDialog.value.data.ip = node.ip;
        editDialog.value.data.port = node.port;
        editDialog.value.data.remarks = node.remarks;
        editDialog.value.showEdit();
      }
    }
  ])
);

const deleteNode = async () => {
  const { execute } = deleteNodeApi();
  try {
    await execute({
      params: {
        uuid: editDialog.value.uuid
      }
    });
    message.success(t("TXT_CODE_e53b3f9"));
    editDialog.value.hidden();
  } catch (error) {
    message.error(t("TXT_CODE_1b699a95"));
  }
  editDialog.value.loading = false;
};

const tryConnectNode = async (uuid: string, showMsg = true) => {
  const { execute } = connectNode();
  try {
    await execute({
      params: {
        uuid: uuid
      }
    });
    if (showMsg) message.success(t("操作成功"));
  } catch (error) {
    message.error(t("操作失败"));
  }
};

const editNode = async () => {
  const { apiKey, ...outherData } = editDialog.value.data;
  const updatedData = apiKey == "" ? { ...outherData } : editDialog.value.data;
  const { execute } = editNodeApi();
  try {
    await execute({
      params: {
        uuid: editDialog.value.uuid
      },
      data: {
        ...updatedData
      }
    });
    await tryConnectNode(editDialog.value.uuid, false);
    message.success(t("TXT_CODE_a7907771"));
    editDialog.value.loading = false;
    editDialog.value.hidden();
  } catch (error) {
    message.error(t("TXT_CODE_fdca0695"));
  }
};

const editMode = ref(false);
const editDialog = ref({
  status: false,
  loading: false,
  title: t("TXT_CODE_39c5229e"),
  data: {
    ip: "",
    port: 24444,
    remarks: "",
    apiKey: ""
  },
  uuid: "",
  check: () => {
    if (!editMode.value) {
      if (!editDialog.value.data.apiKey) return false;
    }
    if (!editDialog.value.data.ip || !editDialog.value.data.port) return false;
  },
  show: () => {
    editMode.value = false;
    editDialog.value.status = true;
  },
  showEdit: () => {
    editMode.value = true;
    editDialog.value.status = true;
  },
  clear: () => {
    editDialog.value.data = {
      ip: "",
      port: 24444,
      remarks: "",
      apiKey: ""
    };
  },
  delete: () => {
    editDialog.value.loading = true;
    deleteNode();
  },
  submit: async () => {
    if (editDialog.value.check() === false) {
      return message.error(t("TXT_CODE_633415e2"));
    }
    editDialog.value.loading = true;
    if (editMode.value) {
      await editNode();
    }
  },
  hidden: () => {
    editDialog.value.status = false;
    editDialog.value.clear();
  }
});
</script>

<template>
  <div style="height: 100%" class="container">
    <CardPanel style="height: 100%">
      <template #title>
        <ProfileOutlined />
        {{ item?.remarks || item?.ip }}
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
              <div>
                {{ detail.value }}
              </div>
            </a-typography-paragraph>
          </a-col>
        </a-row>
        <NodeSimpleChart
          class="mt-24"
          :cpu-data="item.cpuChartData ?? []"
          :mem-data="item.memChartData ?? []"
        ></NodeSimpleChart>
      </template>
    </CardPanel>

    <a-modal v-model:open="editDialog.status" :title="editDialog.title">
      <a-form layout="vertical">
        <a-form-item>
          <a-typography-title :level="5">{{ t("TXT_CODE_a884de59") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_4b1d5199") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input v-model:value="editDialog.data.remarks" />
        </a-form-item>

        <a-form-item>
          <a-typography-title :level="5">{{ t("TXT_CODE_93f9b02a") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_be7a689a") }}
              <br />
              {{ t("TXT_CODE_c82a51b0") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input v-model:value="editDialog.data.ip" />
        </a-form-item>

        <a-form-item>
          <a-typography-title :level="5">{{ t("TXT_CODE_4a6bf8c6") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_df455795") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input v-model:value="editDialog.data.port" />
        </a-form-item>

        <a-form-item>
          <a-typography-title class="flex" :level="5">
            {{ t("TXT_CODE_300c2ff4") }}
          </a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_5ef2cf20") }}

              <a href="https://docs.mcsmanager.com/" target="_blank">{{
                t("TXT_CODE_be1351ce")
              }}</a>
            </a-typography-text>
          </a-typography-paragraph>
          <a-input
            v-model:value="editDialog.data.apiKey"
            :placeholder="editMode ? t('TXT_CODE_dc570cf2') : t('TXT_CODE_fe25087f')"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <div class="justify-space-between">
          <a-popconfirm
            :title="t('TXT_CODE_fb267b0b')"
            ok-text="Yes"
            cancel-text="No"
            @confirm="deleteNode()"
          >
            <a-button v-if="editMode" key="delete" danger>{{ t("TXT_CODE_8b937b23") }}</a-button>
          </a-popconfirm>
          <div class="right">
            <a-button key="back" @click="editDialog.hidden()">{{
              t("TXT_CODE_a0451c97")
            }}</a-button>
            <a-button
              key="submit"
              type="primary"
              :loading="editDialog.loading"
              @click="editDialog.submit()"
            >
              {{ t("TXT_CODE_d507abff") }}
            </a-button>
          </div>
        </div>
      </template>
    </a-modal>
  </div>
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
