import { useDefineApi } from "@/stores/useDefineApi";
import { computed, onMounted, ref, type Ref } from "vue";
import { queryUsername } from "./user";
import { Modal } from "ant-design-vue";
import { t } from "@/lang/i18n";
import { useAppStateStore } from "@/stores/useAppStateStore";

export interface ShopItem {
  productId: number;
  title: string;
  price: number;
  ispId?: number;
  daemonId: number;
  payload: string;
  remark: string;
}

export interface ShopInfo {
  uid?: number;
  nickname: string;
  username: string;
  lastTime: number;
  introduction: string;
  afterSalesGroup: string;
}

export interface ShopInfoResponse {
  ispInfo: ShopInfo;
  products: ShopItem[];
}

export interface BuyInstanceResponse {
  instanceId: string;
  expire: number;
  username: string;
  password: string;
  uuid: string;
}

export interface PurchaseQueryResponse {
  id: number;
  uid: number;
  nodeId: number;
  productId: number;
  panelAddr: string;
  username: string;
  password: string;
  activeTime?: number;
  code: string;
}

export const CURRENT_PANEL_ADDR = window.location.host.includes("localhost")
  ? "http://localhost:23333/"
  : `${window.location.protocol}//${window.location.host}/`;

export const requestRedeemPlatform = useDefineApi<
  {
    data: {
      targetUrl: string;
      method: string;
      data?: object;
      params?: object;
    };
  },
  any
>({
  url: "/api/exchange/request_redeem_platform",
  method: "POST",
  timeout: 1000 * 30
});

export function useShopInfo() {
  const config = requestRedeemPlatform();
  const isError = ref<Error>();
  const { state: appState } = useAppStateStore();

  const loadProducts = async (businessId?: string) => {
    try {
      isError.value = undefined;
      await config.execute({
        data: {
          targetUrl: "/api/instances/query_products",
          method: "GET",
          params: {
            addr: CURRENT_PANEL_ADDR,
            businessId: businessId || appState.settings.businessId
          }
        }
      });
    } catch (error) {
      isError.value = error as Error;
    }
  };

  onMounted(async () => {
    await loadProducts();
  });

  return {
    ...config,
    isError,
    loadProducts,
    isLoading: config.isLoading,
    state: config.state as Ref<ShopInfoResponse>,
    shopInfo: computed<ShopInfo>(() => config.state.value?.ispInfo),
    products: computed<ShopItem[]>(() => config.state.value?.products)
  };
}

export function useRedeem() {
  const { state: appState } = useAppStateStore();
  const { execute, isLoading } = requestRedeemPlatform();

  const preCheckUsername = (username: string) => {
    isLoading.value = true;
    return new Promise((resolve, reject) => {
      queryUsername()
        .execute({ params: { username } })
        .then((res) => {
          Modal.confirm({
            title: t("TXT_CODE_893567ac"),
            content: res.value?.uuid
              ? `${username} ${t("TXT_CODE_c684d8b2")}`
              : `${username} ${t("TXT_CODE_4c72565d")}`,
            onOk: () => {
              resolve(true);
            },
            onCancel: () => {
              reject(t("TXT_CODE_f94e428a"));
            }
          });
        })
        .catch(() => {
          reject(t("TXT_CODE_1d8f3c33"));
        })
        .finally(() => {
          isLoading.value = false;
        });
    });
  };

  const buyInstance = async (username: string, code: string) => {
    await preCheckUsername(username);
    const res = await execute({
      data: {
        targetUrl: "/api/instances/use_redeem",
        method: "POST",
        data: { code, username, businessId: appState.settings.businessId }
      }
    });
    return res.value as BuyInstanceResponse;
  };

  const renewalInstance = async (username: string, code: string, instanceId: string) => {
    const res = await execute({
      data: {
        targetUrl: "/api/instances/use_redeem",
        method: "POST",
        data: { code, instanceId, username, businessId: appState.settings.businessId }
      }
    });
    return res.value as BuyInstanceResponse;
  };

  const queryPurchase = async (code: string) => {
    const res = await execute({
      data: {
        targetUrl: "/api/instances/purchase_history",
        method: "GET",
        params: { code, businessId: appState.settings.businessId }
      }
    });
    return res.value as PurchaseQueryResponse;
  };

  return {
    isLoading,
    buyInstance,
    queryPurchase,
    renewInstance: renewalInstance
  };
}
