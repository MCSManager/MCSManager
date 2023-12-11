import { initI18n, initInstallPageFlow, toStandardLang } from "@/lang/i18n";
import { useAppStateStore } from "./stores/useAppStateStore";
import { panelStatus } from "./services/apis";
import { initLayoutConfig } from "./services/layout";

(async function () {
  const { state, updatePanelStatus } = useAppStateStore();
  await updatePanelStatus();
  initI18n(state.language);
  await initLayoutConfig();
  const module = await import("./mount");
  await module.mountApp();
})();
