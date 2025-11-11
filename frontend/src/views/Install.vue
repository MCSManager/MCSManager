<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { useAppRouters } from "@/hooks/useAppRouters";
import {
  getInitLanguage,
  initInstallPageFlow,
  setLanguage,
  SUPPORTED_LANGS,
  t,
  toStandardLang
} from "@/lang/i18n";
import { panelInstall } from "@/services/apis";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { reportErrorMsg } from "@/tools/validator";
import { ArrowRightOutlined } from "@ant-design/icons-vue";
import type { FormInstance } from "ant-design-vue";
import { reactive, ref } from "vue";

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

const step = ref(0);
const { toPage } = useAppRouters();
const formRef = ref<FormInstance>();
const formData = reactive({
  username: "",
  password: "",
  language: getInitLanguage()
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
    err.errorFields?.forEach((field: any) => {
      field?.errors?.forEach((error: any) => {
        reportErrorMsg(error);
      });
    });
  } finally {
    installLoading.value = false;
  }
};

const setLang = (lang: string) => {
  lang = toStandardLang(lang);
  initInstallPageFlow(lang);
  setLanguage(formData.language, false);
};

const toQuickStart = () => {
  toPage({
    path: "/market",
    query: {
      from_install: 1
    }
  }).then(() => window.location.reload());
};

const toOverview = () => {
  toPage({
    path: "/",
    query: {
      from_install: 1
    }
  }).then(() => window.location.reload());
};
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
  <div v-if="step === 0" class="install-page-container">
    <CardPanel :full-height="false" class="install-panel language-select-panel">
      <template #body>
        <a-typography style="text-align: center; margin-bottom: 40px">
          <a-typography-title :level="2" style="margin-bottom: 8px"> Language </a-typography-title>
          <a-typography-text type="secondary"> Choose your preferred language </a-typography-text>
        </a-typography>

        <div class="language-grid">
          <div
            v-for="lang in SUPPORTED_LANGS"
            :key="lang.value"
            class="language-card"
            :class="{ 'language-card-active': formData.language === lang.value }"
            @click="
              () => {
                formData.language = lang.value;
                setLang(formData.language);
              }
            "
          >
            <div class="language-card-inner language-label">
              {{ lang.label }}
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px">
          <a-button
            type="primary"
            size="large"
            style="min-width: 160px; height: 48px; font-size: 16px"
            @click="
              () => {
                setLang(formData.language);
                step++;
              }
            "
          >
            {{ t("TXT_CODE_5e9022f8") }}
            <ArrowRightOutlined />
          </a-button>
        </div>
      </template>
    </CardPanel>
  </div>
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
        >
          {{ t("TXT_CODE_3371000d") }}
        </a-button>
        <a-button
          v-else
          class="mt-45 mb-45"
          type="primary"
          size="large"
          style="min-width: 160px; height: 48px; font-size: 16px"
          @click="step = 2"
        >
          {{ t("TXT_CODE_351aaf7") }}
        </a-button>
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
    width: 100%;
    background-color: var(--login-panel-bg);
    backdrop-filter: saturate(120%) blur(12px);
    padding: 40px;
  }

  .language-select-panel {
    max-width: 640px;
  }
}

.language-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 0 20px;

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    padding: 0 10px;
  }
}

.language-card {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 16px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-gray-3);
  background: var(--color-gray-4);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.05) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: var(--color-gray-4);

    &::before {
      opacity: 0.5;
    }
  }
}

.language-card-active {
  border-color: #1890ff !important;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.15) 0%, rgba(24, 144, 255, 0.08) 100%);

  &::before {
    opacity: 1 !important;
  }

  .language-check {
    background: #1890ff;
    border-color: #1890ff;
  }

  .check-icon {
    opacity: 1;
    transform: scale(1);
  }

  .language-label {
    text-align: center;
    color: #1890ff;
  }
}

.language-card-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.language-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 0px solid var(--color-gray-4);
  background-color: var(--color-gray-1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.check-icon {
  color: white;
  font-size: 12px;
  font-weight: bold;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.language-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-1);
  transition: all 0.3s ease;
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
