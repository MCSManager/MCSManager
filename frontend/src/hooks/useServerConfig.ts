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
    serverConfigFiles.value = getInstanceConfigByType(type).map((v: InstanceConfigs) => v.path);
    await requestConfigFileList({
      params: {
        uuid: instanceId ?? "",
        daemonId: daemonId ?? ""
      },
      data: {
        files: serverConfigFiles.value
      }
    });
  };

  return {
    configFileList,
    isLoadingConfigFileList,
    serverConfigFiles,
    refresh
  };
}
