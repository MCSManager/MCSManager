import { onUnmounted, type Ref } from "vue";
import { openIframeModal } from "../IframeModal/useIframeModal";
import { setUserApiKey } from "@/services/apis/user";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { useRemoteNode } from "@/hooks/useRemoteNode";

export interface RemoteAppDaemon {
  nodeId: number;
  nickname: string;
  panelAddr: string;
  panelKey: string;
  daemonId: string;
  daemonAddr: string;
  daemonKey: string;
}

export type IframeRouterHandler<T = any> = (
  // eslint-disable-next-line no-unused-vars
  iframe: Ref<HTMLIFrameElement | null>,
  // eslint-disable-next-line no-unused-vars
  data: T
) => Promise<any>;

export async function autoOpenUserApiKey() {
  const { execute } = setUserApiKey();
  const { state, updateUserInfo } = useAppStateStore();
  if (state.userInfo?.apiKey) {
    return {
      apiKey: state.userInfo?.apiKey
    };
  }
  await execute({
    data: {
      enable: true
    },
    forceRequest: true,
    errorAlert: true
  });
  await updateUserInfo();
  return {
    apiKey: state.userInfo?.apiKey
  };
}

export async function getUserInfo() {
  const { state } = useAppStateStore();
  return state.userInfo;
}

export const iframeRouters: Record<string, IframeRouterHandler<any>> = {
  MainAppInfo: async () => {
    await autoOpenUserApiKey();
    const userInfo = await getUserInfo();
    return {
      isDarkMode: false,
      panelId: "testId",
      code: "04HZD11WK8NA2NFAZ7EF23QB",
      userInfo: JSON.parse(JSON.stringify(userInfo))
    };
  },
  OpenNewIframePage: async (_, data: any) => {
    console.log("OpenNewIframePage", data);
    openIframeModal({
      src: data
    });
  },
  GetRemoteAppDaemons: async () => {
    await autoOpenUserApiKey();
    const { state } = useAppStateStore();
    const apiKey = state.userInfo?.apiKey;

    const { refresh: fetchRemoteAppDaemons } = useRemoteNode();
    const daemonList = await fetchRemoteAppDaemons(true);
    return daemonList.remote.map((v) => {
      return {
        nickname: v.remarks || `Daemon: ${v.ip}:${v.port}`,
        panelKey: apiKey,
        daemonId: v.uuid,
        nodeId: null,
        panelAddr: "",
        daemonAddr: "",
        daemonKey: ""
      };
    });
  }
};
