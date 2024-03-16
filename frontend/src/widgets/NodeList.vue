<script setup lang="ts">
import type { LayoutCard } from "@/types/index";
import { ref } from "vue";
import { t } from "@/lang/i18n";
import { SearchOutlined, ClusterOutlined } from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { message } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import NodeItem from "./node/NodeItem.vue";
import { useRemoteNode } from "../hooks/useRemoteNode";
import NodeDetailDialog from "./node/NodeDetailDialog.vue";
import { useScreen } from "@/hooks/useScreen";

defineProps<{
  card: LayoutCard;
}>();

const { isPhone } = useScreen();
const nodeDetailDialog = ref<InstanceType<typeof NodeDetailDialog>>();

const {
  operationForm,
  remoteNodes: remotes,
  refreshLoading,
  currentStatus,
  refresh: refreshOverviewInfo
} = useRemoteNode();

const refresh = async () => {
  try {
    refreshLoading.value = true;
    await refreshOverviewInfo();
    message.success(t("TXT_CODE_fbde647e"));
  } catch (error: any) {
    reportErrorMsg(error.message);
  } finally {
    refreshLoading.value = false;
  }
};

const handleOpenDetailDialog = async () => {
  await nodeDetailDialog.value?.openDialog();
};
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template v-if="!isPhone" #left>
            <a-typography-title class="mb-0" :level="4">
              <ClusterOutlined />
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button :loading="refreshLoading" @click="refresh">
              {{ t("TXT_CODE_b76d94e0") }}
            </a-button>
            <a-button type="primary" @click="handleOpenDetailDialog">
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
      <fade-up-animation :delay="3000">
        <a-col v-for="item in remotes" :key="item.uuid" :span="24" :lg="12">
          <NodeItem :item="item"></NodeItem>
        </a-col>
      </fade-up-animation>
    </a-row>
  </div>
  <NodeDetailDialog ref="nodeDetailDialog"></NodeDetailDialog>
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
