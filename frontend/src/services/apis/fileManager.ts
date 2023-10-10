import { useDefineApi } from "@/stores/useDefineApi";

// 获取文件列表
export const getFileList = useDefineApi<
  {
    params: {
      remote_uuid: string;
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

// 获取文件状态
export const getFileStatus = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
    };
  },
  {
    instanceFileTask: number;
    globalFileTask: number;
    platform: string;
    isGlobalInstance: boolean;
    dist: string[];
  }
>({
  url: "/api/files/status",
  method: "GET"
});

// 新建文件夹
export const addFolder = useDefineApi<
  {
    data: {
      target: string;
    };
    params: {
      uuid: string;
      remote_uuid: string;
    };
  },
  boolean
>({
  url: "/api/files/mkdir",
  method: "POST"
});

// 新建文件
export const touchFile = useDefineApi<
  {
    data: {
      target: string;
    };
    params: {
      uuid: string;
      remote_uuid: string;
    };
  },
  boolean
>({
  url: "/api/files/touch",
  method: "POST"
});

// 删除文件
export const deleteFile = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
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

// 复制文件
export const copyFile = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
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

// 移动文件
export const moveFile = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
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

// 解压缩
export const compressFile = useDefineApi<
  {
    params: {
      uuid: string;
      remote_uuid: string;
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
  method: "POST"
});

// 获取文件上传地址
export const uploadAddress = useDefineApi<
  {
    params: {
      upload_dir: string;
      remote_uuid: string;
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

// 上传文件
export const uploadFile = useDefineApi<
  {
    data: FormData;
    url: string;
    onUploadProgress: Function;
  },
  {}
>({
  method: "POST",
  headers: { "Content-Type": "multipart/form-data" }
});

// 获取文件下载地址
export const downloadAddress = useDefineApi<
  {
    params: {
      file_name: string;
      remote_uuid: string;
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
