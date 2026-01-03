<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, createVNode } from "vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import {
  modListApi,
  toggleModApi,
  deleteModApi,
  getModBatchInfoApi,
  getModConfigFilesApi
} from "@/services/apis/modManager";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useScreen } from "@/hooks/useScreen";
import { useFileManager } from "@/hooks/useFileManager";
import { useInstanceInfo } from "@/hooks/useInstance";
import { message, Dropdown, Menu, MenuItem, Alert, Modal, Button } from "ant-design-vue";
import {
  SearchOutlined,
  SettingOutlined,
  FileTextOutlined,
  LoadingOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  CloudDownloadOutlined
} from "@ant-design/icons-vue";
import FileEditor from "./dialogs/FileEditor.vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import CardPanel from "@/components/CardPanel.vue";

// Refactored components and hooks
import ModFloatingTools from "./mod-manager/ModFloatingTools.vue";
import ModVersionModal from "./mod-manager/ModVersionModal.vue";
import ModConfigModal from "./mod-manager/ModConfigModal.vue";
import { useDeferredTasks } from "./mod-manager/useDeferredTasks";
import { useModSearch } from "./mod-manager/useModSearch";

const props = defineProps<{
  card: LayoutCard;
}>();

const { isPhone } = useScreen();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const { getFileStatus, fileStatus } = useFileManager(instanceId, daemonId);
const { instanceInfo } = useInstanceInfo({ instanceId, daemonId, autoRefresh: true });

const isWindows = computed(() => {
  const cwd = instanceInfo.value?.config?.cwd || "";
  const isDocker = instanceInfo.value?.config?.processType === "docker";
  return !isDocker && (/^[a-zA-Z]:\\/.test(cwd) || cwd.includes("\\"));
});
const isRunning = computed(() => {
  const status = instanceInfo.value?.status;
  return status !== undefined && status !== 0 && status !== -1;
});

const loading = ref(false);
const loadingExtra = ref(false);
const mods = ref<any[]>([]);
const folders = ref<string[]>(["mods", "plugins"]);

