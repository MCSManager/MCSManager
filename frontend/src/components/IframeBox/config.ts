import { onUnmounted, type Ref } from "vue";

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

const iframeRouters: Record<
  string,
  (iframe: Ref<HTMLIFrameElement | null>, data: any) => Promise<any>
> = {
  MainAppInfo: async (iframe: Ref<HTMLIFrameElement | null>, data: any) => {
    return {
      isDarkMode: false,
      panelId: "testId",
      code: "04HZD11WK8NA2NFAZ7EF23QB"
    };
  }
};

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
    } catch (error) {
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
