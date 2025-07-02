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

export const requestBuyInstance = useDefineApi<
  {
    data: {
      productId: number;
      daemonId: number;
      payload: string;
      code: string;
      instanceId?: string;
      username?: string;
    };
  },
  any
>({
  url: "/api/exchange/request_buy_instance",
  method: "POST",
  timeout: 1000 * 30
});

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
