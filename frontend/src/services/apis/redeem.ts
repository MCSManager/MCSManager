import { useDefineApi } from "@/stores/useDefineApi";
import { computed, onMounted, type Ref } from "vue";

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
  timeout: 1000 * 40
});

export function useShopInfo() {
  const config = requestRedeemPlatform();

  onMounted(() => {
    config.execute({
      data: {
        targetUrl: "/api/instances/products",
        method: "GET",
        params: {
          ispId: 1
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
