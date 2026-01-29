import { useDefineApi } from "@/stores/useDefineApi";

export const getMcVersionsApi = useDefineApi<{}, string[]>({
  method: "GET",
  url: "/api/mod/mc_versions"
});

export const modListApi = useDefineApi<
  {
    params: {
      daemonId: string;
      uuid: string;
      page?: number;
      pageSize?: number;
      folder?: string;
    };
  },
  {
    mods: any[];
    folders: string[];
    total: number;
    page: number;
    pageSize: number;
  }
>({
  method: "GET",
  url: "/api/mod/list"
});

export const toggleModApi = useDefineApi<
  {
    data: {
      daemonId: string;
      uuid: string;
      fileName: string;
    };
  },
  boolean
>({
  method: "POST",
  url: "/api/mod/toggle"
});

export const deleteModApi = useDefineApi<
  {
    data: {
      daemonId: string;
      uuid: string;
      fileName: string;
    };
  },
  boolean
>({
  method: "POST",
  url: "/api/mod/delete"
});

export const getModInfoApi = useDefineApi<
  {
    params: {
      hash: string;
    };
  },
  any
>({
  method: "GET",
  url: "/api/mod/info"
});

export const getModBatchInfoApi = useDefineApi<
  {
    data: {
      hashes: string[];
    };
  },
  Record<string, any>
>({
  method: "POST",
  url: "/api/mod/batch_info"
});

export const searchModsApi = useDefineApi<
  {
    params: {
      query: string;
      source?: string;
      version?: string;
      type?: string;
      loader?: string;
      environment?: string;
      offset?: number;
      limit?: number;
    };
  },
  any
>({
  method: "GET",
  url: "/api/mod/search"
});

export const getModVersionsApi = useDefineApi<
  {
    params: {
      projectId: string;
      source?: string;
    };
  },
  any[]
>({
  method: "GET",
  url: "/api/mod/versions"
});

export const downloadModApi = useDefineApi<
  {
    data: {
      daemonId: string;
      uuid: string;
      url: string;
      fileName: string;
      projectType?: string;
      fallbackUrl?: string;
    };
  },
  boolean
>({
  method: "POST",
  url: "/api/mod/download"
});

export const stopTransferApi = useDefineApi<
  {
    data: {
      daemonId: string;
      uuid: string;
      fileName: string;
      type: "download" | "upload";
      uploadId?: string;
    };
  },
  boolean
>({
  method: "POST",
  url: "/api/mod/stop_transfer"
});

export const getModConfigFilesApi = useDefineApi<
  {
    params: {
      daemonId: string;
      uuid: string;
      modId: string;
      type: string;
    };
  },
  any[]
>({
  method: "GET",
  url: "/api/mod/config_files"
});
