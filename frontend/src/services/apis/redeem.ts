import { useDefineApi } from "@/stores/useDefineApi";

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
