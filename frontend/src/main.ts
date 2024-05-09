import { initI18n } from "@/lang/i18n";
import { useAppStateStore } from "./stores/useAppStateStore";
import { initLayoutConfig } from "./services/layout";

(async function () {
  const { state, updatePanelStatus } = useAppStateStore();
  await updatePanelStatus();
  await initI18n(state.language);
  await initLayoutConfig();
  const module = await import("./mount");
  await module.mountApp();
})();
