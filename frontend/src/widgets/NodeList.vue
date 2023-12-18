<script setup lang="ts">
import type { LayoutCard } from "@/types/index";
import { ref, computed } from "vue";
import { t } from "@/lang/i18n";
import { SearchOutlined, ClusterOutlined } from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useOverviewInfo, type ComputedNodeInfo } from "@/hooks/useOverviewInfo";
import {
  editNode as editNodeApi,
  addNode as addNodeApi,
  deleteNode as deleteNodeApi,
  connectNode
} from "@/services/apis";
import { message } from "ant-design-vue";
import NodeItem from "./node/NodeItem.vue";

defineProps<{
  card: LayoutCard;
}>();

const operationForm = ref({
  name: ""
});
const ALL = "all";
const currentStatus = ref<any>(ALL);
const { state, refresh: refreshOverviewInfo } = useOverviewInfo();
const refreshLoading = ref(false);

const remotes = computed(() => {
  const filterByName = (node: ComputedNodeInfo) =>
    operationForm.value.name !== ""
      ? node.remarks.toLowerCase().includes(operationForm.value.name.toLowerCase())
      : true;

  return state.value?.remote.filter(
    (node) =>
      (currentStatus.value === ALL || node.available === currentStatus.value) && filterByName(node)
  );
});

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

const refresh = async () => {
  try {
    refreshLoading.value = true;
    await refreshOverviewInfo(true);
    message.success(t("TXT_CODE_fbde647e"));
  } catch (error: any) {
    message.error(error.message);
  } finally {
    refreshLoading.value = false;
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
            <a-button class="mr-12" :loading="refreshLoading" @click="refresh">
              {{ t("TXT_CODE_b76d94e0") }}
            </a-button>
            <a-button class="mr-12" type="primary" @click="editDialog.show">
              {{ t("TXT_CODE_15a381d5") }}
            </a-button>
            <a-button href="https://docs.mcsmanager.com/" target="_black">
              {{ t("TXT_CODE_3a302f23") }}
            </a-button>
          </template>
          <template #center>
            <div class="search-input">
              <a-input-group compact>
                <a-select v-model:value="currentStatus" style="width: 80px">
                  <a-select-option value="all">
                    {{ t("TXT_CODE_c48f6f64") }}
                  </a-select-option>
                  <a-select-option :value="true">
                    {{ t("TXT_CODE_823bfe63") }}
                  </a-select-option>
                  <a-select-option :value="false">
                    {{ t("TXT_CODE_66ce073e") }}
                  </a-select-option>
                </a-select>
                <a-input
                  v-model:value.trim="operationForm.name"
                  :placeholder="t('TXT_CODE_461d1a01')"
                  style="width: calc(100% - 80px)"
                >
                  <template #suffix>
                    <search-outlined />
                  </template>
                </a-input>
              </a-input-group>
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
      <a-col v-for="item in remotes" :key="item.uuid" :span="24" :lg="12">
        <NodeItem :item="item"></NodeItem>
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
  width: 80%;

  &:hover {
    width: 100%;
  }
}

@media (max-width: 992px) {
  .search-input {
    width: 100% !important;
  }
}
</style>
