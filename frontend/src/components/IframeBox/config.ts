import { onUnmounted, type Ref } from "vue";
import { iframeRouters } from "./handler";

export interface IframeEvent {
  id: string;
  source: string;
  data: any;
  error?: string;
  app: "MCSManager";
}

/* eslint-disable no-unused-vars */
export interface IframeBoxProps {
  src: string;
  width?: string | number;
  height?: string | number;
}

export interface IframeBoxEmits {
  (e: "load"): void;
  (e: "error"): void;
  (e: "resize", dimensions: { width: number; height: number }): void;
}

export function getProPanelUrl(path: string) {
  return `http://localhost:5174/#${path}`;
}

export function useIframeEventListener(iframe: Ref<HTMLIFrameElement | null>) {
  const handler = async (event: MessageEvent) => {
    const cfg = event.data as Partial<IframeEvent>;
    if (cfg?.app === "MCSManager" && cfg?.id) {
      console.debug("Receive MCSManager iframe event:", cfg);
      return await iframeEventDispatch(iframe, cfg);
    }
  };
  window.addEventListener("message", handler);

  onUnmounted(() => {
    window.removeEventListener("message", handler);
  });
}

export async function iframeEventDispatch(
  iframe: Ref<HTMLIFrameElement | null>,
  event: Partial<IframeEvent>
) {
  const routerHandler = iframeRouters[String(event.source)];
  if (typeof routerHandler === "function") {
    try {
      const result = await routerHandler(iframe, event.data);
      if (result !== undefined) {
        sendIframeMsg(iframe, event, result);
      }
    } catch (error: any) {
      event.error = error?.message || String(error);
      sendIframeMsg(iframe, event, null);
      console.error("Iframe router error:", error);
    }
  }
}

export function sendIframeMsg(
  iframe: Ref<HTMLIFrameElement | null>,
  event: Partial<IframeEvent>,
  result: any
) {
  iframe.value?.contentWindow?.postMessage(
    {
      id: event.id,
      source: event.source,
      data: result
    } as IframeEvent,
    "*"
  );
}
