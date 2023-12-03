<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { t } from "@/lang/i18n";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  LockOutlined,
  UserOutlined
} from "@ant-design/icons-vue";
import { reactive, ref } from "vue";
import { router } from "@/config/router";
import { loginUser } from "@/services/apis";
import { sleep } from "@/tools/common";
import { message } from "ant-design-vue";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { LayoutCard } from "@/types";

const props = defineProps<{
  card: LayoutCard;
}>();

const formData = reactive({
  username: "",
  password: ""
});

const { execute: login } = loginUser();
const { updateUserInfo, isAdmin } = useAppStateStore();

const loginStep = ref(0);

const handleLogin = async () => {
  loginStep.value++;
  await sleep(1500);

  try {
    await login({
      data: {
        ...formData
      }
    });
    loginStep.value++;
    await sleep(1200);
    await updateUserInfo();
    await loginSuccess();
  } catch (error: any) {
    console.log(error);
    message.error(error.message ? error.message : error);
    loginStep.value--;
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
  <div
    :class="{
      logging: loginStep === 1,
      loginDone: loginStep === 3,
      'w-100': true,
      'h-100': true
    }"
    style="min-width: 356px"
  >
    <CardPanel class="login-panel">
      <template #body>
        <div v-show="loginStep === 0" class="login-panel-body">
          <a-typography-title :level="3" class="mb-20">
            {{ props.card.title ? props.card.title : t("TXT_CODE_3ba5ad") }}
          </a-typography-title>
          <a-typography-paragraph class="mb-20">
            {{ t("TXT_CODE_5b60ad00") }}
          </a-typography-paragraph>
          <div>
            <form>
              <a-input
                v-model:value="formData.username"
                :placeholder="t('TXT_CODE_80a560a1')"
                size="large"
                autocomplete="off"
              >
                <template #suffix>
                  <UserOutlined style="color: rgba(0, 0, 0, 0.45)" />
                </template>
              </a-input>
              <a-input
                v-model:value="formData.password"
                class="mt-20"
                type="password"
                :placeholder="t('TXT_CODE_551b0348')"
                size="large"
                autocomplete="off"
                @press-enter="handleLogin"
              >
                <template #suffix>
                  <LockOutlined style="color: rgba(0, 0, 0, 0.45)" />
                </template>
              </a-input>
            </form>

            <div class="mt-24 flex-between align-center">
              <div class="mcsmanager-link">
                Powered by
                <a href="https://mcsmanager.com" target="_blank" rel="noopener noreferrer">
                  MCSManager
                </a>
              </div>
              <a-button size="large" type="primary" style="min-width: 95px" @click="handleLogin">
                {{ t("TXT_CODE_940f7d5") }}
              </a-button>
            </div>
          </div>
        </div>
        <div v-show="loginStep === 1" class="login-panel-body flex-center">
          <div style="text-align: center">
            <LoadingOutlined :style="{ fontSize: '50px' }" />
          </div>
        </div>
        <div v-show="loginStep >= 2" class="login-panel-body flex-center">
          <div style="text-align: center">
            <CheckCircleOutlined
              :style="{
                fontSize: '40px',
                color: 'var(--color-green-6)'
              }"
            />
          </div>
        </div>
      </template>
    </CardPanel>
  </div>
</template>

<style lang="scss" scoped>
.loginDone {
  .login-page-container {
    opacity: 0;
    background-color: rgba(255, 255, 255, 0);
    backdrop-filter: blur(0);
    transform: scale(0.8) !important;
  }
}
.logging {
  .login-panel {
    transform: scale(0.8);
  }
}
.login-panel {
  margin: 0 auto;
  transition: all 0.6s;
  min-width: 346px;
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
