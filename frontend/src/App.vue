<script setup lang="ts">
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import enUS from "ant-design-vue/es/locale/en_US";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";
import { onMounted, ref } from "vue";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { theme } from "ant-design-vue";
import InputDialogProvider from "./components/InputDialogProvider.vue";
import { router } from "./config/router";

const { getCurrentLanguage, isDarkTheme } = useAppConfigStore();
const { state, isAdmin } = useAppStateStore();
const locale = ref(enUS);

// Ant Design Vue i18n
// This will also have to be changed if a new language is added.
if (getCurrentLanguage() === "zh_CN") {
  dayjs.locale("zh-cn");
  locale.value = zhCN;
} else {
  dayjs.locale("en-us");
}

const isDarkUI = isDarkTheme();
const appTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    fontSizeLG: 14,
    fontSizeSM: 12,
    fontSizeXL: 18
  }
};

if (isDarkUI) {
  document.body.classList.add("app-dark-theme");
  appTheme.algorithm = theme.darkAlgorithm;
} else {
  document.body.classList.add("app-light-theme");
}

import { Button, Select, Input, Table, ConfigProvider } from "ant-design-vue";
import MyselfInfoDialog from "./components/MyselfInfoDialog.vue";
import { closeAppLoading } from "./tools/dom";

[Button, Select, Input, Table].forEach((element) => {
  element.props.size.default = "large";
});

onMounted(async () => {
  closeAppLoading();
  if (state.userInfo?.token && !isAdmin.value) {
    router.push({
      path: "/customer"
    });
  }

  if (!state.userInfo?.token) {
    return router.push({
      path: "/login"
    });
  }
});
</script>

<template>
  <ConfigProvider :theme="appTheme" :locale="locale">
    <div class="global-app-container">
      <AppHeader></AppHeader>
      <RouterView :key="$route.fullPath" />
    </div>

    <!-- Global Components -->
    <InputDialogProvider></InputDialogProvider>
    <MyselfInfoDialog></MyselfInfoDialog>
  </ConfigProvider>
</template>
