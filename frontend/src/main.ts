import { initI18n } from "@/lang/i18n";
import { initLayoutConfig } from "./services/layout";
import { useAppStateStore } from "./stores/useAppStateStore";
import { setAppLoadingError, setLoadingTitle } from "./tools/dom";

function handleLoadingError(error: any) {
  console.error("Init app error:", error);
  const errorMessage = String(error?.message || error);
  if (errorMessage.toLowerCase().includes("request failed with status code 500")) {
    setAppLoadingError("The backend is currently unavailable, please try again later.");
    return;
  }
  setAppLoadingError(errorMessage);
}

const getHashPath = () => {
  const rawHash = window.location.hash.replace(/^#/, "");
  return rawHash.split("?")[0] || "/";
};

const isControlStandalonePreviewEntry = () => getHashPath() === "/control";

const isBackendUnavailableError = (error: any) => {
  const message = String(error?.message || error).toLowerCase();
  return (
    message.includes("request failed with status code 404") ||
    message.includes("request failed with status code 500") ||
    message.includes("network error") ||
    message.includes("failed to fetch") ||
    message.includes("econnrefused") ||
    message.includes("timeout")
  );
};

async function initStandaloneControlPreview() {
  const { state, enableLocalPreviewAccess } = useAppStateStore();
  enableLocalPreviewAccess();
  setLoadingTitle("Initializing Local Control Preview...");
  await initI18n(state.language);
  const module = await import("./mount");
  await module.mountApp();
}

async function initApp() {
  try {
    const { state, updatePanelStatus } = useAppStateStore();
    setLoadingTitle("Initializing Application...");
    await updatePanelStatus();
    setLoadingTitle("Initializing Language...");
    await initI18n(state.language);
    setLoadingTitle("Initializing Layout...");
    await initLayoutConfig();
    setLoadingTitle("Downloading JavaScript Files...");
    const module = await import("./mount");
    setLoadingTitle("Rendering Application...");
    await module.mountApp();
  } catch (error: any) {
    if (isControlStandalonePreviewEntry() && isBackendUnavailableError(error)) {
      try {
        await initStandaloneControlPreview();
        return;
      } catch (previewError: any) {
        handleLoadingError(previewError);
        return;
      }
    }
    handleLoadingError(error);
  }
}

initApp();
