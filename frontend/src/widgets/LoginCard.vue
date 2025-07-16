<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { router } from "@/config/router";
import { t } from "@/lang/i18n";
import { loginPageInfo, loginUser } from "@/services/apis";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { sleep } from "@/tools/common";
import { markdownToHTML } from "@/tools/safe";
import { reportErrorMsg } from "@/tools/validator";
import type { LayoutCard } from "@/types";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  LockOutlined,
  UserOutlined
} from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import { onMounted, reactive, ref } from "vue";

const { state: pageInfoResult, execute } = loginPageInfo();

const props = defineProps<{
  card?: LayoutCard;
}>();

const formData = reactive({
  username: "",
  password: "",
  code: ""
});

const { execute: login } = loginUser();
const { updateUserInfo, isAdmin, state: appConfig } = useAppStateStore();

const loginStep = ref(0);
const is2Fa = ref(false);

const handleLogin = async () => {
  if (!formData.username.trim() || !formData.password.trim()) {
    return message.error(t("TXT_CODE_c846074d"));
  }
  try {
    loginStep.value++;
    await sleep(600);
    const result = await login({
      data: formData
    });
    if (result.value === "NEED_2FA") {
      loginStep.value = 0;
      is2Fa.value = true;
      return;
    }
    is2Fa.value = false;
    await sleep(600);
    await handleNext();
  } catch (error: any) {
    loginStep.value = 0;
    reportErrorMsg(error);
  }
};

const handleNext = async () => {
  try {
    await updateUserInfo();
    loginStep.value++;
    await sleep(1000);
    loginSuccess();
  } catch (error: any) {
    console.error(error);
    loginStep.value = 0;
    Modal.error({
      title: t("TXT_CODE_da2fb99a"),
      content: t("TXT_CODE_6e718abe")
    });
  }
};

const loginSuccess = () => {
  loginStep.value++;
  if (isAdmin.value) {
    router.push({
      path: "/"
    });
  } else {
    router.push({ path: "/customer" });
  }
};

const openBuyInstanceDialog = async () => {
  router.push({ path: "/shop" });
};

onMounted(async () => {
  await execute();
  if (!appConfig.isInstall) router.push({ path: "/install" });
});
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    :class="{
      logging: loginStep === 1,
      loginDone: loginStep === 3,
      'w-100': true,
      'h-100': true
    }"
  >
    <CardPanel class="login-panel">
      <template #body>
        <div v-show="loginStep === 0" class="login-panel-body">
          <a-typography-title :level="3" class="mb-20 glitch-wrapper">
            <div
              class="glitch"
              :data-text="props.card?.title ? props.card?.title : t('TXT_CODE_3ba5ad')"
            >
              {{ props.card?.title ? props.card?.title : t("TXT_CODE_3ba5ad") }}
            </div>
          </a-typography-title>
          <a-typography-paragraph class="mb-20">
            {{ t("TXT_CODE_5b60ad00") }}
          </a-typography-paragraph>
          <div class="account-input-container">
            <form @submit.prevent>
              <div v-if="!is2Fa">
                <a-input
                  v-model:value="formData.username"
                  class="account"
                  size="large"
                  name="mcsm-name-input"
                  :placeholder="t('TXT_CODE_80a560a1')"
                >
                  <template #suffix>
                    <UserOutlined style="color: rgba(0, 0, 0, 0.45)" />
                  </template>
                </a-input>
                <a-input
                  v-model:value="formData.password"
                  class="mt-20 account"
                  type="password"
                  :placeholder="t('TXT_CODE_551b0348')"
                  size="large"
                  name="mcsm-pw-input"
                  @press-enter="handleLogin"
                >
                  <template #suffix>
                    <LockOutlined style="color: rgba(0, 0, 0, 0.45)" />
                  </template>
                </a-input>
              </div>
              <div v-else>
                <a-input
                  v-model:value="formData.code"
                  class="mt-20 mb-20 account"
                  type="text"
                  :placeholder="t('TXT_CODE_7ac8b1d3')"
                  size="large"
                  autocomplete="off"
                  name="mcsm-pw-2fa"
                  @press-enter="handleLogin"
                >
                  <template #suffix>
                    <LockOutlined style="color: rgba(0, 0, 0, 0.45)" />
                  </template>
                </a-input>
              </div>
            </form>

            <div class="mt-24 flex-between align-center">
              <div v-if="!appConfig.settings.businessMode" class="mcsmanager-link">
                <div
                  v-if="pageInfoResult?.loginInfo"
                  class="global-markdown-html"
                  v-html="markdownToHTML(pageInfoResult?.loginInfo || '')"
                ></div>
                Powered by
                <a href="https://mcsmanager.com" target="_blank" rel="noopener noreferrer">
                  MCSManager
                </a>
              </div>
              <div v-else></div>
              <div class="justify-end" style="gap: 10px">
                <a-button
                  v-if="appConfig.settings.businessMode"
                  size="large"
                  class="green"
                  style="min-width: 95px"
                  @click="openBuyInstanceDialog"
                >
                  {{ t("TXT_CODE_5a408a5e") }}
                </a-button>
                <a-button size="large" type="primary" style="min-width: 95px" @click="handleLogin">
                  {{ t("TXT_CODE_d2c1a316") }}
                </a-button>
              </div>
            </div>
          </div>
        </div>
        <div v-show="loginStep === 1" class="login-panel-body flex-center">
          <div style="text-align: center">
            <LoadingOutlined class="logging-icon" :style="{ fontSize: '62px', fontWeight: 800 }" />
          </div>
        </div>
        <div v-show="loginStep >= 2" class="login-panel-body flex-center">
          <div style="text-align: center">
            <CheckCircleOutlined
              class="login-success-icon"
              :style="{
                fontSize: '62px',
                color: 'var(--color-green-6)'
              }"
            />
          </div>
        </div>
      </template>
    </CardPanel>
  </div>
