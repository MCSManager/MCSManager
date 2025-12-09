<script setup lang="ts">
import { theme, useAppConfigStore } from "@/stores/useAppConfigStore";
import enUS from "ant-design-vue/es/locale/en_US";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import duration from "dayjs/plugin/duration";
import { ref } from "vue";

import { ConfigProvider } from "ant-design-vue";

dayjs.extend(duration);

const { getCurrentLanguage } = useAppConfigStore();
const locale = ref(enUS);

// init language with lib
if (getCurrentLanguage().toLowerCase() === "zh_cn") {
  dayjs.locale("zh-cn");
  locale.value = zhCN;
} else {
  dayjs.locale("en-us");
}
</script>

<template>
  <ConfigProvider :theme="theme" :locale="locale">
    <slot></slot>
  </ConfigProvider>
</template>
