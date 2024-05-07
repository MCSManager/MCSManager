<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { t } from "@/lang/i18n";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  LockOutlined,
  UserOutlined
} from "@ant-design/icons-vue";
import { Modal } from "ant-design-vue";
import { onMounted, reactive, ref } from "vue";
import { router } from "@/config/router";
import { loginPageInfo, loginUser } from "@/services/apis";
import { sleep } from "@/tools/common";
import { reportErrorMsg } from "@/tools/validator";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { LayoutCard } from "@/types";
import { markdownToHTML } from "@/tools/safe";
import { message } from "ant-design-vue";

const { state: pageInfoResult, execute } = loginPageInfo();

onMounted(async () => {
  await execute();
});
const props = defineProps<{
  card?: LayoutCard;
}>();

const formData = reactive({
  username: "",
  password: "",
  code: ""
});

const { execute: login } = loginUser();
const { updateUserInfo, isAdmin } = useAppStateStore();

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
          <a-typography-title :level="3" class="mb-20">
            {{ props.card?.title ? props.card?.title : t("TXT_CODE_3ba5ad") }}
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
              <div class="mcsmanager-link">
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
              <a-button size="large" type="primary" style="min-width: 95px" @click="handleLogin">
                {{ t("TXT_CODE_d507abff") }}
              </a-button>
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
    transform: scale(0.96);
  }
}
.login-panel {
  margin: 0 auto;
  transition: all 0.6s;
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
  animation: opacityAnimation 0.6s;
}
.login-success-icon {
  animation: scaleAnimation 0.6s;
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
</style>
