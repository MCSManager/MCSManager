import { useDefineApi } from "@/stores/useDefineApi";
import type { InstanceDetail } from "@/types";

// 此处 API 接口可以用中文写注释，后期再统一翻译成英语。

export interface MissionPassportResponse {
  addr: string;
  password: string;
}

// 请求建立终端 Socket 连接
export const setUpTerminalStreamChannel = useDefineApi<
  {
    params: {
      remote_uuid: string;
      uuid: string;
    };
  },
  MissionPassportResponse
>({
  url: "/api/protected_instance/stream_channel",
  method: "POST"
});

export const getInstanceInfo = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
    };
  },
  InstanceDetail
>({
  url: "/api/instance",
  method: "GET"
});

export const openInstance = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
    };
  },
  {
    instanceUuid: string;
  }
>({
  url: "/api/protected_instance/open",
  method: "GET"
});

export const stopInstance = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
    };
  },
  {
    instanceUuid: string;
  }
>({
  url: "/api/protected_instance/stop",
  method: "GET"
});
