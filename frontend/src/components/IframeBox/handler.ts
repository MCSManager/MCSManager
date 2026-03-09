import { useRemoteNode } from "@/hooks/useRemoteNode";
import { setSettingInfo, settingInfo } from "@/services/apis";
import { requestBuyInstance } from "@/services/apis/redeem";
import { setUserApiKey } from "@/services/apis/user";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { openIframeModal } from "../IframeModal/useIframeModal";
import { openMarketDialog } from "../fc";

export interface RemoteAppDaemon {
  nodeId: number;
  nickname: string;
  panelAddr: string;
  panelKey: string;
  daemonId: string;
  daemonAddr: string;
  daemonKey: string;
}

interface ReportBuyInstanceData {
  code: string;
  username: string;
  product: IBusinessProductInfo;
}

export type IframeRouterHandler<T = any> = (
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
    const { state: panelStatus } = useAppStateStore();
    const { isDarkTheme } = useAppConfigStore();
    try {
      await autoOpenUserApiKey();
      const userInfo = await getUserInfo();
      const setting = await settingInfo().execute();
      return {
        isDarkMode: isDarkTheme.value,
        panelId: setting.value?.panelId || "",
        code: setting.value?.registerCode || "",
        userInfo: JSON.parse(JSON.stringify(userInfo))
      };
    } catch (err: any) {
      console.warn(`MainAppInfo error, we will use default config:`, err?.message);
      return {
        isDarkMode: isDarkTheme.value,
        panelId: panelStatus.settings.panelId,
        code: "",
        userInfo: null
      };
    }
  },
  OpenNewIframePage: async (data: any) => {
    openIframeModal({
      src: data
    });
    return true;
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
  },
  UpdatePanelSettings: async (data: any) => {
    const originSetting = await settingInfo().execute();
    if (!originSetting.value) throw new Error("Panel settings not found");
    await setSettingInfo().execute({
      data: {
        ...originSetting.value,
        panelId: originSetting.value.panelId || data?.panelId,
        registerCode: originSetting.value.registerCode || data?.registerCode
      }
    });
    return true;
  },

  BuyInstance: async (data: ReportBuyInstanceData) => {
    const res = await requestBuyInstance().execute({
      data: {
        ...data.product,
        code: data.code,
        username: data.username,
        daemonId: data.product.daemonUuid || ""
      }
    });
    return JSON.parse(JSON.stringify(res.value));
  },
  OpenMarketDialog: async (data: any) => {
    const res = await openMarketDialog(data?.daemonId, data?.instanceId, data?.options);
    if (!res) return res;
    return JSON.parse(JSON.stringify(res));
  }
};
