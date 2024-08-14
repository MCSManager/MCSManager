import { useDefineApi } from "@/stores/useDefineApi";

export const fileList = useDefineApi<
  {
    params: {
      daemonId: string;
      uuid: string;
      target: string;
      page: number;
      page_size: number;
      file_name: string;
    };
  },
  {
    items: {
      name: string;
      size: number;
      time: string;
      type: number;
      mode: number;
    }[];
    page: number;
    pageSize: number;
    total: number;
    absolutePath: string;
  }
>({
  url: "/api/files/list",
  method: "GET"
});

export const getFileStatus = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
    };
  },
  {
    instanceFileTask: number;
    globalFileTask: number;
    platform: string;
    isGlobalInstance: boolean;
    disks: string[];
  }
>({
  url: "/api/files/status",
  method: "GET"
});

export const addFolder = useDefineApi<
  {
    data: {
      target: string;
    };
    params: {
      uuid: string;
      daemonId: string;
    };
  },
  boolean
>({
  url: "/api/files/mkdir",
  method: "POST"
});

export const touchFile = useDefineApi<
  {
    data: {
      target: string;
    };
    params: {
      uuid: string;
      daemonId: string;
    };
  },
  boolean
>({
  url: "/api/files/touch",
  method: "POST"
});

export const deleteFile = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
    };
    data: {
      targets: string[];
    };
  },
  boolean
>({
  url: "/api/files",
  method: "DELETE"
});

export const copyFile = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
    };
    data: {
      targets: string[][];
    };
  },
  boolean
>({
  url: "/api/files/copy",
  method: "POST"
});

export const moveFile = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
    };
    data: {
      targets: string[][];
    };
  },
  boolean
>({
  url: "/api/files/move",
  method: "PUT"
});

export const compressFile = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
    };
    data: {
      type: number;
      targets: string[] | string;
      source: string;
      code: string;
    };
  },
  boolean
>({
  url: "/api/files/compress",
  method: "POST",
  timeout: Number.MAX_SAFE_INTEGER
});

export const uploadAddress = useDefineApi<
  {
    params: {
      upload_dir: string;
      daemonId: string;
      uuid: string;
    };
  },
  {
    password: string;
    addr: string;
  }
>({
  url: "/api/files/upload",
  method: "POST"
});

export const uploadFile = useDefineApi<
  {
    data: FormData;
  },
  any
>({
  method: "POST",
  headers: { "Content-Type": "multipart/form-data" }
});

export const downloadAddress = useDefineApi<
  {
    params: {
      file_name: string;
      daemonId: string;
      uuid: string;
    };
  },
  {
    password: string;
    addr: string;
  }
>({
  url: "/api/files/download",
  method: "POST"
});

export const fileContent = useDefineApi<
  {
    params: {
      daemonId: string;
      uuid: string;
    };
    data: {
      target: string;
      text?: string;
    };
  },
  string
>({
  url: "/api/files",
  method: "PUT",
  timeout: Number.MAX_SAFE_INTEGER
});

export const changePermission = useDefineApi<
  {
    params: {
      daemonId: string;
      uuid: string;
    };
    data: {
      chmod: number;
      deep: boolean;
      target: string;
    };
  },
  boolean
>({
  url: "/api/files/chmod",
  method: "PUT"
});
