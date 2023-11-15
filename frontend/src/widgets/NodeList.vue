<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref, computed } from "vue";
import { t } from "@/lang/i18n";
import {
  ProfileOutlined,
  SearchOutlined,
  SettingOutlined,
  CodeOutlined,
  ClusterOutlined,
  BlockOutlined,
  FolderOpenOutlined
} from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useOverviewInfo, type ComputedNodeInfo } from "@/hooks/useOverviewInfo";
import IconBtn from "@/components/IconBtn.vue";
import NodeSimpleChart from "@/components/NodeSimpleChart.vue";
import {
  editNode as editNodeApi,
  addNode as addNodeApi,
  deleteNode as deleteNodeApi,
  connectNode
} from "@/services/apis";
import { message } from "ant-design-vue";
import { useAppRouters } from "@/hooks/useAppRouters";

defineProps<{
  card: LayoutCard;
}>();

const { toPage } = useAppRouters();

const operationForm = ref({
  name: ""
});

const { state, refresh: refreshOverviewInfo } = useOverviewInfo();

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

const nodeOperations = [
  {
    title: t("TXT_CODE_ae533703"),
    icon: FolderOpenOutlined,
    click: (item: ComputedNodeInfo) => {
      const daemonId = item.uuid;
      const instanceId = "global0001";
      toPage({
        path: "/instances/terminal/files",
        query: {
          daemonId,
          instanceId
        }
      });
    }
  },
  {
    title: t("TXT_CODE_524e3036"),
    icon: CodeOutlined,
    click: (item: ComputedNodeInfo) => {
      const daemonId = item.uuid;
      const instanceId = "global0001";
      toPage({
        path: "/instances/terminal",
        query: {
          daemonId,
          instanceId
        }
      });
    }
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
    }
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
];

const addNode = async () => {
  const { execute } = addNodeApi();
  try {
    await execute({
      data: {
        ...editDialog.value.data
      }
    });
    editDialog.value.hidden();
    message.success(t("TXT_CODE_38c6392f"));
  } catch (error: any) {
    message.error(t("TXT_CODE_2dfc1043"));
  }
  editDialog.value.loading = false;
};

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

const editNode = async () => {
  const { apiKey, ...outherData } = editDialog.value.data;

  const updatedData = apiKey == "" ? { ...outherData } : editDialog.value.data;
  const { execute } = editNodeApi();
  const { execute: tryConnectNode } = connectNode();
  try {
    await execute({
      params: {
        uuid: editDialog.value.uuid
      },
      data: {
        ...updatedData
      }
    });
    await tryConnectNode({
      params: {
        uuid: editDialog.value.uuid
      }
    });
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
  title: computed(() => (editMode.value ? t("TXT_CODE_39c5229e") : t("TXT_CODE_15a381d5"))),
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
    } else {
      await addNode();
    }
    await refreshOverviewInfo(true);
  },
  hidden: () => {
    editDialog.value.status = false;
    editDialog.value.clear();
  }
});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
            <a-typography-title class="mb-0" :level="4">
              <ClusterOutlined />
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button class="mr-12" type="primary" @click="editDialog.show">
              {{ t("TXT_CODE_15a381d5") }}
            </a-button>
            <a-button href="https://docs.mcsmanager.com/" target="_black">
              {{ t("TXT_CODE_3a302f23") }}
            </a-button>
          </template>
          <template #center>
            <div class="search-input">
              <a-input v-model:value="operationForm.name" :placeholder="t('TXT_CODE_461d1a01')">
                <template #prefix>
                  <search-outlined />
                </template>
              </a-input>
            </div>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_f9a92e38") }}
          <br />
          {{ t("TXT_CODE_a65c65c2") }}
        </a-typography-text>
      </a-col>

      <a-col v-for="item in state?.remote" :key="item.uuid" :span="24" :lg="12">
        <CardPanel style="height: 100%">
          <template #title>
            <ProfileOutlined />
            {{ item.remarks || item.ip }}
          </template>
          <template #operator>
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
          <template #body>
            <a-row :gutter="[24, 24]" class="mt-2">
              <a-col
                v-for="detail in detailList(item)"
                :key="detail.title + detail.value"
                :span="6"
              >
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
      </a-col>
    </a-row>
  </div>
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

            <a href="https://docs.mcsmanager.com/" target="_blank">{{ t("TXT_CODE_be1351ce") }}</a>
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
          <a-button key="back" @click="editDialog.hidden()">{{ t("TXT_CODE_a0451c97") }}</a-button>
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
