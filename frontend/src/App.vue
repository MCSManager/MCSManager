<script setup lang="ts">
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import enUS from "ant-design-vue/es/locale/en_US";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";
import { onMounted, ref, unref } from "vue";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { theme } from "ant-design-vue";
import { message } from "ant-design-vue";
import InputDialogProvider from "./components/InputDialogProvider.vue";
import { userInfoApi } from "./services/apis";
import { t } from "./lang/i18n";
import { router } from "./config/router";

const { getCurrentLanguage, isDarkTheme } = useAppConfigStore();
const { state } = useAppStateStore();
const locale = ref(enUS);

if (getCurrentLanguage() === "zh_CN") {
  dayjs.locale("zh-cn");
  locale.value = zhCN;
} else {
  dayjs.locale("en-us");
}

const isDarkUI = isDarkTheme();
const appTheme = {
  algorithm: theme.defaultAlgorithm
};

if (isDarkUI) {
  document.body.classList.add("app-dark-theme");
  appTheme.algorithm = theme.darkAlgorithm;
} else {
  document.body.classList.add("app-light-theme");
}

const { execute: reqUserInfo, isLoading } = userInfoApi();

onMounted(async () => {
  try {
    const info = await reqUserInfo();
    if (info.value) {
      state.userInfo = info.value;
    } else {
      throw new Error();
    }
    console.log("用户信息:", state.userInfo);
  } catch (error) {
    router.push({
      path: "/login"
    });
  }
});
</script>

<template>
  <a-config-provider :theme="appTheme" :locale="locale">
    <div class="global-app-container">
      <AppHeader></AppHeader>
      <RouterView :key="$route.fullPath" />
    </div>

    <!-- Global Components -->
    <InputDialogProvider></InputDialogProvider>
  </a-config-provider>
</template>
