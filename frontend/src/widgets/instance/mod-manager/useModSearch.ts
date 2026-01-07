import { ref, computed, type Ref, createVNode } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { message, Modal, Button, Space } from "ant-design-vue";
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
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
  loadMods: () => Promise<void>,
  folders: Ref<string[]>
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
  const searchLimit = useLocalStorage("mcs_mod_search_limit", 10);

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
    searchPage.value = 1;
    searched.value = false;
  };

  const onSearch = async (page: any = 1, limit: any = null) => {
    if (typeof page !== "number") page = 1;
    if (limit && typeof limit === "number") searchLimit.value = limit;
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
    if (!d) return t("TXT_CODE_UNKNOWN_TIME");
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return t("TXT_CODE_TODAY");
    if (days === 1) return t("TXT_CODE_YESTERDAY");
    if (days < 30) return `${days} ${t("TXT_CODE_DAYS_AGO")}`;
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

      // Fallback 1: Date (Latest first)
      const aDate = new Date(a.date_published || a.published_at || a.updated || 0).getTime();
      const bDate = new Date(b.date_published || b.published_at || b.updated || 0).getTime();
      if (aDate !== bDate && !isNaN(aDate) && !isNaN(bDate)) return bDate - aDate;

      // Fallback 2: Version number (Natural sort, Latest first)
      return (b.version_number || "").localeCompare(a.version_number || "", undefined, {
        numeric: true,
        sensitivity: "base"
      });
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

    // Find fallback URL if available (e.g., from SpigotMC version list)
    const fallbackFile = version.files.find((f: any) => f.url !== file.url);
    const fallbackUrl = fallbackFile?.url;

    // 1. Automatic detection logic
    let detectedType = version.project_type || selectedMod.value?.project_type || "mod";

    const pluginLoaders = [
      "spigot",
      "paper",
      "purpur",
      "folia",
      "bungeecord",
      "velocity",
      "waterfall"
    ];
    const isPluginLoader = version.loaders?.some((l: string) =>
      pluginLoaders.includes(l.toLowerCase())
    );

    if (isPluginLoader || selectedMod.value?.source === "SpigotMC") {
      detectedType = "plugin";
    }

    // 2. Handle hybrid servers (both folders exist)
    let finalType = detectedType;
    const hasMods = folders.value.includes("mods");
    const hasPlugins = folders.value.includes("plugins");

    if (hasMods && hasPlugins) {
      try {
        finalType = await new Promise((resolve, reject) => {
          const modal = Modal.confirm({
            title: t("TXT_CODE_MOD_SELECT_SAVE_DIR"),
            icon: createVNode(ExclamationCircleOutlined),
            content: "",
            footer: createVNode("div", { style: "text-align: right; margin-top: 20px;" }, [
              createVNode(
                Button,
                {
                  onClick: () => {
                    modal.destroy();
                    reject(new Error("Cancelled"));
                  }
                },
                { default: () => t("TXT_CODE_a0451c97") }
              ),
              createVNode(
                Button,
                {
                  type: detectedType === "mod" ? "primary" : "default",
                  style: "margin-left: 8px",
                  onClick: () => {
                    modal.destroy();
                    resolve("mod");
                  }
                },
                { default: () => t("TXT_CODE_MOD") }
              ),
              createVNode(
                Button,
                {
                  type: detectedType === "plugin" ? "primary" : "default",
                  style: "margin-left: 8px",
                  onClick: () => {
                    modal.destroy();
                    resolve("plugin");
                  }
                },
                { default: () => t("TXT_CODE_PLUGIN") }
              )
            ])
          });
        });
      } catch (e) {
        return; // User cancelled
      }
    } else if (hasPlugins && !hasMods) {
      finalType = "plugin";
    } else if (hasMods && !hasPlugins) {
      finalType = "mod";
    }

    const downloadData = {
      uuid: instanceId!,
      daemonId: daemonId!,
      url: file.url,
      fallbackUrl,
      fileName: file.filename || file.name || (file.url?.split("/").pop()),
      projectType: finalType
    };

    const immediateFn = async () => {
      try {
        const mods = getMods();
        const currentProjectType = downloadData.projectType;
        const existingMod = mods.find((m) => m.extraInfo?.project?.id === selectedMod.value?.id);

        const { execute } = downloadModApi();
        await execute({
          data: {
            ...downloadData,
            projectType: currentProjectType,
            extraInfo: {
              project: {
                id: selectedMod.value?.id,
                name: selectedMod.value?.title || selectedMod.value?.name,
                icon_url: selectedMod.value?.icon_url || selectedMod.value?.thumbnail
              },
              version: {
                id: version.id,
                name: version.name,
                version_number: version.version_number
              },
              source: selectedMod.value?.source
            }
          }
        });

        // If download starts successfully and there's an existing mod, delete it
        if (existingMod) {
          try {
            const { execute: deleteOldMod } = deleteModApi();
            await deleteOldMod({
              data: {
                uuid: instanceId!,
                daemonId: daemonId!,
                fileName: existingMod.file
              }
            });
          } catch (e) {
            console.warn("Failed to delete old mod version:", e);
          }
        }

        const targetTab =
          currentProjectType === "plugin" ? t("TXT_CODE_PLUGIN_LIST") : t("TXT_CODE_MOD_LIST");
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