const loadMods = async () => {
  loading.value = true;
  try {
    const { execute } = modListApi();
    const res = await execute({
      params: {
        uuid: instanceId!,
        daemonId: daemonId!
      }
    });
    const newMods = res.value?.mods || [];
    folders.value = res.value?.folders || [];
    // Keep existing extraInfo to avoid UI flickering
    newMods.forEach((newMod) => {
      const oldMod = mods.value.find(
        (m) => m.file === newMod.file || (m.hash && m.hash === newMod.hash)
      );
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

const {
  deferredTasks,
  addDeferredTask,
  removeDeferredTask,
  executeDeferredTask,
  executeAllDeferredTasks,
  isExecuting
} = useDeferredTasks(instanceId!, daemonId!, () => loadMods());

const {
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
} = useModSearch(instanceId!, daemonId!, () => mods.value, addDeferredTask, loadMods);

const handleDownload = async (version: any) => {
  const result = await onDownload(version);
  if (result) {
    checkAndConfirm(result.type, result.name, result.data, result.immediateFn);
  }
};

const FileEditorDialog = ref<InstanceType<typeof FileEditor>>();

const activeKey = ref("1");

const modSearchQuery = ref("");
const pluginSearchQuery = ref("");

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
        daemonId: daemonId!,
        uuid: instanceId!,
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

const localMods = computed(() => mods.value.filter((m) => m.type === "mod"));
const localPlugins = computed(() => mods.value.filter((m) => m.type === "plugin"));

const filteredMods = computed(() => {
  if (!modSearchQuery.value) return localMods.value;
  const q = modSearchQuery.value.toLowerCase();
  return localMods.value.filter(
    (m) => m.name?.toLowerCase().includes(q) || m.file?.toLowerCase().includes(q)
  );
});

const filteredPlugins = computed(() => {
  if (!pluginSearchQuery.value) return localPlugins.value;
  const q = pluginSearchQuery.value.toLowerCase();
  return localPlugins.value.filter(
    (m) => m.name?.toLowerCase().includes(q) || m.file?.toLowerCase().includes(q)
  );
});

const headerSearchQuery = computed({
  get: () => (activeKey.value === "1" ? modSearchQuery.value : pluginSearchQuery.value),
  set: (val) => {
    if (activeKey.value === "1") modSearchQuery.value = val;
    else if (activeKey.value === "2") pluginSearchQuery.value = val;
  }
});

const checkAndConfirm = (type: string, name: string, data: any, immediateFn: () => Promise<void>) => {
  if (isWindows.value && isRunning.value) {
    const modal = Modal.confirm({
      title: t("TXT_CODE_MOD_WIN_FILE_LOCK_TITLE"),
      icon: createVNode(ExclamationCircleOutlined),
      content: t("TXT_CODE_MOD_WIN_FILE_LOCK_DESC"),
      footer: createVNode("div", { style: "text-align: right; margin-top: 20px;" }, [
        createVNode(Button, { onClick: () => modal.destroy() }, t("TXT_CODE_a0451c97")),
        createVNode(
          Button,
          {
            danger: true,
            style: "margin-left: 8px",
            onClick: () => {
              immediateFn();
              modal.destroy();
            }
          },
          t("TXT_CODE_MOD_TRY_IMMEDIATELY")
        ),
        createVNode(
          Button,
          {
            type: "primary",
            style: "margin-left: 8px",
            onClick: () => {
              addDeferredTask(type, name, data);
              modal.destroy();
            }
          },
          t("TXT_CODE_MOD_ADD_TO_QUEUE")
        )
      ])
    });
  } else {
    immediateFn();
  }
};

const onToggle = async (record: any) => {
  const toggleData = {
    uuid: instanceId!,
    daemonId: daemonId!,
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
    uuid: instanceId!,
    daemonId: daemonId!,
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

let task: NodeJS.Timer | undefined;

onMounted(() => {
  loadMods();
  loadMcVersions();
  task = setInterval(async () => {
    await getFileStatus();
    // Fallback: if server is stopped and there are tasks, execute them
    if (!isRunning.value && deferredTasks.value.length > 0 && !isExecuting.value) {
      executeAllDeferredTasks();
    }
  }, 2000);
});

onUnmounted(() => {
  if (task) clearInterval(task);
});

watch(
  () => isRunning.value,
  (newVal) => {
    if (!newVal && deferredTasks.value.length > 0) {
      // Wait a bit to ensure the process has completely exited and released file locks
      setTimeout(() => {
        if (!isRunning.value && deferredTasks.value.length > 0) {
          executeAllDeferredTasks();
        }
      }, 1000);
    }
  }
);

watch(
  () => folders.value,
  (newFolders) => {
    const hasMods = newFolders.includes("mods");
    const hasPlugins = newFolders.includes("plugins");
    if (activeKey.value === "1" && !hasMods) {
      activeKey.value = hasPlugins ? "2" : "3";
    } else if (activeKey.value === "2" && !hasPlugins) {
      activeKey.value = hasMods ? "1" : "3";
    }
  },
  { immediate: true }
);

watch(
  () => fileStatus.value?.downloadTasks,
  (newTasks, oldTasks) => {
    if (newTasks && oldTasks) {
      for (const task of newTasks) {
        const oldTask = oldTasks.find((t) => t.path === task.path);
        if (task.status === 1 && (!oldTask || oldTask.status === 0)) {
          message.success(t("TXT_CODE_7f0c746d"));
          loadMods();
        }
      }
    }
  },
  { deep: true }
);

watch(
  () => fileStatus.value?.downloadFileFromURLTask,
  (newVal, oldVal) => {
    if (oldVal && oldVal > 0 && newVal === 0) {
      loadMods();
    }
  }
);

const columns = computed(() => {
  const base = [
    {
      title: "",
      key: "icon",
      width: 60
    },
    {
      title: t("TXT_CODE_NAME"),
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a.name.localeCompare(b.name)
    },
    {
      title: t("TXT_CODE_VERSION"),
      dataIndex: "version",
      key: "version"
    },
    {
      title: t("TXT_CODE_TYPE"),
      dataIndex: "type",
      key: "type"
    },
    {
      title: t("TXT_CODE_STATUS"),
      dataIndex: "enabled",
      key: "enabled",
      sorter: (a: any, b: any) => Number(b.enabled) - Number(a.enabled)
    },
    {
      title: t("TXT_CODE_OPERATE"),
      key: "action",
      align: "right",
      width: isPhone.value ? 120 : 220
    }
  ];

  if (isPhone.value) {
    return base.filter((c) => ["icon", "name", "action"].includes(c.key!));
  }
  return base;
});

const searchColumns = computed(() => {
  const base = [
    { title: "", key: "icon", width: 60 },
    { title: "名称", key: "name" },
    { title: "最新版本", key: "version", width: 150 },
    { title: "类型", key: "type", width: 100 },
    { title: "来源", key: "source", width: 120 },
    { title: "操作", key: "action", align: "right", width: isPhone.value ? 80 : 180 }
  ];

  if (isPhone.value) {
    return base.filter((c) => ["icon", "name", "action"].includes(c.key!));
  }
  return base;
});

const openExternal = (record: any) => {
  let url = "";
  if (record.source === "Modrinth") {
    url = `https://modrinth.com/${record.project_type}/${record.slug || record.id}`;
  } else if (record.source === "SpigotMC") {
    url = `https://www.spigotmc.org/resources/${record.id}`;
  } else {
    const type = record.project_type === "plugin" ? "bukkit-plugins" : "mc-mods";
    url = `https://www.curseforge.com/minecraft/${type}/${record.slug || record.id}`;
  }
  window.open(url, "_blank");
};
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 16]" :style="{ marginTop: !isPhone ? '-96px' : '0px' }">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
            <a-typography-title v-if="!isPhone" class="mb-0" :level="4">
              {{ t("TXT_CODE_MOD_MANAGER") }}
            </a-typography-title>
            <div v-else style="width: 40px"></div>
          </template>
          <template #center>
            <div class="search-input" v-if="activeKey === '1' || activeKey === '2'">
              <a-input
                v-model:value="headerSearchQuery"
                :placeholder="t('TXT_CODE_SEARCH_PLACEHOLDER')"
                allow-clear
                :style="isPhone ? 'width: 180px' : 'width: 300px'"
              >
                <template #suffix>
                  <search-outlined />
                </template>
              </a-input>
            </div>
          </template>
          <template #right>
            <a-button
              v-if="activeKey !== '3'"
              type="primary"
              @click="loadMods"
              :loading="loading"
            >
              {{ t("TXT_CODE_REFRESH") }}
            </a-button>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <CardPanel class="containerWrapper" style="height: 100%" :padding="false">
          <template #body>
            <div :class="isPhone ? 'p-2' : 'p-4'">
              <a-alert
                v-if="isWindows && isRunning"
                type="warning"
                show-icon
                class="mb-4 mt-2 mod-manager-alert"
              >
                <template #message>
                  <div class="text-left">
                    <div class="font-bold">{{ t("TXT_CODE_MOD_WIN_FILE_LOCK_TITLE") }}</div>
                    <div class="text-xs opacity-80 font-normal mt-1">
                      {{ t("TXT_CODE_MOD_WIN_RUNNING_ALERT") }}
                    </div>
                  </div>
                </template>
              </a-alert>

              <a-tabs v-model:activeKey="activeKey" class="mod-manager-tabs">
              <a-tab-pane key="1" v-if="folders.includes('mods')">
                <template #tab>
                  <a-space :size="4">
                    {{ t("TXT_CODE_MOD_LIST") }}
                    <a-badge
                      v-if="!loading"
                      :count="localMods.length"
                      :overflow-count="99999"
                      :number-style="{
                        backgroundColor: '#f0f0f0',
                        color: '#555',
                        boxShadow: 'none'
                      }"
                      size="small"
                    />
                    <loading-outlined v-if="loading || loadingExtra" style="font-size: 12px; color: #1890ff" />
                  </a-space>
                </template>
                <div :class="isPhone ? 'p-2' : 'p-10'">
                  <a-table
                    :loading="loading"
                    :dataSource="filteredMods"
                    :columns="columns"
                    rowKey="file"
                    class="mb-6"
                    :size="isPhone ? 'small' : 'middle'"
                  >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'icon'">
                  <a-avatar
                    v-if="record.extraInfo?.project?.icon_url"
                    :src="record.extraInfo.project.icon_url"
                    shape="square"
                  />
                  <a-avatar v-else shape="square">
                    {{ record.name.charAt(0).toUpperCase() }}
                  </a-avatar>
                </template>
                <template v-if="column.key === 'name'">
                  <div>
                    <div class="font-bold text-[15px]">{{ record.name }}</div>
                    <div
                      class="text-xs opacity-60"
                      v-if="record.extraInfo?.project?.description"
                    >
                      {{ record.extraInfo.project.description }}
                    </div>
                  </div>
                </template>
                <template v-if="column.key === 'enabled'">
                  <a-tag :color="record.enabled ? 'green' : 'red'">
                    {{ record.enabled ? t("TXT_CODE_ENABLED") : t("TXT_CODE_DISABLED") }}
                  </a-tag>
                </template>
                <template v-if="column.key === 'type'">
                  <a-tag color="blue">{{ record.type }}</a-tag>
                </template>
                <template v-if="column.key === 'action'">
                  <div class="flex justify-end">
                    <template v-if="isPhone">
                      <a-dropdown :trigger="['click']">
                        <a-button size="small">
                          {{ t("TXT_CODE_OPERATE") }}
                          <down-outlined />
                        </a-button>
                        <template #overlay>
                          <a-menu>
                            <a-menu-item @click="onToggle(record)">
                              <template #icon>
                                <pause-circle-outlined v-if="record.enabled" />
                                <play-circle-outlined v-else />
                              </template>
                              {{ record.enabled ? t("TXT_CODE_DISABLE") : t("TXT_CODE_ENABLE") }}
                            </a-menu-item>
                            <a-menu-item danger @click="onDelete(record)">
                              <template #icon><delete-outlined /></template>
                              {{ t("TXT_CODE_6f2c1806") }}
                            </a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </template>
                    <a-space v-else :size="12">
                      <a-tooltip :title="t('TXT_CODE_CONFIG')">
                        <a-button
                          type="text"
                          size="small"
                          @click="openConfig(record)"
                          class="opacity-60 hover:opacity-100"
                        >
                          <template #icon><setting-outlined style="font-size: 16px" /></template>
                        </a-button>
                      </a-tooltip>
                      <a-tooltip :title="record.enabled ? t('TXT_CODE_DISABLE') : t('TXT_CODE_ENABLE')">
                        <a-button
                          type="text"
                          size="small"
                          @click="onToggle(record)"
                          class="opacity-60 hover:opacity-100"
                        >
                          <template #icon>
                            <pause-circle-outlined v-if="record.enabled" style="font-size: 16px" />
                            <play-circle-outlined v-else style="font-size: 16px" />
                          </template>
                        </a-button>
                      </a-tooltip>
                      <a-popconfirm
                        :title="t('TXT_CODE_71155575')"
                        @confirm="onDelete(record)"
                        ok-text="Yes"
                        cancel-text="No"
                      >
                        <a-tooltip :title="t('TXT_CODE_6f2c1806')">
                          <a-button type="link" size="small" danger>
                            <template #icon><delete-outlined style="font-size: 16px" /></template>
                          </a-button>
                        </a-tooltip>
                      </a-popconfirm>
                    </a-space>
                  </div>
                </template>
              </template>
            </a-table>
            </div>
          </a-tab-pane>

          <a-tab-pane key="2" v-if="folders.includes('plugins')">
            <template #tab>
              <a-space :size="4">
                {{ t("TXT_CODE_PLUGIN_LIST") }}
                <a-badge
                  v-if="!loading"
                  :count="localPlugins.length"
                  :overflow-count="99999"
                  :number-style="{
                    backgroundColor: '#f0f0f0',
                    color: '#555',
                    boxShadow: 'none'
                  }"
                  size="small"
                />
                <loading-outlined v-if="loading || loadingExtra" style="font-size: 12px; color: #1890ff" />
              </a-space>
            </template>
            <div :class="isPhone ? 'p-2' : 'p-10'">
              <a-table
                :loading="loading"
                :dataSource="filteredPlugins"
                :columns="columns"
                rowKey="file"
                :size="isPhone ? 'small' : 'middle'"
              >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'icon'">
                  <a-avatar
                    v-if="record.extraInfo?.project?.icon_url"
                    :src="record.extraInfo.project.icon_url"
                    shape="square"
                  />
                  <a-avatar v-else shape="square">
                    {{ record.name.charAt(0).toUpperCase() }}
                  </a-avatar>
                </template>
                <template v-if="column.key === 'name'">
                  <div>
                    <div class="font-bold text-[15px]">{{ record.name }}</div>
                    <div
                      class="text-xs opacity-60"
                      v-if="record.extraInfo?.project?.description"
                    >
                      {{ record.extraInfo.project.description }}
                    </div>
                  </div>
                </template>
                <template v-if="column.key === 'enabled'">
                  <a-tag :color="record.enabled ? 'green' : 'red'">
                    {{ record.enabled ? t("TXT_CODE_ENABLED") : t("TXT_CODE_DISABLED") }}
                  </a-tag>
                </template>
                <template v-if="column.key === 'type'">
                  <a-tag color="blue">{{ record.type }}</a-tag>
                </template>
                <template v-if="column.key === 'action'">
                  <div class="flex justify-end">
                    <template v-if="isPhone">
                      <a-dropdown :trigger="['click']">
                        <a-button size="small">
                          {{ t("TXT_CODE_OPERATE") }}
                          <down-outlined />
                        </a-button>
                        <template #overlay>
                          <a-menu>
                            <a-menu-item @click="onToggle(record)">
                              <template #icon>
                                <pause-circle-outlined v-if="record.enabled" />
                                <play-circle-outlined v-else />
                              </template>
                              {{ record.enabled ? t("TXT_CODE_DISABLE") : t("TXT_CODE_ENABLE") }}
                            </a-menu-item>
                            <a-menu-item danger @click="onDelete(record)">
                              <template #icon><delete-outlined /></template>
                              {{ t("TXT_CODE_6f2c1806") }}
                            </a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </template>
                    <a-space v-else :size="12">
                      <a-tooltip :title="t('TXT_CODE_CONFIG')">
                        <a-button
                          type="text"
                          size="small"
                          @click="openConfig(record)"
                          class="opacity-60 hover:opacity-100"
                        >
                          <template #icon><setting-outlined style="font-size: 16px" /></template>
                        </a-button>
                      </a-tooltip>
                      <a-tooltip :title="record.enabled ? t('TXT_CODE_DISABLE') : t('TXT_CODE_ENABLE')">
                        <a-button
                          type="text"
                          size="small"
                          @click="onToggle(record)"
                          class="opacity-60 hover:opacity-100"
                        >
                          <template #icon>
                            <pause-circle-outlined v-if="record.enabled" style="font-size: 16px" />
                            <play-circle-outlined v-else style="font-size: 16px" />
                          </template>
                        </a-button>
                      </a-tooltip>
                      <a-popconfirm
                        :title="t('TXT_CODE_71155575')"
                        @confirm="onDelete(record)"
                        ok-text="Yes"
                        cancel-text="No"
                      >
                        <a-tooltip :title="t('TXT_CODE_6f2c1806')">
                          <a-button type="link" size="small" danger>
                            <template #icon><delete-outlined style="font-size: 16px" /></template>
                          </a-button>
                        </a-tooltip>
                      </a-popconfirm>
                    </a-space>
                  </div>
                </template>
              </template>
            </a-table>
            </div>
          </a-tab-pane>

          <a-tab-pane key="3" :tab="t('TXT_CODE_DOWNLOAD')">
            <div :class="isPhone ? 'p-2' : 'p-10'">
              <CardPanel class="mb-4" :padding="true">
                <template #title>{{ t("TXT_CODE_SEARCH_MOD_PLUGIN") }}</template>
                <template #body>
                  <a-form layout="horizontal" :model="searchFilters" class="search-form">
                    <a-row :gutter="isPhone ? [8, 8] : [24, 0]">
                      <a-col :span="isPhone ? 24 : 12">
                        <a-form-item :label="t('TXT_CODE_NAME')">
                          <a-input v-model:value="searchFilters.query" :placeholder="t('TXT_CODE_SEARCH_PLACEHOLDER')" @pressEnter="onSearch(1)" />
                        </a-form-item>
                      </a-col>
                      <a-col :span="isPhone ? 24 : 12">
                        <a-form-item :label="t('TXT_CODE_SOURCE')">
                          <a-select v-model:value="searchFilters.source">
                            <a-select-option value="all">{{ t("TXT_CODE_ALL") }}</a-select-option>
                            <a-select-option value="modrinth">Modrinth</a-select-option>
                            <a-select-option value="curseforge">CurseForge</a-select-option>
                            <a-select-option value="spigotmc">SpigotMC</a-select-option>
                          </a-select>
                        </a-form-item>
                      </a-col>
                      <a-col :span="isPhone ? 24 : 12">
                        <a-form-item :label="t('TXT_CODE_VERSION')">
                          <a-select
                            v-model:value="searchFilters.version"
                            show-search
                            allow-clear
                            :placeholder="t('TXT_CODE_VERSION')"
                          >
                            <a-select-option value="">{{ t("TXT_CODE_ALL") }}</a-select-option>
                            <a-select-option v-for="v in mcVersions" :key="v" :value="v">{{
                              v
                            }}</a-select-option>
                          </a-select>
                        </a-form-item>
                      </a-col>
                      <a-col :span="isPhone ? 24 : 12">
                        <a-form-item :label="t('TXT_CODE_TYPE')">
                          <a-select v-model:value="searchFilters.type">
                            <a-select-option value="all">{{ t("TXT_CODE_ALL") }}</a-select-option>
                            <a-select-option value="mod">{{ t("TXT_CODE_MOD") }}</a-select-option>
                            <a-select-option value="plugin">{{ t("TXT_CODE_PLUGIN") }}</a-select-option>
                          </a-select>
                        </a-form-item>
                      </a-col>
                      <a-col :span="isPhone ? 24 : 12">
                        <a-form-item :label="t('TXT_CODE_ENVIRONMENT')">
                          <a-select v-model:value="searchFilters.environment">
                            <a-select-option value="all">{{ t("TXT_CODE_ALL") }}</a-select-option>
                            <a-select-option value="server">{{ t("TXT_CODE_SERVER") }}</a-select-option>
                            <a-select-option value="client">{{ t("TXT_CODE_CLIENT") }}</a-select-option>
                          </a-select>
                        </a-form-item>
                      </a-col>
                      <a-col :span="isPhone ? 24 : 12">
                        <a-form-item :label="t('TXT_CODE_LOADER_PLATFORM')">
                          <a-select
                            v-model:value="searchFilters.loader"
                            show-search
                            allow-clear
                            :options="loaderOptions"
                            option-filter-prop="label"
                            style="width: 100%"
                            :placeholder="t('TXT_CODE_SELECT_LOADER')"
                          >
                          </a-select>
                        </a-form-item>
                      </a-col>
                    </a-row>
                    <div class="flex gap-4 justify-start mt-2">
                      <a-button type="primary" @click="onSearch(1)" :loading="searchLoading">
                        <template #icon><search-outlined /></template>
                        {{ t("TXT_CODE_SEARCH") }}
                      </a-button>
                      <a-button @click="resetSearch">{{ t("TXT_CODE_880fedf7") }}</a-button>
                    </div>
                  </a-form>
                </template>
              </CardPanel>

              <div class="search-results-container w-full">
                <div v-if="searchLoading" class="py-32 text-center">
                  <a-spin size="large" />
                </div>
                <div v-else-if="!searched" class="py-32 text-center text-gray-400">
                  <div class="mb-4"><search-outlined style="font-size: 64px; opacity: 0.1" /></div>
                  <div class="text-lg opacity-60">{{ t("TXT_CODE_SEARCH_TIP") }}</div>
                </div>
                <div v-else-if="searchResults.length === 0" class="py-32 text-center text-gray-400">
                  <div class="mb-4"><cloud-download-outlined style="font-size: 64px; opacity: 0.1" /></div>
                  <div class="text-lg opacity-60">{{ t("TXT_CODE_NO_SEARCH_RESULT") }}</div>
                </div>
                <div v-else class="search-results-table">
                  <a-table
                    :loading="searchLoading"
                    :dataSource="searchResults"
                    :columns="searchColumns"
                    :pagination="false"
                    rowKey="id"
                    size="middle"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'icon'">
                        <a-avatar :src="record.icon_url" shape="square" :size="40" class="rounded-md" />
                      </template>
                      <template v-if="column.key === 'name'">
                        <div class="flex flex-col">
                          <span class="font-bold text-[15px] text-gray-800 dark:text-gray-200">{{ record.title }}</span>
                          <span class="text-xs opacity-60 line-clamp-1" :title="record.description">{{ record.description }}</span>
                        </div>
                      </template>
                      <template v-if="column.key === 'version'">
                        <div class="flex flex-col gap-1">
                          <div class="font-bold text-sm text-blue-600 dark:text-blue-400">
                            {{ record.version_number || t("TXT_CODE_UNKNOWN_VERSION") }}
                          </div>
                          <span class="text-[10px] text-gray-400">{{
                            formatDate(record.updated)
                          }}</span>
                        </div>
                      </template>
                      <template v-if="column.key === 'type'">
                        <a-tag color="blue" class="border-none rounded-md">{{ record.project_type }}</a-tag>
                      </template>
                      <template v-if="column.key === 'source'">
                        <a-tag
                          :color="
                            record.source === 'CurseForge'
                              ? 'orange'
                              : record.source === 'SpigotMC'
                              ? 'yellow'
                              : 'green'
                          "
                          class="border-none rounded-md"
                        >
                          {{ record.source }}
                        </a-tag>
                      </template>
                      <template v-if="column.key === 'action'">
                        <div class="flex justify-end">
                          <a-space>
                            <a-button
                              type="primary"
                              size="small"
                              @click="showVersions(record)"
                            >
                              {{ mods.some((m) => m.extraInfo?.project?.id === record.id) ? t("TXT_CODE_16853efe").replace(t("TXT_CODE_16853efe").slice(2), "") : t("TXT_CODE_DOWNLOAD") }}
                            </a-button>
                            <a-button size="small" @click="openExternal(record)">
                              {{ t("TXT_CODE_f1b166e7") }}
                            </a-button>
                          </a-space>
                        </div>
                      </template>
                    </template>
                  </a-table>
                </div>

                <div class="my-6 flex justify-end" v-if="searchTotal > searchLimit">
                  <a-pagination
                    v-model:current="searchPage"
                    v-model:page-size="searchLimit"
                    :total="searchTotal"
                    show-size-changer
                    show-less-items
                    @change="onSearch"
                    @showSizeChange="onSearch(1)"
                  />
                </div>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>

        <ModVersionModal
          v-model:visible="showVersionModal"
          :selected-mod="selectedMod"
          :versions="versions"
          :versions-loading="versionsLoading"
          :search-filters="searchFilters"
          :mods="mods"
          @download="handleDownload"
        />

        <ModConfigModal
          v-model:visible="showConfigModal"
          :current-mod="currentMod"
          :config-files="configFiles"
          :config-loading="configLoading"
          @edit="editFile"
        />

        <FileEditor ref="FileEditorDialog" :daemon-id="daemonId!" :instance-id="instanceId!" />
      </div>
    </template>
  </CardPanel>
      </a-col>
    </a-row>

    <ModFloatingTools
      v-model:deferred-tasks="deferredTasks"
      :file-status="fileStatus"
      :is-executing="isExecuting"
      @execute-task="executeDeferredTask"
      @execute-all="executeAllDeferredTasks"
      @remove-task="removeDeferredTask"
    />
  </div>
</template>

<style scoped>
.download-progress-card {
  border: none;
  background: transparent;
}

.download-progress-card :deep(.ant-card-body) {
  padding: 0;
}

.containerWrapper {
  overflow: hidden;
}

.mod-manager-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
  padding: 0 20px;
}

@media (max-width: 585px) {
  :deep(.menus-item-center) {
    width: auto !important;
    flex: 1 !important;
    justify-content: center !important;
  }
  :deep(.menus-item-left),
  :deep(.menus-item-right) {
    display: flex !important;
    flex: 0 0 auto !important;
  }
}

.search-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.mod-manager-alert {
  padding: 10px 18px !important;
}

.mod-manager-alert :deep(.ant-alert-content) {
  text-align: left !important;
}

.search-form :deep(.ant-input),
.search-form :deep(.ant-select-selection-item),
.search-form :deep(.ant-select-selection-placeholder) {
  text-align: left !important;
}

.search-form :deep(.ant-form-item-label) {
  text-align: left;
}

.search-results-table :deep(.ant-table) {
  background: transparent;
}

.search-results-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
}

.app-dark-theme .search-results-table :deep(.ant-table-thead > tr > th) {
  background: #1d1d1d;
  border-bottom: 1px solid #303030;
}

.app-dark-theme .search-results-table :deep(.ant-table-cell) {
  border-bottom: 1px solid #303030;
}
</style>

<style>
.frosted-popover .ant-popover-inner {
  background-color: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  color: #333 !important;
}

.app-dark-theme .frosted-popover .ant-popover-inner {
  background-color: rgba(31, 41, 55, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  color: #eee !important;
}

.frosted-popover .ant-popover-arrow::before {
  background: rgba(255, 255, 255, 0.7) !important;
}

.app-dark-theme .frosted-popover .ant-popover-arrow::before {
  background: rgba(31, 41, 55, 0.7) !important;
}
</style>
