import { initI18n } from "@/lang/i18n";
import { initLayoutConfig } from "./services/layout";
import { useAppStateStore } from "./stores/useAppStateStore";
import { setAppLoadingError, setLoadingTitle } from "./tools/dom";

(async function () {
  try {
    const { state, updatePanelStatus } = useAppStateStore();
    setLoadingTitle("Initializing Application...");
    await updatePanelStatus();
    setLoadingTitle("Initializing Language...");
    await initI18n(state.language);
    setLoadingTitle("Initializing Layout...");
    await initLayoutConfig();
    setLoadingTitle("Downloading JavaScript Packages...");
    const module = await import("./mount");
    setLoadingTitle("Rendering Application...");
    await module.mountApp();
    setLoadingTitle("Application loaded successfully!");
  } catch (error: any) {
    console.error("Init app error:", error);
    setAppLoadingError(error?.message || String(error));
  }
})();
