<script setup lang="ts">
import AppConfigProvider from "./components/AppConfigProvider.vue";
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import { onMounted, ref } from "vue";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import InputDialogProvider from "./components/InputDialogProvider.vue";
import { Button, Select, Input, Table } from "ant-design-vue";
import MyselfInfoDialog from "./components/MyselfInfoDialog.vue";
import { closeAppLoading } from "./tools/dom";
import { useLayoutConfigStore } from "./stores/useLayoutConfig";

const { isDarkTheme } = useAppConfigStore();
const { getSettingsConfig, hasBgImage } = useLayoutConfigStore();

function setBackground(url: string) {
  const body = document.querySelector("body");
  if (body) {
    body.style.backgroundImage = `url(${url})`;
    body.style.backgroundSize = "cover";
    body.style.backgroundPosition = "center";
    body.style.backgroundRepeat = "no-repeat";
    isDarkTheme()
      ? body.classList.add("app-dark-extend-theme")
      : body.classList.add("app-light-extend-theme");
  }
  hasBgImage.value = true;
}

if (isDarkTheme()) {
  document.body.classList.add("app-dark-theme");
} else {
  document.body.classList.add("app-light-theme");
}

[Button, Select, Input, Table].forEach((element) => {
  element.props.size.default = "large";
});

onMounted(async () => {
  const frontendSettings = await getSettingsConfig();
  if (frontendSettings?.theme?.backgroundImage)
    setBackground(frontendSettings.theme.backgroundImage);
  closeAppLoading();
});
</script>

<template>
  <AppConfigProvider :has-bg-image="hasBgImage">
    <div class="global-app-container">
      <AppHeader></AppHeader>
      <RouterView :key="$route.fullPath" />
    </div>

    <!-- Global Components -->
    <InputDialogProvider></InputDialogProvider>
    <MyselfInfoDialog></MyselfInfoDialog>
  </AppConfigProvider>
</template>
