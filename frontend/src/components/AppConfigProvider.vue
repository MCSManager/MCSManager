<script setup lang="ts">
import zhCN from "ant-design-vue/es/locale/zh_CN";
import enUS from "ant-design-vue/es/locale/en_US";
import duration from "dayjs/plugin/duration";
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";
import dayjs from "dayjs";
import { ref } from "vue";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { theme } from "ant-design-vue";
import { ConfigProvider } from "ant-design-vue";

dayjs.extend(duration);

const { getCurrentLanguage, isDarkTheme } = useAppConfigStore();
const locale = ref(enUS);

// init language with lib
if (getCurrentLanguage().toLowerCase() === "zh_cn") {
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
  appTheme.algorithm = theme.darkAlgorithm;
}
</script>

<template>
  <ConfigProvider :theme="appTheme" :locale="locale">
    <slot></slot>
  </ConfigProvider>
</template>
