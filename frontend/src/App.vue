<script setup lang="ts">
import UploadBubble from "@/components/UploadBubble.vue";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { Button, Input, Select, Table } from "ant-design-vue";
import { onMounted } from "vue";
import { RouterView } from "vue-router";
import AppConfigProvider from "./components/AppConfigProvider.vue";
import AppHeader from "./components/AppHeader.vue";
import InputDialogProvider from "./components/InputDialogProvider.vue";
import MyselfInfoDialog from "./components/MyselfInfoDialog.vue";
import { useLayoutConfigStore } from "./stores/useLayoutConfig";
import { closeAppLoading, setLoadingTitle } from "./tools/dom";

const { isDarkTheme, setBackgroundImage } = useAppConfigStore();
const { getSettingsConfig, hasBgImage } = useLayoutConfigStore();

const GLOBAL_COMPONENTS = [InputDialogProvider, MyselfInfoDialog];

function setBackground(url: string) {
  const body = document.querySelector("body");
  if (body) {
    setBackgroundImage(url);
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
  setLoadingTitle("Loading application settings...");
  const frontendSettings = await getSettingsConfig();
  if (frontendSettings?.theme?.backgroundImage)
    setBackground(frontendSettings.theme.backgroundImage);
  closeAppLoading();
});
</script>

<template>
  <AppConfigProvider :has-bg-image="hasBgImage">
    <!-- App Container -->
    <div class="global-app-container">
      <AppHeader />
      <RouterView :key="$route.fullPath" />
      <UploadBubble />
    </div>

    <!-- Global Components -->
    <component :is="component" v-for="(component, index) in GLOBAL_COMPONENTS" :key="index" />
  </AppConfigProvider>
</template>
