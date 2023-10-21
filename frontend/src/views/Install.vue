<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import CardPanel from "@/components/CardPanel.vue";
import { t, i18n } from "@/lang/i18n";
import { panelInstall, updateSettings, loginUser } from "@/services/apis";
import { message } from "ant-design-vue";
import type { FormInstance } from "ant-design-vue";
import { useAppRouters } from "@/hooks/useAppRouters";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { sleep } from "@/tools/commom";

const { updateUserInfo, state: appState } = useAppStateStore();
const step = ref(1);
const { toPage } = useAppRouters();
const formRef = ref<FormInstance>();
const formData = reactive({
  username: "",
  password: ""
});

const { execute: createAdminUser } = panelInstall();
const { execute: login } = loginUser();
const installLoading = ref(false);
const createUser = async () => {
  try {
    installLoading.value = true;
    await formRef.value?.validate();
    await createAdminUser({
      data: formData
    });
    await sleep(100);
    await login({
      data: {
        ...formData
      }
    });
    await sleep(200);
    await updateUserInfo();
    step.value++;
  } catch (err: any) {
    console.error(err);
    message.error(err.message);
  } finally {
    installLoading.value = false;
  }
};

const { execute: execUpdateSettings, isLoading: nextStepLoading } = updateSettings();
const selectLanguage = async (lang: "en_US" | "zh_CN") => {
  try {
    await execUpdateSettings({
      data: {
        language: lang
      }
    });
    i18n.global.locale = lang;
  } catch (err: any) {
    console.error(err);
    message.error(err.message);
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

onMounted(async () => {
  const language = window.navigator.language;
  if (language.includes("zh")) {
    await selectLanguage("zh_CN");
  } else {
    await selectLanguage("en_US");
  }
});
</script>

<template>
  <a-row :gutter="[24, 24]">
    <a-col :span="6">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 4 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="6">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 4 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="6">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 4 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="6">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 4 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="24">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 9 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="8">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 6 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="16">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 6 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="8">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 6 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="16">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 6 }" />
        </template>
      </CardPanel>
    </a-col>
  </a-row>
  <div v-if="step === 1" class="install-page-container" style="text-align: center">
    <CardPanel class="install-panel">
      <template #body>
        <a-typography>
          <a-typography-title :level="3">
            {{ t("欢迎使用 MCSManager 管理面板") }}
          </a-typography-title>
          <a-typography-paragraph>
            <a-typography-text>
              {{ t("开源，分布式，开箱即用，支持 Minecraft 游戏服务端和所有控制台程序的管理面板") }}
            </a-typography-text>
          </a-typography-paragraph>
        </a-typography>
        <a-button
          v-if="appState.isInstall"
          disabled
          class="mt-50 mb-50"
          type="primary"
          size="large"
          @click="step = 2"
        >
          {{ t("面板已安装，不可重复安装") }}
        </a-button>
        <a-button
          v-else
          :loading="nextStepLoading"
          class="mt-45 mb-45"
          type="primary"
          size="large"
          @click="step = 2"
        >
          {{ t("开始使用") }}
        </a-button>
        <a-typography>
          <a-typography-paragraph>
            <a-typography-text>
              <a href="https://mcsmanager.com/" target="_blank" rel="noopener noreferrer">
                Reference: https://mcsmanager.com/
              </a>
            </a-typography-text>
            <br />
            <a-typography-text> Released under the Apache-2.0 License. </a-typography-text>
          </a-typography-paragraph>
        </a-typography>
      </template>
    </CardPanel>
  </div>
  <div v-if="step === 2" class="install-page-container">
    <CardPanel class="install-panel">
      <template #body>
        <a-typography>
          <a-typography-title :level="3">
            {{ t("创建一个访问面板的管理员账号") }}
          </a-typography-title>
          <a-typography-paragraph>
            <a-typography-text>
              {{ t("用户名支持任何语言，请务必保证您的密码安全。") }}
            </a-typography-text>
          </a-typography-paragraph>
        </a-typography>
        <a-form ref="formRef" :model="formData" :label-col="{ span: 4 }" autocomplete="off">
          <a-form-item
            :label="t('用户名')"
            name="username"
            :rules="[{ required: true, message: t('请输入用户名') }]"
          >
            <a-input v-model:value="formData.username" />
          </a-form-item>

          <a-form-item
            :label="t('密码')"
            name="password"
            :rules="[
              {
                required: true,
                message: t('请输入密码，9 到 36 个字符，必须包含大小写字母和数字')
              }
            ]"
          >
            <a-input-password v-model:value="formData.password" />
          </a-form-item>

          <a-form-item :wrapper-col="{ offset: 4, span: 16 }">
            <a-button :loading="installLoading" type="primary" @click="createUser">
              {{ t("创建账号") }}
            </a-button>
          </a-form-item>
        </a-form>
      </template>
    </CardPanel>
  </div>
  <div v-if="step === 3" class="install-page-container">
    <CardPanel class="install-panel">
      <template #body>
        <a-typography>
          <a-typography-title :level="3">
            {{ t("大功告成！") }}
          </a-typography-title>
          <a-typography-paragraph>
            <a-typography-text>
              {{ t("最后，您是第一次使用此软件吗？") }}
            </a-typography-text>
          </a-typography-paragraph>
        </a-typography>
        <div class="final-btn mb-15" @click="toQuickStart">
          <a-typography-title :level="5">
            {{ t("首次使用") }}
          </a-typography-title>
          <a-typography-text>
            {{ t("我们将引导你使用并部署你的应用程序。") }}
          </a-typography-text>
        </div>
        <div class="final-btn" @click="toOverview">
          <a-typography-title :level="5">
            {{ t("老用户") }}
          </a-typography-title>
          <a-typography-text>
            {{ t("以更专业化的界面供你使用。") }}
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
    max-width: 460px;
    max-height: 360px;
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
