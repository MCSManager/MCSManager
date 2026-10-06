const APP_MODE_PARAM = "__mcsmanager_app";

declare global {
  interface Window {
    __MCSMANAGER_IS_APP__?: boolean;
  }
}

/**
 * Whether the current page runs inside the MCSManager Desktop app (embedded
 * iframe) instead of a plain browser. The desktop shell injects the
 * `__mcsmanager_app=1` marker into the iframe URL; this function reads that
 * marker and materializes it as `window.__MCSMANAGER_IS_APP__` so any code in
 * the page can detect app mode via the global variable.
 */
export function isAppMode(): boolean {
  if (typeof window === "undefined") return false;
  if (window.__MCSMANAGER_IS_APP__) return true;
  const marker = new URLSearchParams(window.location.search).get(APP_MODE_PARAM);
  if (marker === "1") {
    window.__MCSMANAGER_IS_APP__ = true;
    return true;
  }
  return false;
}
