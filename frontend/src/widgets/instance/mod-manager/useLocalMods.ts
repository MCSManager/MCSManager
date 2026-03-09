import { t } from "@/lang/i18n";
import {
  deleteModApi,
  getModBatchInfoApi,
  modListApi,
  toggleModApi
} from "@/services/apis/modManager";
import { message } from "ant-design-vue";
import { computed, onUnmounted, reactive, ref, watch } from "vue";

export function useLocalMods(
  instanceId: string,
  daemonId: string,
  checkAndConfirm: (
    type: string,
    name: string,
    data: any,
    immediateFn: () => Promise<void>
  ) => void,
  addDeferredTask: (type: string, name: string, data: any) => void
) {
  const loading = ref(false);
  const loadingExtra = ref(false);
  const mods = ref<any[]>([]);
  const folders = ref<string[]>(["mods", "plugins"]);
  const fileStatus = ref<any>({});
  const totalMods = ref(0);
  const currentFolder = ref<string | undefined>(undefined);

  const tablePagination = reactive({
    current: 1,
    pageSize: 50,
    total: 0,
    showSizeChanger: true,
    size: "large",
    pageSizeOptions: ["10", "20", "50"],
    showTotal: (total: number) => t("TXT_CODE_TOTAL_ITEMS", { total }),
    onChange: (page: number, size: number) => {
      tablePagination.current = page;
      tablePagination.pageSize = size;
      loadMods(currentFolder.value);
    },
    onShowSizeChange: (current: number, size: number) => {
      tablePagination.pageSize = size;
      tablePagination.current = 1;
      loadMods(currentFolder.value);
    }
  });

  const loadMods = async (folder?: string) => {
    loading.value = true;
    currentFolder.value = folder;
    try {
      const { execute } = modListApi();
      const res = await execute({
        params: {
          uuid: instanceId,
          daemonId: daemonId,
          page: tablePagination.current,
          pageSize: tablePagination.pageSize,
          folder
        }
      });
      const newMods = res.value?.mods || [];
      folders.value = res.value?.folders || [];
      fileStatus.value = res.value || {};
      totalMods.value = res.value?.total || 0;
      tablePagination.total = res.value?.total || 0;

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

      // Fetch extra info for current page mods in batch (Background)
      const hashes = mods.value
        .filter((m) => !m.extraInfo)
        .map((m) => m.hash)
        .filter((h) => !!h);
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
    return list.filter(
      (m) => m.name?.toLowerCase().includes(q) || m.file?.toLowerCase().includes(q)
    );
  });

  const filteredPlugins = computed(() => {
    const list = localPlugins.value;
    if (!pluginSearchQuery.value) return list;
    const q = pluginSearchQuery.value.toLowerCase();
    return list.filter(
      (m) => m.name?.toLowerCase().includes(q) || m.file?.toLowerCase().includes(q)
    );
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
            daemonId: daemonId,
            page: tablePagination.current,
            pageSize: tablePagination.pageSize,
            folder: currentFolder.value
          }
        });
        fileStatus.value = res.value || {};
        if (!fileStatus.value.downloadTasks?.length) {
          stopPolling();
          await loadMods(currentFolder.value);
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
    totalMods,
    currentFolder,
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
