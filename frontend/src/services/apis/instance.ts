import { useDefineApi } from "@/stores/useDefineApi";
import type { InstanceDetail, NewInstanceForm } from "@/types";
import type { IGlobalInstanceConfig } from "../../../../common/global";

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

// 更新实例设置（普通用户）
export const updateInstanceConfig = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
    };
    data: {
      terminalOption?: {
        haveColor: boolean;
        pty: boolean;
      };
      crlf?: number;
      ie?: string;
      oe?: string;
      stopCommand?: string;
      eventTask?: {
        autoRestart: boolean;
        autoStart: boolean;
      };
      pingConfig?: {
        ip?: string;
        port?: number;
        type?: number;
      };
    };
  },
  {
    instanceUuid: string;
  }
>({
  url: "/api/protected_instance/instance_update",
  method: "PUT"
});

// 更新实例设置（管理员）
export const updateAnyInstanceConfig = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
    };
    data: IGlobalInstanceConfig;
  },
  {
    instanceUuid: string;
  }
>({
  url: "/api/instance",
  method: "PUT"
});

// 获取上传地址
export const uploadAddress = useDefineApi<
  {
    params: {
      upload_dir: string;
      remote_uuid: string;
    };
    data: NewInstanceForm;
  },
  {
    instanceUuid: string;
    password: string;
    addr: string;
  }
>({
  url: "/api/instance/upload",
  method: "POST"
});

// 上传实例文件
export const uploadInstanceFile = useDefineApi<
  {
    params: {
      unzip: number;
      code: string;
    };
    url: string;
    onUploadProgress: Function;
  },
  {}
>({
  method: "POST",
  headers: { "Content-Type": "multipart/form-data" }
});

// 新建实例
export const createInstance = useDefineApi<
  {
    params: {
      remote_uuid: string;
    };
    data: NewInstanceForm;
  },
  {
    instanceUuid: string;
    config: IGlobalInstanceConfig;
  }
>({
  method: "POST",
  url: "/api/instance"
});
