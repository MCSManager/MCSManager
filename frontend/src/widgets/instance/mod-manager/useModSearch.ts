import { ref, computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { message } from "ant-design-vue";
import { t } from "@/lang/i18n";
import {
  searchModsApi,
  getModVersionsApi,
  getMcVersionsApi,
  downloadModApi,
  deleteModApi
} from "@/services/apis/modManager";

export function useModSearch(
  instanceId: string,
  daemonId: string,
  getMods: () => any[],
  addDeferredTask: (type: string, name: string, data: any) => void,
  loadMods: () => Promise<void>
) {
  const searchFilters = useLocalStorage("mcs_mod_search_filters", {
    query: "",
    source: "all",
    version: "",
    type: "all",
    loader: "all",
    environment: "server"
  });
  const searchResults = ref<any[]>([]);
  const searchLoading = ref(false);
  const searched = ref(false);
  const searchPage = ref(1);
  const searchTotal = ref(0);
  const searchLimit = useLocalStorage("mcs_mod_search_limit", 20);

  const mcVersions = ref<string[]>([]);

  const loaderOptions = computed(() => [
    {
      label: t("TXT_CODE_LOADER"),
      options: [
        { label: t("TXT_CODE_ALL"), value: "all" },
        { label: "Forge", value: "forge" },
        { label: "Fabric", value: "fabric" },
        { label: "Quilt", value: "quilt" },
        { label: "NeoForge", value: "neoforge" }
      ]
    },
    {
      label: t("TXT_CODE_SERVER_PLUGIN_PLATFORM"),
      options: [
        { label: "Spigot", value: "spigot" },
        { label: "Paper", value: "paper" },
        { label: "Purpur", value: "purpur" },
        { label: "Folia", value: "folia" },
        { label: "BungeeCord", value: "bungeecord" },
        { label: "Velocity", value: "velocity" },
        { label: "Waterfall", value: "waterfall" }
      ]
    }
  ]);

  const loadMcVersions = async () => {
    try {
      const { execute } = getMcVersionsApi();
      const res = await execute();
      if (res.value) {
        mcVersions.value = res.value;
      }
    } catch (err: any) {
      console.error("Failed to load MC versions:", err);
    }
  };

  const resetSearch = () => {
    searchFilters.value = {
      query: "",
      source: "all",
      version: "",
      type: "all",
      loader: "all",
      environment: "server"
    };
    searchResults.value = [];
    searchTotal.value = 0;
    searched.value = false;
  };

  const onSearch = async (page: any = 1) => {
    if (!searchFilters.value.query && !searchFilters.value.version) return;
    if (typeof page !== "number") page = 1;
    searchLoading.value = true;
    searched.value = true;
    searchPage.value = page;
    try {
      const { execute } = searchModsApi();
      const res = await execute({
        params: {
          query: searchFilters.value.query,
          source: searchFilters.value.source,
          version: searchFilters.value.version,
          type: searchFilters.value.type,
          loader: searchFilters.value.loader,
          environment: searchFilters.value.environment,
          offset: (page - 1) * searchLimit.value,
          limit: searchLimit.value
        }
      });
      searchResults.value = res.value?.hits || [];
      searchTotal.value = res.value?.total_hits || 0;
    } catch (err: any) {
      message.error(err.message);
    } finally {
      searchLoading.value = false;
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "未知时间";
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 30) return `${days} 天前`;
    return date.toLocaleDateString();
  };

  const selectedMod = ref<any>(null);
  const versions = ref<any[]>([]);
  const versionsLoading = ref(false);
  const showVersionModal = ref(false);

  const sortedVersions = computed(() => {
    if (!versions.value) return [];
    const vFilter = searchFilters.value.version;
    const lFilter = searchFilters.value.loader;

    if (!vFilter && !lFilter) return versions.value;

    return [...versions.value].sort((a, b) => {
      const aMatchV = vFilter ? a.game_versions?.includes(vFilter) : false;
      const aMatchL = lFilter
        ? a.loaders?.some((l: string) => l.toLowerCase() === lFilter.toLowerCase())
        : false;
      const bMatchV = vFilter ? b.game_versions?.includes(vFilter) : false;
      const bMatchL = lFilter
        ? b.loaders?.some((l: string) => l.toLowerCase() === lFilter.toLowerCase())
        : false;

      const aScore = (aMatchV ? 2 : 0) + (aMatchL ? 1 : 0);
      const bScore = (bMatchV ? 2 : 0) + (bMatchL ? 1 : 0);

      if (aScore !== bScore) return bScore - aScore;
      return 0;
    });
  });

  const showVersions = async (mod: any) => {
    selectedMod.value = mod;
    showVersionModal.value = true;
    versionsLoading.value = true;
    try {
      const { execute } = getModVersionsApi();
      const res = await execute({
        params: {
          projectId: mod.project_id || mod.id,
          source: mod.source
        }
      });
      versions.value = res.value || [];
    } catch (err: any) {
      message.error(err.message);
    } finally {
      versionsLoading.value = false;
    }
  };

  const onDownload = async (version: any) => {
    const file = version.files.find((f: any) => f.primary) || version.files[0];
    if (!file) return;

    const downloadData = {
      uuid: instanceId!,
      daemonId: daemonId!,
      url: file.url,
      fileName: file.filename,
      projectType: selectedMod.value?.project_type
    };

    const immediateFn = async () => {
      try {
        const mods = getMods();
        const existingMod = mods.find((m) => m.extraInfo?.project?.id === selectedMod.value?.id);
        if (existingMod) {
          const { execute: deleteOldMod } = deleteModApi();
          await deleteOldMod({
            data: {
              uuid: instanceId!,
              daemonId: daemonId!,
              fileName: existingMod.file
            }
          });
        }

        const { execute } = downloadModApi();
        await execute({
          data: downloadData
        });
        const targetTab =
          selectedMod.value?.project_type === "plugin"
            ? t("TXT_CODE_PLUGIN_LIST")
            : t("TXT_CODE_MOD_LIST");
        message.success(`${t("TXT_CODE_38fb23a8")} -> ${targetTab}`);
        showVersionModal.value = false;
        await loadMods();
      } catch (err: any) {
        message.error(err.message);
      }
    };

    // Note: checkAndConfirm logic is handled in ModManager.vue
    // We pass immediateFn back or handle it via a callback
    return { type: "download", name: file.filename, data: downloadData, immediateFn };
  };

  return {
    searchFilters,
    searchResults,
    searchLoading,
    searched,
    searchPage,
    searchTotal,
    searchLimit,
    mcVersions,
    loaderOptions,
    loadMcVersions,
    resetSearch,
    onSearch,
    formatDate,
    selectedMod,
    versions,
    versionsLoading,
    showVersionModal,
    sortedVersions,
    showVersions,
    onDownload
  };
}
