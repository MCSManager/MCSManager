import { useDefineApi } from "@/stores/useDefineApi";
import { computed, onMounted, type Ref } from "vue";
import { queryUsername } from "./user";
import { Modal } from "ant-design-vue";
import { t } from "@/lang/i18n";

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

  onMounted(() => {
    config.execute({
      data: {
        targetUrl: "/api/instances/query_products",
        method: "GET",
        params: {
          addr: CURRENT_PANEL_ADDR
        }
      }
    });
  });

  return {
    ...config,
    state: config.state as Ref<ShopInfoResponse>,
    shopInfo: computed<ShopInfo>(() => config.state.value?.ispInfo),
    products: computed<ShopItem[]>(() => config.state.value?.products)
  };
}

export function useRedeem() {
  const { execute, isLoading } = requestRedeemPlatform();

  const preCheckUsername = (username: string) => {
    isLoading.value = true;
    return new Promise((resolve, reject) => {
      queryUsername()
        .execute({ params: { username } })
        .then((res) => {
          Modal.confirm({
            title: t("二次确认"),
            content: res.value?.uuid
              ? `${username} ${t("此用户名已存在，请确定这是你的账号吗？")}`
              : `${username} ${t("此用户名不存在，我们将创建一个新账号，确定吗？")}`,
            onOk: () => {
              resolve(true);
            },
            onCancel: () => {
              reject(t("用户已取消"));
            }
          });
        })
        .catch(() => {
          reject(t("网络错误"));
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
        data: { code, username }
      }
    });
    return res.value as BuyInstanceResponse;
  };

  const renewalInstance = async (username: string, code: string, instanceId: string) => {
    const res = await execute({
      data: {
        targetUrl: "/api/instances/use_redeem",
        method: "POST",
        data: { code, instanceId, username }
      }
    });
    return res.value as BuyInstanceResponse;
  };

  const queryPurchase = async (code: string) => {
    const res = await execute({
      data: {
        targetUrl: "/api/instances/purchase_history",
        method: "GET",
        params: { code }
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
