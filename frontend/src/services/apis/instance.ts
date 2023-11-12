import { useDefineApi } from "@/stores/useDefineApi";
import type { InstanceDetail, NewInstanceForm, QuickStartTemplate, Schedule } from "@/types";
import type { IGlobalInstanceConfig } from "../../../../common/global";
import type { InstanceMoreDetail } from "@/hooks/useInstance";

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
    data: FormData;
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

// 获取快速安装列表地址
export const quickInstallListAddr = useDefineApi<any, QuickStartTemplate[]>({
  url: "/api/instance/quick_install_list",
  method: "GET"
});

// 创建实例安装异步任务
export const createAsyncTask = useDefineApi<
  {
    params: {
      remote_uuid: string;
      uuid: string;
      task_name: string;
    };
    data: {
      time: number;
      newInstanceName: string;
      targetLink: string;
    };
  },
  {
    instanceConfig: IGlobalInstanceConfig;
    instanceStatus: number;
    instanceUuid: string;
    status: number;
    taskId: string;
  }
>({
  url: "/api/protected_instance/asynchronous",
  method: "POST"
});

// 获取安装进度
export const queryAsyncTask = useDefineApi<
  {
    params: {
      remote_uuid: string;
      uuid: string;
      task_name: string;
    };
    data: {
      taskId: string;
    };
  },
  {
    taskId: string;
    status: number;
    detail: {
      instanceConfig: IGlobalInstanceConfig;
      instanceStatus: number;
      instanceUuid: string;
      status: number;
      taskId: string;
    };
  }
>({
  url: "/api/protected_instance/query_asynchronous",
  method: "POST"
});

// 获取配置文件列表
export const getConfigFileList = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
    };
    data: {
      files: string[];
    };
  },
  {
    check: boolean;
    file: string;
  }[]
>({
  method: "POST",
  url: "/api/protected_instance/process_config/list"
});

// 获取配置文件内容
export const getConfigFile = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
      fileName: string;
      type: string;
    };
  },
  any
>({
  method: "GET",
  url: "/api/protected_instance/process_config/file"
});

// 更新配置文件内容
export const updateConfigFile = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
      fileName: string;
      type: string;
    };
    data: any;
  },
  boolean
>({
  method: "PUT",
  url: "/api/protected_instance/process_config/file"
});

// 批量开启
export const batchStart = useDefineApi<
  {
    data: {
      instanceUuid: string;
      serviceUuid: string;
    }[];
  },
  boolean
>({
  method: "POST",
  url: "/api/instance/multi_open"
});

// 批量停止
export const batchStop = useDefineApi<
  {
    data: {
      instanceUuid: string;
      serviceUuid: string;
    }[];
  },
  boolean
>({
  method: "POST",
  url: "/api/instance/multi_stop"
});

// 批量终止
export const batchKill = useDefineApi<
  {
    data: {
      instanceUuid: string;
      serviceUuid: string;
    }[];
  },
  boolean
>({
  method: "POST",
  url: "/api/instance/multi_kill"
});

// 批量删除
export const batchDelete = useDefineApi<
  {
    params: {
      remote_uuid: string;
    };
    data: {
      uuids: string[];
      deleteFile: boolean;
    };
  },
  string[]
>({
  method: "DELETE",
  url: "/api/instance"
});

// 获取计划任务
export const scheduleList = useDefineApi<
  {
    params: {
      remote_uuid: string;
      uuid: string;
    };
  },
  Schedule[]
>({
  method: "GET",
  url: "/api/protected_schedule"
});

// 删除计划任务
export const scheduleDelete = useDefineApi<
  {
    params: {
      remote_uuid: string;
      uuid: string;
      task_name: string;
    };
  },
  boolean
>({
  method: "DELETE",
  url: "/api/protected_schedule"
});
