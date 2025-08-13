import { v4 } from "uuid";
import { onUnmounted, type Ref } from "vue";
import { iframeRouters } from "./handler";

export interface IframeEvent {
  id: string;
  source: string;
  data: any;
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

const globalReqIdMap = new Map<string, boolean>();
const globalIframeList = new Map<string, Ref<HTMLIFrameElement | null>>();

export function getProPanelUrl(path: string) {
  return `http://localhost:5174/#${path}`;
}

export function useIframeEventListener(iframe: Ref<HTMLIFrameElement | null>) {
  const iframeId = v4();
  globalIframeList.set(iframeId, iframe);
  const handler = async (event: MessageEvent) => {
    const cfg = event.data as Partial<IframeEvent>;
    if (cfg?.app === "MCSManager" && cfg?.id) {
      return await iframeEventDispatch(cfg);
    }
  };
  window.addEventListener("message", handler);

  onUnmounted(() => {
    globalIframeList.delete(iframeId);
    window.removeEventListener("message", handler);
  });
}

export async function iframeEventDispatch(event: Partial<IframeEvent>) {
  const routerHandler = iframeRouters[String(event.source)];
  if (event.id && typeof routerHandler === "function" && !globalReqIdMap.has(String(event.id))) {
    console.warn("iframeEventDispatch(): Receive iframe event:", event);
    globalReqIdMap.set(String(event.id), true);
    setTimeout(() => {
      globalReqIdMap.delete(String(event.id));
    }, 1000 * 10);
    try {
      const result = await routerHandler(event.data);
      console.warn("iframeEventDispatch(): Send iframe event:", event, result);
      globalIframeList.forEach((iframe) => sendIframeMsg(iframe, event, result));
    } catch (error: any) {
      console.error("Iframe router error:", error);
      globalIframeList.forEach((iframe) =>
        sendIframeMsg(iframe, event, error instanceof Error ? error : new Error(String(error)))
      );
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
