<script setup lang="ts">
import { ref } from "vue";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { t } from "@/lang/i18n";
import {
  FileZipOutlined,
  FolderOpenOutlined,
  ArrowRightOutlined,
  AppstoreAddOutlined,
  BlockOutlined
} from "@ant-design/icons-vue";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { router } from "@/config/router";
import { QUICKSTART_METHOD } from "@/hooks/widgets/quickStartFlow";
import CreateInstanceForm from "@/widgets/setupApp/CreateInstanceForm.vue";
import { QUICKSTART_ACTION_TYPE } from "@/hooks/widgets/quickStartFlow";
import { openNodeSelectDialog } from "@/components/fc/index";
import McPreset from "./setupApp/McPreset.vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { isAdmin } = useAppStateStore();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const daemonId = getMetaOrRouteValue("daemonId", false) ?? "";

// 表单数据状态
const formData = ref({
  appType: QUICKSTART_ACTION_TYPE.AnyApp,
  createMethod: QUICKSTART_METHOD.DOCKER,
  daemonId: daemonId || ""
});

// 弹窗状态
const showCreateForm = ref(false);

const handleNext = (instanceUuid: string) => {
  showCreateForm.value = false;
  // 创建成功后跳转到实例终端页面
  router.push({
    path: "/instances/terminal",
    query: {
      daemonId: formData.value.daemonId,
      instanceId: instanceUuid
    }
  });
};

const handleInstallAction = async (
  createMethod: QUICKSTART_METHOD,
  appType: QUICKSTART_ACTION_TYPE
) => {
  formData.value.createMethod = createMethod;
  formData.value.appType = appType;
  try {
    const selectedNode = await openNodeSelectDialog();
    if (!selectedNode) return;
    formData.value.daemonId = selectedNode.uuid;
    showCreateForm.value = true;
  } catch (error) {
    console.error(error);
  }
};

const manualInstallOptions = [
  {
    label: t("TXT_CODE_a3efb1cc"),
    icon: FileZipOutlined,
    description: t("TXT_CODE_f09da050"),
    action: () =>
      handleInstallAction(QUICKSTART_METHOD.IMPORT, QUICKSTART_ACTION_TYPE.SteamGameServer)
  },
  {
    label: t("TXT_CODE_bae487e4"),
    icon: BlockOutlined,
    description: t(
      "TXT_CODE_256e5825"
    ),
    action: () =>
      handleInstallAction(QUICKSTART_METHOD.DOCKER, QUICKSTART_ACTION_TYPE.SteamGameServer)
  },
  {
    label: t("TXT_CODE_e0fca76"),
    icon: FolderOpenOutlined,
    description: t("TXT_CODE_b3844cf8"),
    action: () => handleInstallAction(QUICKSTART_METHOD.EXIST, QUICKSTART_ACTION_TYPE.AnyApp)
  }
];
</script>

<template>
  <div style="height: 100%">
    <div v-if="isAdmin" style="margin-bottom: 30px">
      <a-typography-title :level="4" style="margin-bottom: 16px">
        <AppstoreAddOutlined />
        {{ t("TXT_CODE_5a74975b") }}
      </a-typography-title>
      <div class="manual-install-options">
        <a-row :gutter="[16, 16]">
          <a-col
            v-for="(option, index) in manualInstallOptions"
            :key="index"
            :span="24"
            :md="12"
            :lg="8"
          >
            <CardPanel class="install-option-card" :style="{}" @click="option.action">
              <template #title>
                <div class="card-header">
                  <div class="card-title">{{ option.label }}</div>
                </div>
              </template>
              <template #body>
                <div class="icon-wrapper">
                  <component :is="option.icon" />
                </div>
                <div class="card-description">
                  {{ option.description }}
                </div>
                <div class="card-action">
                  <ArrowRightOutlined />
                  {{ t("TXT_CODE_7b2c5414") }}
                </div>
              </template>
            </CardPanel>
          </a-col>
        </a-row>
      </div>
    </div>
    <div><McPreset :card="card" /></div>

    <!-- 创建实例表单弹窗 -->
    <a-modal
      v-model:open="showCreateForm"
      :title="t('TXT_CODE_645bc545')"
      :width="800"
      :footer="null"
      :destroy-on-close="true"
    >
      <CreateInstanceForm
        :app-type="formData.appType"
        :create-method="formData.createMethod"
        :daemon-id="formData.daemonId"
        @next-step="handleNext"
      />
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
.manual-install-options {
  margin-bottom: 24px;
}

.install-option-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);

    &::before {
      opacity: 1;
    }
  }

  .card-header {
    display: flex;
    align-items: center;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-gray-10);
      flex: 1;
    }
  }

  .card-description {
    color: var(--color-gray-8);
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 16px;
    flex: 1;
  }

  .card-action {
    display: flex;
    justify-content: flex-end;
    color: var(--color-blue-6);
    font-size: 14px;
    gap: 4px;
    margin-right: 4px;
  }

  .icon-wrapper {
    position: absolute;
    left: 2px;
    bottom: 0;
    color: var(--color-gray-8);
    opacity: 0.2;
    font-size: 20px;
    transform: rotate(-1deg);
  }
}
</style>
