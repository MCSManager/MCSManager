import { getConfigFileList } from "@/services/apis/instance";
import { ref } from "vue";
import { getInstanceConfigByType, type InstanceConfigs } from "./useInstance";

export function useServerConfig() {
  const {
    execute: requestConfigFileList,
    state: configFileList,
    isLoading: isLoadingConfigFileList
  } = getConfigFileList();

  const serverConfigFiles = ref<string[]>([]);

  const refresh = async (type: string, instanceId: string, daemonId: string) => {
    serverConfigFiles.value = [];
    const configs = getInstanceConfigByType(type);
    const candidateFiles: string[] = configs.flatMap((config: InstanceConfigs) => [
      config.path,
      config.initializeFrom || ""
    ]);
    serverConfigFiles.value = Array.from(new Set<string>(candidateFiles)).filter(Boolean);
    await requestConfigFileList({
      params: {
        uuid: instanceId ?? "",
        daemonId: daemonId ?? ""
      },
      data: {
        files: serverConfigFiles.value
      }
    });
    serverConfigFiles.value = (configFileList.value || []).map((item) => item.file);
  };

  return {
    configFileList,
    isLoadingConfigFileList,
    serverConfigFiles,
    refresh
  };
}
