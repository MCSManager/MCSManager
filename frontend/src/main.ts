import "ant-design-vue/dist/reset.css";
import "@/assets/base.scss";
import "@/assets/tools.scss";
import "@/assets/variables.scss";
import "@/assets/variables-dark.scss";
import "@/assets/global.scss";

import { createApp } from "vue";
import { createPinia } from "pinia";

import { router } from "./config/router";
import { i18n } from "@/lang/i18n";
import App from "./App.vue";

import { panelStatus, userInfoApi } from "./services/apis";
import { useAppStateStore } from "./stores/useAppStateStore";
import { initLayoutConfig } from "./services/layout";

window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled promise rejection:", event.reason);
});

const { updateUserInfo, state } = useAppStateStore();

async function checkPanelStatus() {
  const status = await panelStatus().execute();
  state.isInstall = status.value?.isInstall ?? true;
  if (!state.isInstall) {
    return router.push({
      path: "/init"
    });
  }
}

async function index() {
  try {
    const { execute: reqUserInfo } = userInfoApi();
    const info = await reqUserInfo();
    updateUserInfo(info.value);
    await initLayoutConfig();
  } catch (err) {
    console.error("Init user info Error:", err);
  } finally {
    const app = createApp(App);
    app.use(createPinia());
    app.use(router);
    app.use(i18n);
    app.mount("#app");
  }
  await checkPanelStatus();
}

index();
