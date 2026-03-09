import "ant-design-vue/dist/reset.css";
import "@/assets/base.scss";
import "@/assets/tools.scss";
import "@/assets/variables.scss";
import "@/assets/variables-dark.scss";
import "@/assets/global.scss";
import "@/assets/bg-extend-theme.scss";

import "./initLib";

import { createApp } from "vue";
import { createPinia } from "pinia";

import { router } from "./config/router";
import { getI18nInstance } from "@/lang/i18n";
import App from "./App.vue";

import { userInfoApi } from "./services/apis";
import { useAppStateStore } from "./stores/useAppStateStore";

window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled promise rejection:", event.reason);
});

const { updateUserInfo } = useAppStateStore();

export async function mountApp() {
  try {
    const { execute: reqUserInfo } = userInfoApi();
    const info = await reqUserInfo();
    updateUserInfo(info.value);
  } catch (err) {
    console.error("Init user info Error:", err);
  } finally {
    const app = createApp(App);
    app.use(createPinia());
    app.use(router);
    app.use(getI18nInstance());
    app.mount("#app-mount-point");
  }
}
