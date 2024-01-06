<script setup lang="ts">
import AppConfigProvider from "./components/AppConfigProvider.vue";
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import { onMounted } from "vue";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import InputDialogProvider from "./components/InputDialogProvider.vue";
import { Button, Select, Input, Table } from "ant-design-vue";
import MyselfInfoDialog from "./components/MyselfInfoDialog.vue";
import { closeAppLoading } from "./tools/dom";

const { isDarkTheme } = useAppConfigStore();

if (isDarkTheme()) {
  document.body.classList.add("app-dark-theme");
} else {
  document.body.classList.add("app-light-theme");
}

[Button, Select, Input, Table].forEach((element) => {
  element.props.size.default = "large";
});

onMounted(async () => {
  closeAppLoading();
});
</script>

<template>
  <AppConfigProvider>
    <div class="global-app-container">
      <AppHeader></AppHeader>
      <RouterView :key="$route.fullPath" />
    </div>

    <!-- Global Components -->
    <InputDialogProvider></InputDialogProvider>
    <MyselfInfoDialog></MyselfInfoDialog>
  </AppConfigProvider>
</template>