</template>

<style lang="scss">
.account-input-container {
  input:-webkit-autofill {
    -webkit-text-fill-color: var(--color-gray-8) !important;
    -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
    background-color: transparent !important;
    background-image: none;
    transition: background-color 99999s ease-in-out 0s;
  }
  input {
    background-color: transparent;
    caret-color: #fff;
  }
}
</style>

<style lang="scss" scoped>
.logging {
  .login-panel {
    transform: scale(0.94);
    border: 2px solid var(--color-blue-5);
    box-shadow: 0 0 20px rgba(28, 120, 207, 0.3);
  }
}
.login-panel {
  margin: 0 auto;
  transition: all 0.4s;
  width: 100%;
  // backdrop-filter: saturate(120%) blur(12px);
  background-color: var(--login-panel-bg);

  .login-panel-body {
    padding: 28px 24px;
    min-height: 322px;
  }
}

.mcsmanager-link {
  font-size: var(--font-body);
  text-align: right;
  color: var(--color-gray-7);
  a {
    color: var(--color-gray-7) !important;
    text-decoration: underline;
  }
}
.logging-icon {
  animation: opacityAnimation 0.4s;
}
.login-success-icon {
  animation: scaleAnimation 0.4s;
}

@keyframes opacityAnimation {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes scaleAnimation {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes moveAnimation {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(0, 8px);
  }
  50% {
    transform: translate(8px, 8px);
  }
  75% {
    transform: translate(8px, 0);
  }
  100% {
    transform: translate(0, 0);
  }
}

@keyframes moveAnimation2 {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(0, 2px);
  }
  50% {
    transform: translate(2px, 2px);
  }
  75% {
    transform: translate(2px, 0);
  }
  100% {
    transform: translate(0, 0);
  }
}

.glitch-wrapper {
  position: relative;
  overflow: hidden;
}

.glitch {
  position: relative;
  font-weight: 600;
  animation: glitch-trigger 4s infinite;

  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }

  &::before {
    color: #ff0040;
    animation: glitch-anim-1 4s infinite;
  }

  &::after {
    color: #00ffff;
    animation: glitch-anim-2 4s infinite;
  }
}

@keyframes glitch-trigger {
  0%,
  96% {
    transform: translate(0);
  }
  97%,
  100% {
    transform: translate(-1px, 1px);
  }
}

@keyframes glitch-anim-1 {
  0%,
  96% {
    transform: translate(0);
    opacity: 0;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
  97% {
    transform: translate(-2px, -2px);
    opacity: 0.7;
    clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
  }
  98% {
    transform: translate(2px, 1px);
    opacity: 0.8;
    clip-path: polygon(0 35%, 100% 35%, 100% 70%, 0 70%);
  }
  99% {
    transform: translate(-1px, 2px);
    opacity: 0.9;
    clip-path: polygon(0 70%, 100% 70%, 100% 100%, 0 100%);
  }
  100% {
    transform: translate(0);
    opacity: 0;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
}

@keyframes glitch-anim-2 {
  0%,
  96% {
    transform: translate(0);
    opacity: 0;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
  97% {
    transform: translate(2px, 1px);
    opacity: 0.6;
    clip-path: polygon(0 0, 100% 0, 100% 25%, 0 25%);
  }
  98% {
    transform: translate(-2px, -1px);
    opacity: 0.7;
    clip-path: polygon(0 25%, 100% 25%, 100% 75%, 0 75%);
  }
  99% {
    transform: translate(1px, -2px);
    opacity: 0.8;
    clip-path: polygon(0 75%, 100% 75%, 100% 100%, 0 100%);
  }
  100% {
    transform: translate(0);
    opacity: 0;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
}
</style>
