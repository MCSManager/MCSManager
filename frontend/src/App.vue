<script setup lang="ts">
import AppBottomNav from "./components/AppBottomNav.vue";
import AlertNotification from "./components/AlertNotification.vue";
import AppConfigProvider from "./components/AppConfigProvider.vue";
import AppHeader from "./components/AppHeader.vue";
import AppSidebarMenu from "./components/AppSidebarMenu.vue";
import Breadcrumbs from "./components/Breadcrumbs.vue";
import InputDialogProvider from "./components/InputDialogProvider.vue";
import MyselfInfoDialog from "./components/MyselfInfoDialog.vue";
import UploadBubble from "@/components/UploadBubble.vue";
import { useAppConfigStore } from "./stores/useAppConfigStore";
import { useAppStateStore } from "./stores/useAppStateStore";
import { useLayoutContainerStore } from "./stores/useLayoutContainerStore";
import { useScreen } from "@/hooks/useScreen";
import { closeAppLoading, setLoadingTitle } from "./tools/dom";

import { Button, Input, Select, Table } from "ant-design-vue";
import { computed, onMounted } from "vue";
import { RouterView, useRoute } from "vue-router";

const { hasBgImage, initAppTheme, useSidebarLayout } = useAppConfigStore();
const { containerState } = useLayoutContainerStore();
const { state: appState } = useAppStateStore();
const { isPhone } = useScreen();
const route = useRoute();

const GLOBAL_COMPONENTS = [InputDialogProvider, MyselfInfoDialog, UploadBubble, AlertNotification];

[Button, Select, Input, Table].forEach((element) => {
  element.props.size.default = "large";
});

const designModeNavStyle = computed(() => {
  if (!appState.userInfo) return {};
  return {
    zIndex: containerState.isDesignMode ? 997 : 1
  };
});

const isMinimalChrome = computed(() => route.meta.chromeMode === "minimal");
const showSidebarLayoutChrome = computed(() => useSidebarLayout.value && !isMinimalChrome.value);
const showAppHeader = computed(() => !showSidebarLayoutChrome.value && !isMinimalChrome.value);
const showBreadcrumbs = computed(() => !isMinimalChrome.value);
const showBottomNav = computed(
  () => isPhone.value && !showSidebarLayoutChrome.value && !isMinimalChrome.value
);

onMounted(async () => {
  setLoadingTitle("Loading application settings...");
  await initAppTheme();
  closeAppLoading();
});
</script>

<template>
  <AppConfigProvider :has-bg-image="hasBgImage">
    <!-- App Container -->
    <div class="global-app-container" :class="{ 'global-app-container--minimal': isMinimalChrome }">
      <AppSidebarMenu v-if="showSidebarLayoutChrome" :style="designModeNavStyle" />
      <main
        class="main-content"
        :class="{
          'app-layout-sidebar-only': showSidebarLayoutChrome,
          'main-content--minimal': isMinimalChrome
        }"
      >
        <AppHeader v-if="showAppHeader" :style="designModeNavStyle" />
        <Breadcrumbs v-if="showBreadcrumbs" />
        <RouterView :key="$route.path" />
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <AppBottomNav v-if="showBottomNav" />

    <!-- Global Components -->
    <component :is="component" v-for="(component, index) in GLOBAL_COMPONENTS" :key="index" />
  </AppConfigProvider>
</template>

<style lang="scss" scoped>
.global-app-container--minimal {
  max-width: 100%;
  margin: 0;
}

.main-content--minimal {
  width: 100%;
  overflow: hidden;
}
</style>
