import { initI18n } from "@/lang/i18n";
import { useAppStateStore } from "./stores/useAppStateStore";
import { panelStatus, updateSettings } from "./services/apis";
import { initLayoutConfig } from "./services/layout";
import { Spin } from "ant-design-vue";
import { LoadingOutlined } from "@ant-design/icons-vue";
import { h } from "vue";

const { state } = useAppStateStore();
const { execute: execUpdateSettings } = updateSettings();

async function changeWebPanelLanguage(lang: string) {
  try {
    await execUpdateSettings({
      data: {
        language: lang
      }
    });
  } catch (err: any) {
    console.error(err);
  }
}

function initInstallPageFlow() {
  let language = window.navigator.language;
  if (language.includes("zh")) {
    language = "zh_CN";
  } else {
    language = "en_US";
  }
  changeWebPanelLanguage(language);
  return language;
}

async function index() {
  const status = await panelStatus().execute();
  state.language = status.value?.language || "en_US";
  state.isInstall = status.value?.isInstall ?? true;
  state.versionChanged = status.value?.versionChange ? true : false;
  if (!state.isInstall) state.language = initInstallPageFlow();
  initI18n(state.language);
  await initLayoutConfig();
  const module = await import("./mount");
  await module.mountApp();
}

index();

Spin.setDefaultIndicator({
  indicator: h(LoadingOutlined, {
    style: {
      fontSize: "24px"
    },
    spin: true
  })
});
