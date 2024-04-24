import { useDefineApi } from "@/stores/useDefineApi";
import type {
  InstanceDetail,
  NewInstanceForm,
  QuickStartTemplate,
  Schedule,
  NewScheduleTask,
  LabelValueOption,
  JsonData
} from "@/types";
import type { IGlobalInstanceConfig } from "../../../../common/global";

export interface MissionPassportResponse {
  addr: string;
  password: string;
  prefix: string;
}

export const setUpTerminalStreamChannel = useDefineApi<
  {
    params: {
      daemonId: string;
      uuid: string;
    };
  },
  MissionPassportResponse
>({
  url: "/api/protected_instance/stream_channel",
  method: "POST"
});

export const getInstanceOutputLog = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
    };
  },
  string
>({
  url: "/api/protected_instance/outputlog",
  method: "GET"
});

export const getInstanceInfo = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
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
      daemonId: string;
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
      daemonId: string;
    };
  },
  {
    instanceUuid: string;
  }
>({
  url: "/api/protected_instance/stop",
  method: "GET"
});

export const restartInstance = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
    };
  },
  {
    instanceUuid: string;
  }
>({
  url: "/api/protected_instance/restart",
  method: "GET"
});

export const killInstance = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
    };
  },
  {
    instanceUuid: string;
  }
>({
  url: "/api/protected_instance/kill",
  method: "GET"
});

export const updateInstance = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
      task_name: string;
    };
    data: {
      time: number;
    };
  },
  boolean
>({
  url: "/api/protected_instance/asynchronous",
  method: "POST"
});

export const updateInstanceConfig = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
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

export const updateAnyInstanceConfig = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
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

export const uploadAddress = useDefineApi<
  {
    params: {
      upload_dir: string;
      daemonId: string;
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

export const uploadInstanceFile = useDefineApi<
  {
    params: {
      unzip: number;
      code: string;
    };
    data: FormData;
  },
  any
>({
  method: "POST",
  headers: { "Content-Type": "multipart/form-data" }
});

export const createInstance = useDefineApi<
  {
    params: {
      daemonId: string;
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

export const quickInstallListAddr = useDefineApi<any, QuickStartTemplate>({
  url: "/api/instance/quick_install_list",
  method: "GET"
});

export const createAsyncTask = useDefineApi<
  {
    params: {
      daemonId: string;
      uuid: string;
      task_name: string;
    };
    data: {
      time: number;
      newInstanceName: string;
      targetLink?: string;
      setupInfo?: JsonData;
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

export const queryAsyncTask = useDefineApi<
  {
    params: {
      daemonId: string;
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

export const getConfigFileList = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
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

export const getConfigFile = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
      fileName: string;
      type: string;
    };
  },
  any
>({
  method: "GET",
  url: "/api/protected_instance/process_config/file"
});

export const updateConfigFile = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
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

export const batchStart = useDefineApi<
  {
    data: {
      instanceUuid: string;
      daemonId: string;
    }[];
  },
  boolean
>({
  method: "POST",
  url: "/api/instance/multi_open"
});

export const batchStop = useDefineApi<
  {
    data: {
      instanceUuid: string;
      daemonId: string;
    }[];
  },
  boolean
>({
  method: "POST",
  url: "/api/instance/multi_stop"
});

export const batchKill = useDefineApi<
  {
    data: {
      instanceUuid: string;
      daemonId: string;
    }[];
  },
  boolean
>({
  method: "POST",
  url: "/api/instance/multi_kill"
});

export const batchDelete = useDefineApi<
  {
    params: {
      daemonId: string;
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

export const scheduleList = useDefineApi<
  {
    params: {
      daemonId: string;
      uuid: string;
    };
  },
  Schedule[]
>({
  method: "GET",
  url: "/api/protected_schedule"
});

export const scheduleDelete = useDefineApi<
  {
    params: {
      daemonId: string;
      uuid: string;
      task_name: string;
    };
  },
  boolean
>({
  method: "DELETE",
  url: "/api/protected_schedule"
});

export const scheduleCreate = useDefineApi<
  {
    params: {
      daemonId: string;
      uuid: string;
    };
    data: NewScheduleTask;
  },
  boolean
>({
  url: "/api/protected_schedule",
  method: "POST"
});

export const reinstallInstance = useDefineApi<
  {
    params: {
      daemonId: string;
      uuid: string;
    };
    data: {
      targetUrl?: string;
      title: string;
      description: string;
    };
  },
  boolean
>({
  url: "/api/protected_instance/install_instance",
  method: "POST"
});
