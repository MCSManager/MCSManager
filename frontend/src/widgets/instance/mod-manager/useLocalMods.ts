import { ref, computed, reactive, watch, onUnmounted } from "vue";
import { t } from "@/lang/i18n";
import {
  modListApi,
  toggleModApi,
  deleteModApi,
  getModBatchInfoApi
} from "@/services/apis/modManager";
import { message } from "ant-design-vue";

export function useLocalMods(
  instanceId: string,
  daemonId: string,
  checkAndConfirm: (type: string, name: string, data: any, immediateFn: () => Promise<void>) => void,
  addDeferredTask: (type: string, name: string, data: any) => void
) {
  const loading = ref(false);
  const loadingExtra = ref(false);
  const mods = ref<any[]>([]);
  const folders = ref<string[]>(["mods", "plugins"]);
  const fileStatus = ref<any>({});

  const tablePagination = reactive({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ["10", "20", "50", "100"],
    showTotal: (total: number) => t("TXT_CODE_TOTAL_ITEMS", { total }),
    onChange: (page: number, size: number) => {
      tablePagination.current = page;
      tablePagination.pageSize = size;
    },
    onShowSizeChange: (current: number, size: number) => {
      tablePagination.pageSize = size;
      tablePagination.current = 1;
    }
  });

  const loadMods = async () => {
    loading.value = true;
    try {
      const { execute } = modListApi();
      const res = await execute({
        params: {
          uuid: instanceId,
          daemonId: daemonId
        }
      });
      const newMods = res.value?.mods || [];
      folders.value = res.value?.folders || [];
      fileStatus.value = res.value || {};
      
      // Keep existing extraInfo to avoid UI flickering
      const oldModsMap = new Map();
      mods.value.forEach((m) => {
        if (m.file) oldModsMap.set(m.file, m);
        if (m.hash) oldModsMap.set(m.hash, m);
      });

      newMods.forEach((newMod) => {
        const oldMod = oldModsMap.get(newMod.file) || oldModsMap.get(newMod.hash);
        if (oldMod && oldMod.extraInfo) {
          newMod.extraInfo = oldMod.extraInfo;
        }
      });
      mods.value = newMods;
      loading.value = false;

      // Fetch extra info for all mods in batch (Background)
      const hashes = mods.value.filter((m) => !m.extraInfo).map((m) => m.hash).filter((h) => !!h);
      if (hashes.length > 0) {
        loadingExtra.value = true;
        try {
          const { execute: fetchBatchInfo } = getModBatchInfoApi();
          const batchRes = await fetchBatchInfo({
            data: { hashes }
          });
          if (batchRes.value) {
            mods.value.forEach((mod) => {
              if (mod.hash && batchRes.value![mod.hash]) {
                mod.extraInfo = batchRes.value![mod.hash];
              }
            });
          }
        } catch (e) {
          console.error("Fetch batch info error:", e);
        } finally {
          loadingExtra.value = false;
        }
      }
    } catch (err: any) {
      message.error(err.message);
      loading.value = false;
    }
  };

  const modSearchQuery = ref("");
  const pluginSearchQuery = ref("");

  const localMods = computed(() =>
    mods.value.filter((m) => m.folder === "mods" || (m.type === "mod" && !m.folder))
  );
  const localPlugins = computed(() =>
    mods.value.filter((m) => m.folder === "plugins" || (m.type === "plugin" && !m.folder))
  );

  const filteredMods = computed(() => {
    const list = localMods.value;
    if (!modSearchQuery.value) return list;
    const q = modSearchQuery.value.toLowerCase();
    return list.filter((m) => m.name?.toLowerCase().includes(q) || m.file?.toLowerCase().includes(q));
  });

  const filteredPlugins = computed(() => {
    const list = localPlugins.value;
    if (!pluginSearchQuery.value) return list;
    const q = pluginSearchQuery.value.toLowerCase();
    return list.filter((m) => m.name?.toLowerCase().includes(q) || m.file?.toLowerCase().includes(q));
  });

  const onToggle = async (record: any) => {
    const toggleData = {
      uuid: instanceId,
      daemonId: daemonId,
      fileName: record.file
    };

    const immediateFn = async () => {
      try {
        const { execute } = toggleModApi();
        await execute({
          data: toggleData
        });
        message.success(t("TXT_CODE_7f0c746d"));
        if (record.enabled) {
          record.file = record.file + ".disabled";
          record.enabled = false;
        } else {
          record.file = record.file.replace(".disabled", "");
          record.enabled = true;
        }
      } catch (err: any) {
        message.error(err.message);
      }
    };

    checkAndConfirm("toggle", record.file, toggleData, immediateFn);
  };

  const onDelete = async (record: any) => {
    const deleteData = {
      uuid: instanceId,
      daemonId: daemonId,
      fileName: record.file
    };

    const immediateFn = async () => {
      try {
        const { execute } = deleteModApi();
        await execute({
          data: deleteData
        });
        message.success(t("TXT_CODE_7f0c746d"));
        mods.value = mods.value.filter((m) => m.file !== record.file);
      } catch (err: any) {
        message.error(err.message);
      }
    };

    checkAndConfirm("delete", record.file, deleteData, immediateFn);
  };

  let timer: any = null;
  const startPolling = () => {
    if (timer) return;
    timer = setInterval(async () => {
      try {
        const { execute } = modListApi();
        const res = await execute({
          params: {
            uuid: instanceId,
            daemonId: daemonId
          }
        });
        fileStatus.value = res.value || {};
        if (!fileStatus.value.downloadTasks?.length) {
          stopPolling();
          await loadMods();
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  watch(
    () => fileStatus.value.downloadTasks,
    (tasks) => {
      if (tasks?.length > 0) {
        startPolling();
      }
    },
    { deep: true }
  );

  onUnmounted(() => {
    stopPolling();
  });

  return {
    loading,
    loadingExtra,
    mods,
    folders,
    tablePagination,
    loadMods,
    modSearchQuery,
    pluginSearchQuery,
    filteredMods,
    filteredPlugins,
    onToggle,
    onDelete,
    fileStatus
  };
}
