import { ref } from "vue";
import { getModConfigFilesApi } from "@/services/apis/modManager";
import { message } from "ant-design-vue";

export function useModConfig(instanceId: string, daemonId: string, FileEditorDialog: any) {
  const showConfigModal = ref(false);
  const configFiles = ref<any[]>([]);
  const configLoading = ref(false);
  const currentMod = ref<any>(null);

  const openConfig = async (record: any) => {
    currentMod.value = record;
    showConfigModal.value = true;
    configLoading.value = true;
    configFiles.value = [];
    try {
      const { execute } = getModConfigFilesApi();
      const res = await execute({
        params: {
          daemonId: daemonId,
          uuid: instanceId,
          modId: record.id || record.name,
          fileName: record.file,
          type: record.type
        }
      });
      configFiles.value = res.value || [];
    } catch (err: any) {
      message.error(err.message);
    } finally {
      configLoading.value = false;
    }
  };

  const editFile = (file: any) => {
    showConfigModal.value = false;
    FileEditorDialog.value?.openDialog(file.path, file.name);
  };

  return {
    showConfigModal,
    configFiles,
    configLoading,
    currentMod,
    openConfig,
    editFile
  };
}
