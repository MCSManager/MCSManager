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

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);

app.mount("#app");
