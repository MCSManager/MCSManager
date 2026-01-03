<script setup lang="ts">
import UploadBubble from "@/components/UploadBubble.vue";
import { useAppConfigStore } from "@/stores/useAppConfigStore";

import { Button, Input, Select, Table } from "ant-design-vue";
import { computed, onMounted } from "vue";
import { RouterView, useRoute } from "vue-router";
import AppConfigProvider from "./components/AppConfigProvider.vue";
import AppHeader from "./components/AppHeader.vue";
import InputDialogProvider from "./components/InputDialogProvider.vue";
import MyselfInfoDialog from "./components/MyselfInfoDialog.vue";
import type { RouterMetaInfo } from "./config/router";
import { closeAppLoading, setLoadingTitle } from "./tools/dom";
const route = useRoute();

const { hasBgImage, initAppTheme } = useAppConfigStore();

const routerMeta = computed(() => route.meta as RouterMetaInfo);

const GLOBAL_COMPONENTS = [InputDialogProvider, MyselfInfoDialog, UploadBubble];

[Button, Select, Input, Table].forEach((element) => {
  element.props.size.default = "large";
});

onMounted(async () => {
  setLoadingTitle("Loading application settings...");
  await initAppTheme();
  closeAppLoading();
});
</script>

<template>
  <AppConfigProvider :has-bg-image="hasBgImage">
    <!-- App Container -->
    <div class="global-app-container" :style="routerMeta?.appContainerStyle || {}">
      <AppHeader />
      <RouterView :key="$route.fullPath" />
    </div>

    <!-- Global Components -->
    <component :is="component" v-for="(component, index) in GLOBAL_COMPONENTS" :key="index" />
  </AppConfigProvider>
</template>
