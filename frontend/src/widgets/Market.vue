<script setup lang="ts">
import { ref } from "vue";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard, QuickStartPackages } from "@/types";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { t } from "@/lang/i18n";
import {
  CloudServerOutlined,
  FileZipOutlined,
  FolderOpenOutlined,
  ArrowRightOutlined
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
    label: t("使用 Docker 镜像创建"),
    icon: CloudServerOutlined,
    description: t("通过使用您在 DockerHub 上搜索到的任何镜像来创建、安装和启动实例。"),
    action: () =>
      handleInstallAction(QUICKSTART_METHOD.DOCKER, QUICKSTART_ACTION_TYPE.SteamGameServer)
  },
  {
    label: t("导入压缩包"),
    icon: FileZipOutlined,
    description: t("通过上传服务端压缩包来自动创建实例，仅支持 .zip 文件，上传后会自动解压。"),
    action: () =>
      handleInstallAction(QUICKSTART_METHOD.IMPORT, QUICKSTART_ACTION_TYPE.SteamGameServer)
  },
  {
    label: t("选择已存在的目录"),
    icon: FolderOpenOutlined,
    description: t("无需上传任何文件，直接填写一个文件路径，即可创建实例，适合经验丰富的用户。"),
    action: () => handleInstallAction(QUICKSTART_METHOD.EXIST, QUICKSTART_ACTION_TYPE.AnyApp)
  }
];
</script>

<template>
  <div style="height: 100%">
    <div v-if="isAdmin" style="margin-bottom: 30px">
      <a-typography-title :level="4" style="margin-bottom: 16px">
        {{ t("手动安装") }}
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
                  <div class="icon-wrapper">
                    <component :is="option.icon" />
                  </div>
                  <div class="card-title">{{ option.label }}</div>
                </div>
              </template>
              <template #body>
                <div class="card-description">
                  {{ option.description }}
                </div>
                <div class="card-action">
                  <ArrowRightOutlined />
                  {{ t("选择此方式") }}
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
      :title="t('创建新实例')"
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
    margin-bottom: 12px;

    .icon-wrapper {
      font-size: 20px;
      margin-right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      border-radius: 50%;
      color: var(--color-gray-8);
    }

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
  }
}
</style>
