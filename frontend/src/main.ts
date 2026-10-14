import { initI18n } from "@/lang/i18n";
import { initLayoutConfig } from "./services/layout";
import { useAppStateStore } from "./stores/useAppStateStore";
import { setAppLoadingError, setLoadingTitle } from "./tools/dom";
import { isAppMode } from "./utils/appMode";

function handleLoadingError(error: any) {
  console.error("Init app error:", error);
  const errorMessage = String(error?.message || error);
  if (errorMessage.toLowerCase().includes("request failed with status code 500")) {
    setAppLoadingError("The backend is currently unavailable, please try again later.");
    return;
  }
  setAppLoadingError(errorMessage);
}

async function applyAppModeTheme() {
  if (!isAppMode()) return;
  // `types/const` derives translated constants with `t()` at module scope, so it
  // must only be evaluated after `initI18n()`; a static import would run it
  // before the i18n instance exists and yield empty strings.
  const { AppTheme, THEME_KEY } = await import("./types/const");
  localStorage.setItem(THEME_KEY, String(AppTheme.DARK));
}

async function initApp() {
  try {
    const { state, updatePanelStatus } = useAppStateStore();
    setLoadingTitle("Initializing Application...");
    await updatePanelStatus();
    setLoadingTitle("Initializing Language...");
    await initI18n(state.language);
    await applyAppModeTheme();
    setLoadingTitle("Initializing Layout...");
    await initLayoutConfig();
    setLoadingTitle("Downloading JavaScript Files...");
    const module = await import("./mount");
    setLoadingTitle("Rendering Application...");
    await module.mountApp();
  } catch (error: any) {
    handleLoadingError(error);
  }
}

initApp();
