import { useDefineApi } from "@/stores/useDefineApi";

export interface ShopInfo {
  uid?: number;
  nickname: string;
  username: string;
  lastTime: number;
  introduction: string;
  afterSalesGroup: string;
}

export interface PortInfoProtocol {
  host: number;
  container: number;
  protocol: string;
}
export interface InstanceInfoProtocol {
  instance_id: string;
  name: string;
  expire: number;
  status: number;
  lines: Array<{ title: string; value: any }>;
  ports: PortInfoProtocol[];
}

export interface BuyInstanceResponse {
  instance_id: string;
  username: string;
  password: string;
  uuid: string;
  expire: number;
  instance_config?: IGlobalInstanceConfig;
  instance_info?: InstanceInfoProtocol;
}

export const requestBuyInstance = useDefineApi<
  {
    data: {
      productId: number;
      daemonId: string;
      code: string;
      instanceId?: string;
      payload?: string;
      username?: string;
    };
  },
  BuyInstanceResponse
>({
  url: "/api/exchange/request_buy_instance",
  method: "POST",
  timeout: 1000 * 30
});
