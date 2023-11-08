import "ant-design-vue/dist/reset.css";
import "@/assets/base.scss";
import "@/assets/tools.scss";
import "@/assets/variables.scss";
import "@/assets/variables-dark.scss";
import "@/assets/global.scss";

import { createApp } from "vue";
import { createPinia } from "pinia";

import { router } from "./config/router";
import { getCurrentLang, i18n, setLanguage } from "@/lang/i18n";
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
  state.language = status.value?.language || "en_us";
  state.isInstall = status.value?.isInstall ?? true;
  state.versionChanged = status.value?.versionChange ? true : false;
  if (getCurrentLang().toLowerCase() != state.language.toLowerCase()) {
    setLanguage(state.language);
  }
}

async function index() {
  try {
    await initLayoutConfig();
    await checkPanelStatus();
    const { execute: reqUserInfo } = userInfoApi();
    const info = await reqUserInfo();
    updateUserInfo(info.value);
  } catch (err) {
    console.error("Init user info Error:", err);
  } finally {
    const app = createApp(App);
    app.use(createPinia());
    app.use(router);
    app.use(i18n);
    app.mount("#app");
  }

  if (!state.isInstall) {
    return router.push({
      path: "/init"
    });
  }
}

index();
