<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import CardPanel from "@/components/CardPanel.vue";
import { SUPPORTED_LANGS, getCurrentLang, setLanguage, t } from "@/lang/i18n";
import { panelInstall, updateSettings } from "@/services/apis";
import { reportErrorMsg } from "@/tools/validator";
import type { FormInstance } from "ant-design-vue";
import { useAppRouters } from "@/hooks/useAppRouters";
import { useAppStateStore } from "@/stores/useAppStateStore";

const skeletons = [
  { span: 6, rows: 4 },
  { span: 6, rows: 4 },
  { span: 6, rows: 4 },
  { span: 6, rows: 4 },
  { span: 24, rows: 9 },
  { span: 8, rows: 6 },
  { span: 16, rows: 6 },
  { span: 8, rows: 6 },
  { span: 16, rows: 6 }
];

const { updateUserInfo, updatePanelStatus, state: appState } = useAppStateStore();

const step = ref(1);
const { toPage } = useAppRouters();
const formRef = ref<FormInstance>();
const formData = reactive({
  username: "",
  password: "",
  language: getCurrentLang()
});

const { execute: createAdminUser } = panelInstall();
const installLoading = ref(false);
const createUser = async () => {
  try {
    installLoading.value = true;
    await formRef.value?.validate();
    await createAdminUser({
      data: formData
    });
    await updatePanelStatus();
    await updateUserInfo();
    step.value++;
  } catch (err: any) {
    reportErrorMsg(err.message);
  } finally {
    installLoading.value = false;
  }
};

const toQuickStart = () => {
  toPage({
    path: "/quickstart",
    query: {
      from_install: 1
    }
  });
};

const toOverview = () => {
  toPage({
    path: "/",
    query: {
      from_install: 1
    }
  });
};

onMounted(async () => {});
</script>

<template>
  <a-row :gutter="[24, 24]">
    <a-col v-for="i in skeletons" :key="i.span + i.rows" :span="i.span">
      <CardPanel :full-height="false">
        <template #body>
          <a-skeleton :paragraph="{ rows: i.rows }" />
        </template>
      </CardPanel>
    </a-col>
  </a-row>
  <div v-if="step === 1" class="install-page-container" style="text-align: center">
    <CardPanel :full-height="false" class="install-panel">
      <template #body>
        <a-typography>
          <a-typography-title :level="3">
            {{ t("TXT_CODE_00000001") }}
          </a-typography-title>
          <a-typography-paragraph>
            <a-typography-text>
              {{ t("TXT_CODE_81d7e7c5") }}
            </a-typography-text>
          </a-typography-paragraph>
        </a-typography>
        <a-button
          v-if="appState.isInstall"
          disabled
          class="mt-45 mb-45"
          type="primary"
          size="large"
          @click="step = 2"
        >
          {{ t("TXT_CODE_3371000d") }}
        </a-button>
        <a-button v-else class="mt-45 mb-45" type="primary" size="large" @click="step = 2">
          {{ t("TXT_CODE_351aaf7") }}
        </a-button>
        <!-- <div style="flex">
          <a-select v-model:value="formData.language" class="mr-6" :style="{ minWidth: '200px' }">
            <a-select-option v-for="item in SUPPORTED_LANGS" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </div> -->
      </template>
    </CardPanel>
  </div>
  <div v-if="step === 2" class="install-page-container">
    <CardPanel :full-height="false" class="install-panel">
      <template #body>
        <a-typography>
          <a-typography-title :level="3">
            {{ t("TXT_CODE_f880b5ad") }}
          </a-typography-title>
          <a-typography-paragraph>
            <a-typography-text>
              {{ t("TXT_CODE_3a056dc8") }}
            </a-typography-text>
          </a-typography-paragraph>
        </a-typography>
        <a-form ref="formRef" :model="formData" :label-col="{ span: 4 }" autocomplete="off">
          <a-form-item
            name="username"
            :rules="[{ required: true, message: t('TXT_CODE_2695488c') }]"
          >
            <a-input
              v-model:value="formData.username"
              autocomplete="off"
              :placeholder="t('TXT_CODE_eb9fcdad')"
            />
          </a-form-item>

          <a-form-item
            name="password"
            :rules="[
              {
                required: true,
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{9,36}$/,
                message: t('TXT_CODE_ad533c70')
              }
            ]"
          >
            <a-input-password
              v-model:value="formData.password"
              autocomplete="off"
              :placeholder="t('TXT_CODE_551b0348')"
            />
          </a-form-item>

          <a-form-item :wrapper-col="{ span: 16 }">
            <a-button :loading="installLoading" type="primary" @click="createUser">
              {{ t("TXT_CODE_11d5caea") }}
            </a-button>
          </a-form-item>
        </a-form>
      </template>
    </CardPanel>
  </div>
  <div v-if="step === 3" class="install-page-container">
    <CardPanel :full-height="false" class="install-panel">
      <template #body>
        <a-typography>
          <a-typography-title :level="3">
            {{ t("TXT_CODE_97be50a8") }}
          </a-typography-title>
          <a-typography-paragraph>
            <a-typography-text>
              {{ t("TXT_CODE_cd923ade") }}
            </a-typography-text>
          </a-typography-paragraph>
        </a-typography>
        <div class="final-btn mb-15" @click="toQuickStart">
          <a-typography-title :level="5">
            {{ t("TXT_CODE_6f98ccd7") }}
          </a-typography-title>
          <a-typography-text>
            {{ t("TXT_CODE_b5ca0563") }}
          </a-typography-text>
        </div>
        <div class="final-btn" @click="toOverview">
          <a-typography-title :level="5">
            {{ t("TXT_CODE_b69550bf") }}
          </a-typography-title>
          <a-typography-text>
            {{ t("TXT_CODE_95df80df") }}
          </a-typography-text>
        </div>
      </template>
    </CardPanel>
  </div>
</template>

<style lang="scss" scoped>
.install-page-container {
  position: fixed;
  left: 0px;
  right: 0px;
  bottom: 0px;
  top: 0px;
  background-color: #29292957;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: saturate(120%) blur(10px);
  z-index: 200;
  transition: all 0.8s;

  .install-panel {
    transition: all 0.6s;
    max-width: 480px;
    // max-height: 420px;
    width: 100%;
    background-color: var(--login-panel-bg);
    backdrop-filter: saturate(120%) blur(12px);
    padding: 40px;
  }
}

.final-btn {
  padding: 10px 12px;
  border: 1px solid var(--color-gray-2);
  background-color: var(--color-gray-2);

  cursor: pointer;
  user-select: none;
  transition: all 0.4s;
  border-radius: 6px;

  &:hover {
    border: 1px solid var(--color-gray-8);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
  }
}

@keyframes scaleAnimation {
  0% {
    transform: scale(1);
  }
  20% {
    transform: scale(0.9);
    opacity: 1;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
</style>
