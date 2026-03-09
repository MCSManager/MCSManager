<script setup lang="ts">
import { useDialog } from "@/hooks/useDialog";
import { t } from "@/lang/i18n";
import type { MountComponent } from "@/types";
import { AppstoreOutlined, DeploymentUnitOutlined } from "@ant-design/icons-vue";

interface Props extends MountComponent<number> {}

const props = defineProps<Props>();
const { isVisible, openDialog, submit } = useDialog<number>(props);

const selectNormalVersion = () => {
  submit(1);
};

const selectDockerVersion = () => {
  submit(2);
};

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="isVisible"
    :title="t('TXT_CODE_docker_version_select_title')"
    :width="860"
    :footer="null"
    :destroy-on-close="true"
    :closable="false"
    :mask-closable="false"
    :keyboard="false"
  >
    <a-typography-paragraph class="desc">
      {{ t("TXT_CODE_docker_version_select_desc") }}
    </a-typography-paragraph>
    <div class="cards">
      <a-card class="choose-card docker-card" hoverable @click="selectDockerVersion">
        <template #title>
          <div class="card-title">
            <DeploymentUnitOutlined />
            <span>{{ t("TXT_CODE_docker_version_select_docker_title") }}</span>
          </div>
        </template>
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_docker_version_select_docker_subtitle") }}
        </a-typography-text>
        <div class="card-action">
          <a-button type="primary">
            {{ t("TXT_CODE_docker_version_select_docker_btn") }}
          </a-button>
        </div>
      </a-card>

      <a-card class="choose-card normal-card" hoverable @click="selectNormalVersion">
        <template #title>
          <div class="card-title">
            <AppstoreOutlined />
            <span>{{ t("TXT_CODE_docker_version_select_normal_title") }}</span>
          </div>
        </template>
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_docker_version_select_normal_subtitle") }}
        </a-typography-text>
        <div class="card-action">
          <a-button>
            {{ t("TXT_CODE_docker_version_select_normal_btn") }}
          </a-button>
        </div>
      </a-card>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.desc {
  margin-bottom: 16px;
}

.cards {
  display: flex;
  align-items: stretch;
  gap: 12px;
}

.choose-card {
  flex: 1;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.choose-card:hover {
  transform: translateY(-2px);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-action {
  margin-top: 16px;
  text-align: right;
}

.docker-card {
  // border-color: var(--color-primary, #1677ff);
}
</style>
