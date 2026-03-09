<script setup lang="ts">
import UploadBubble from "@/components/UploadBubble.vue";
import { useScreen } from "@/hooks/useScreen";
import { useAppConfigStore } from "@/stores/useAppConfigStore";

import { useBreakpoints } from "@vueuse/core";
import { Button, Input, Select, Table } from "ant-design-vue";
import { computed, onMounted } from "vue";
import { RouterView } from "vue-router";
import AppBottomNav from "./components/AppBottomNav.vue";
import AppConfigProvider from "./components/AppConfigProvider.vue";
import AppHeader from "./components/AppHeader.vue";
import AppSidebarMenu from "./components/AppSidebarMenu.vue";
import Breadcrumbs from "./components/Breadcrumbs.vue";
import InputDialogProvider from "./components/InputDialogProvider.vue";
import MyselfInfoDialog from "./components/MyselfInfoDialog.vue";
import { useAppStateStore } from "./stores/useAppStateStore";
import { useLayoutContainerStore } from "./stores/useLayoutContainerStore";
import { closeAppLoading, setLoadingTitle } from "./tools/dom";

const { hasBgImage, initAppTheme, sidebarPosition } = useAppConfigStore();
const { containerState } = useLayoutContainerStore();
const { state: appState } = useAppStateStore();
const { isPhone } = useScreen();

/** Whether to show the left sidebar; when false, only top header (AppHeader) is used. */
const breakpoints = useBreakpoints({ sidebar: 1300 });
const isWideEnoughForSidebar = breakpoints.greaterOrEqual("sidebar");
const useSidebarLayout = computed(
  () => sidebarPosition.value === "left" && isWideEnoughForSidebar.value
);

const GLOBAL_COMPONENTS = [InputDialogProvider, MyselfInfoDialog, UploadBubble];

[Button, Select, Input, Table].forEach((element) => {
  element.props.size.default = "large";
});

const designModeNavStyle = computed(() => {
  if (!appState.userInfo) return {};
  return {
    zIndex: containerState.isDesignMode ? 997 : 1
  };
});

onMounted(async () => {
  setLoadingTitle("Loading application settings...");
  await initAppTheme();
  closeAppLoading();
});
</script>

<template>
  <AppConfigProvider :has-bg-image="hasBgImage">
    <AppSidebarMenu v-if="useSidebarLayout" :style="designModeNavStyle" />

    <!-- App Container -->
    <div class="global-app-container" :class="{ 'app-layout-sidebar-only': useSidebarLayout }">
      <main class="main-content">
        <AppHeader v-if="!useSidebarLayout" :style="designModeNavStyle" />
        <Breadcrumbs />
        <RouterView :key="$route.fullPath" />
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <AppBottomNav v-if="isPhone && !useSidebarLayout" />

    <!-- Global Components -->
    <component :is="component" v-for="(component, index) in GLOBAL_COMPONENTS" :key="index" />
  </AppConfigProvider>
</template>

<style lang="scss" scoped>
.app-layout-sidebar-only {
  margin-top: 12px;
}
@media (max-width: 1959px) {
  .app-layout-sidebar-only {
    padding-left: 260px;
  }
}
</style>
