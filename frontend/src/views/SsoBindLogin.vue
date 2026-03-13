<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { router } from "@/config/router";
import { t } from "@/lang/i18n";
import { ssoBindCurrent, ssoBindLogin, userInfoApi } from "@/services/apis";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { sleep } from "@/tools/common";
import { reportErrorMsg } from "@/tools/validator";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  LockOutlined,
  SwapOutlined,
  UserOutlined
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { onMounted, reactive, ref } from "vue";

const { updateUserInfo, isAdmin } = useAppStateStore();
const { execute: bindExecute } = ssoBindLogin();
const { execute: bindCurrentExecute } = ssoBindCurrent();
const { execute: fetchUserInfo } = userInfoApi();

const formData = reactive({
  username: "",
  password: "",
  code: ""
});

const step = ref(0);
const is2Fa = ref(false);
const loggedInUserName = ref("");
const showLoginForm = ref(false);

onMounted(async () => {
  try {
    const info = await fetchUserInfo();
    if (info.value?.userName) {
      loggedInUserName.value = info.value.userName;
    }
  } catch {
    // Not logged in
  }
});

const handleBindCurrent = async () => {
  try {
    step.value = 1;
    await sleep(400);
    await bindCurrentExecute();
    message.success(t("TXT_CODE_SSO_BIND_SUCCESS"));
    step.value = 2;
    await updateUserInfo();
    await sleep(1000);
    if (isAdmin.value) {
      router.push({ path: "/" });
    } else {
      router.push({ path: "/customer" });
    }
  } catch (err: any) {
    step.value = 0;
    reportErrorMsg(err);
  }
};

const handleBind = async () => {
  if (!formData.username.trim() || !formData.password.trim()) {
    return message.error(t("TXT_CODE_c846074d"));
  }
  try {
    step.value = 1;
    await sleep(400);
    const result = await bindExecute({
      data: {
        username: formData.username,
        password: formData.password,
        code: formData.code || undefined
      }
    });
    if (result.value === "NEED_2FA") {
      step.value = 0;
      is2Fa.value = true;
      return;
    }
    is2Fa.value = false;
    message.success(t("TXT_CODE_SSO_BIND_SUCCESS"));
    step.value = 2;
    await updateUserInfo();
    await sleep(1000);
    if (isAdmin.value) {
      router.push({ path: "/" });
    } else {
      router.push({ path: "/customer" });
    }
  } catch (err: any) {
    step.value = 0;
    reportErrorMsg(err);
  }
};
</script>

<template>
  <div class="sso-bind-container">
    <CardPanel class="sso-bind-card">
      <template #body>
        <div v-show="step === 0" class="sso-bind-body">
          <a-typography-title :level="3" class="mb-12">
            {{ t("TXT_CODE_SSO_BIND_TITLE") }}
          </a-typography-title>
          <a-typography-paragraph class="mb-20">
            {{ t("TXT_CODE_SSO_BIND_DESC") }}
          </a-typography-paragraph>

          <!-- Already logged in: show quick bind option -->
          <div v-if="loggedInUserName && !showLoginForm">
            <a-alert type="info" show-icon class="mb-20">
              <template #message>
                {{ t('TXT_CODE_SSO_BIND_CURRENT_HINT') }}
                <strong>{{ loggedInUserName }}</strong>
              </template>
            </a-alert>

            <div class="mt-24" style="text-align: right">
              <a-button class="mr-10" @click="showLoginForm = true">
                <SwapOutlined />
                {{ t("TXT_CODE_SSO_BIND_OTHER_ACCOUNT") }}
              </a-button>
              <a-button size="large" type="primary" @click="handleBindCurrent">
                {{ t("TXT_CODE_SSO_BIND_CURRENT_BTN") }}
              </a-button>
            </div>
          </div>

          <!-- Login form for binding to a different account -->
          <div v-else>
            <div v-if="loggedInUserName" class="mb-16">
              <a-button type="link" style="padding: 0" @click="showLoginForm = false">
                &larr; {{ t("TXT_CODE_SSO_BIND_BACK_CURRENT") }}
              </a-button>
            </div>

            <form @submit.prevent>
              <div v-if="!is2Fa">
                <a-input
                  v-model:value="formData.username"
                  class="account"
                  size="large"
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
                  @press-enter="handleBind"
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
                  @press-enter="handleBind"
                >
                  <template #suffix>
                    <LockOutlined style="color: rgba(0, 0, 0, 0.45)" />
                  </template>
                </a-input>
              </div>
            </form>

            <div class="mt-24" style="text-align: right">
              <a-button size="large" type="primary" style="min-width: 95px" @click="handleBind">
                {{ t("TXT_CODE_SSO_BIND_TITLE") }}
              </a-button>
            </div>
          </div>
        </div>

        <div v-show="step === 1" class="sso-bind-body flex-center">
          <div style="text-align: center">
            <LoadingOutlined :style="{ fontSize: '62px', fontWeight: 800 }" />
          </div>
        </div>

        <div v-show="step >= 2" class="sso-bind-body flex-center">
          <div style="text-align: center">
            <CheckCircleOutlined
              :style="{ fontSize: '62px', color: 'var(--color-green-6)' }"
            />
          </div>
        </div>
      </template>
    </CardPanel>
  </div>
</template>

<style lang="scss" scoped>
.sso-bind-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}
.sso-bind-card {
  max-width: 440px;
  width: 100%;
  background-color: var(--login-panel-bg);
}
.sso-bind-body {
  padding: 28px 24px;
  min-height: 300px;
}
</style>
