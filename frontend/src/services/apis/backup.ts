import { useDefineApi } from "@/stores/useDefineApi";

export interface BackupInfo {
  fileName: string;
  timestamp: number;
  size: number;
  instanceUuid: string;
  instanceName: string;
}

export const createBackup = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
    };
  },
  {
    instanceUuid: string;
    backup: BackupInfo;
  }
>({
  url: "/api/protected_instance/backup/create",
  method: "POST"
});

export const listBackups = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
    };
  },
  {
    instanceUuid: string;
    backups: BackupInfo[];
  }
>({
  url: "/api/protected_instance/backup/list",
  method: "GET"
});

export const deleteBackup = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
      fileName: string;
    };
  },
  {
    instanceUuid: string;
    fileName: string;
  }
>({
  url: "/api/protected_instance/backup/delete",
  method: "POST"
});

export const restoreBackup = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
      fileName: string;
    };
  },
  {
    instanceUuid: string;
    fileName: string;
  }
>({
  url: "/api/protected_instance/backup/restore",
  method: "POST"
});

export const getBackupDownloadPath = useDefineApi<
  {
    params: {
      uuid: string;
      daemonId: string;
      fileName: string;
    };
  },
  {
    instanceUuid: string;
    fileName: string;
    path: string;
  }
>({
  url: "/api/protected_instance/backup/download",
  method: "GET"
});
