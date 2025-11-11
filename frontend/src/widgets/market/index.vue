<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { openNodeSelectDialog } from "@/components/fc/index";
import { router } from "@/config/router";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { QUICKSTART_ACTION_TYPE, QUICKSTART_METHOD } from "@/hooks/widgets/quickStartFlow";
import { t } from "@/lang/i18n";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { LayoutCard } from "@/types";
import CreateInstanceForm from "@/widgets/setupApp/CreateInstanceForm.vue";
import McPreset from "@/widgets/setupApp/McPreset.vue";
import {
  AppstoreAddOutlined,
  BlockOutlined,
  FileZipOutlined,
  FolderOpenOutlined
} from "@ant-design/icons-vue";
import { ref } from "vue";

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
    action: (e: Event) => {
      handleInstallAction(QUICKSTART_METHOD.IMPORT, QUICKSTART_ACTION_TYPE.SteamGameServer);
      e.preventDefault();
    }
  },
  {
    label: t("TXT_CODE_bae487e4"),
    icon: BlockOutlined,
    description: t("TXT_CODE_256e5825"),
    action: (e: Event) => {
      handleInstallAction(QUICKSTART_METHOD.DOCKER, QUICKSTART_ACTION_TYPE.SteamGameServer);
      e.preventDefault();
    }
  },
  {
    label: t("TXT_CODE_e0fca76"),
    icon: FolderOpenOutlined,
    description: t("TXT_CODE_b3844cf8"),
    action: (e: Event) => {
      handleInstallAction(QUICKSTART_METHOD.EXIST, QUICKSTART_ACTION_TYPE.AnyApp);
      e.preventDefault();
    }
  }
];
</script>

<template>
  <div style="height: 100%">
    <div v-if="isAdmin" style="margin-bottom: 30px">
      <a-typography-title :level="4" style="margin-bottom: 8px">
        <AppstoreAddOutlined />
        {{ t("TXT_CODE_5a74975b") }}
      </a-typography-title>
      <a-typography-paragraph>
        <p>
          {{ t("TXT_CODE_81ad9e80") }}
        </p>
      </a-typography-paragraph>
      <div class="manual-install-options">
        <a-row :gutter="[16, 16]">
          <a-col
            v-for="(option, index) in manualInstallOptions"
            :key="index"
            :span="24"
            :md="12"
            :lg="8"
          >
            <CardPanel class="install-option-card">
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
                  <a-button type="primary" @click="option.action">
                    <div class="flex items-center">
                      {{ t("TXT_CODE_7b2c5414") }}
                    </div>
                  </a-button>
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
  margin: 24px auto;
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
