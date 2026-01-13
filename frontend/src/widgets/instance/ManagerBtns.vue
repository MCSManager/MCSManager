<script setup lang="ts">
import InnerCard from "@/components/InnerCard.vue";
import ResponsiveLayoutGroup from "@/components/ResponsiveLayoutGroup.vue";
import { useAppRouters } from "@/hooks/useAppRouters";
import {
  TYPE_MINECRAFT_JAVA,
  TYPE_STEAM_SERVER_UNIVERSAL,
  useInstanceInfo
} from "@/hooks/useInstance";
import { useServerConfig } from "@/hooks/useServerConfig";
import { t } from "@/lang/i18n";
import { modListApi } from "@/services/apis/modManager";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { LayoutCard } from "@/types";
import {
  AppstoreAddOutlined,
  ArrowRightOutlined,
  BuildOutlined,
  CodeOutlined,
  ControlOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
  FolderOpenOutlined,
  UsbOutlined,
  UsergroupDeleteOutlined
} from "@ant-design/icons-vue";

import { computed, ref, watch } from "vue";
import type { RouteLocationPathRaw } from "vue-router";
import { useLayoutCardTools } from "../../hooks/useCardTools";
import { arrayFilter } from "../../tools/array";
import EventConfig from "./dialogs/EventConfig.vue";
import InstanceDetail from "./dialogs/InstanceDetail.vue";
import InstanceFundamentalDetail from "./dialogs/InstanceFundamentalDetail.vue";
import JavaManager from "./dialogs/JavaManager.vue";
import McPingSettings from "./dialogs/McPingSettings.vue";
import PingConfig from "./dialogs/PingConfig.vue";
import RconSettings from "./dialogs/RconSettings.vue";
import TermConfig from "./dialogs/TermConfig.vue";

const terminalConfigDialog = ref<InstanceType<typeof TermConfig>>();
const rconSettingsDialog = ref<InstanceType<typeof RconSettings>>();
const mcSettingsDialog = ref<InstanceType<typeof McPingSettings>>();
const javaManagerDialog = ref<InstanceType<typeof JavaManager>>();
const eventConfigDialog = ref<InstanceType<typeof EventConfig>>();
const pingConfigDialog = ref<InstanceType<typeof PingConfig>>();
const instanceDetailsDialog = ref<InstanceType<typeof InstanceDetail>>();
const instanceFundamentalDetailDialog = ref<InstanceType<typeof InstanceFundamentalDetail>>();

const { toPage: toOtherPager } = useAppRouters();

const props = defineProps<{
  card: LayoutCard;
}>();

const { isAdmin, state } = useAppStateStore();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);

const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const { instanceInfo, execute, isGlobalTerminal } = useInstanceInfo({
  instanceId,
  daemonId,
  autoRefresh: true
});

const { serverConfigFiles, refresh: refreshServerConfig } = useServerConfig();

const folders = ref<string[]>([]);
const foldersLoaded = ref(false);

const loadFolders = async () => {
  if (!instanceId || !daemonId) return;
  try {
    const { execute } = modListApi();
    const res = await execute({
      params: {
        uuid: instanceId,
        daemonId: daemonId
      }
    });
    folders.value = res.value?.folders || [];
  } catch (err) {
    console.error("Failed to load folders:", err);
  } finally {
    foldersLoaded.value = true;
  }
};

watch(
  () => [instanceId, daemonId],
  () => {
    loadFolders();
  },
  { immediate: true }
);

const toPage = (params: RouteLocationPathRaw) => {
  if (!params.query) params.query = {};
  params.query = {
    ...params.query,
    instanceId,
    daemonId
  };
  toOtherPager(params);
};

const refreshInstanceInfo = async () => {
  await execute({
    params: {
      uuid: instanceId ?? "",
      daemonId: daemonId ?? ""
    },
    forceRequest: true
  });
};

const btns = computed(() => {
  if (!instanceInfo.value) return [];
  return arrayFilter([
    {
      title: t("TXT_CODE_d07742fe"),
      icon: ControlOutlined,
      condition: () => {
        return (
          !isGlobalTerminal.value &&
          !!serverConfigFiles.value &&
          serverConfigFiles.value?.length > 0
        );
      },
      click: (): void => {
        toPage({
          path: "/instances/terminal/serverConfig",
          query: {
            type: instanceInfo.value?.config.type
          }
        });
      }
    },
    {
      title: t("TXT_CODE_ae533703"),
      icon: FolderOpenOutlined,
      click: () => {
        toPage({ path: "/instances/terminal/files" });
      },
      condition: () => state.settings.canFileManager || isAdmin.value
    },
    {
      title: t("TXT_CODE_MOD_MANAGER"),
      icon: UsbOutlined,
      click: () => {
        toPage({ path: "/instances/terminal/mods" });
      },
      condition: () => {
        const type = instanceInfo.value?.config.type || "";
        // Narrow it down to Minecraft server types only (Java or Bedrock)
        const isMC = type.startsWith("minecraft/java") || type.startsWith("minecraft/bedrock");
        if (!isMC) return false;
        const hasPermission = state.settings.canFileManager || isAdmin.value;
        if (!hasPermission) return false;
        if (!foldersLoaded.value) return false;
        return folders.value && folders.value.length > 0;
      }
    },

    {
      title: t("TXT_CODE_3fee13ed"),
      icon: BuildOutlined,
      click: () => {
        javaManagerDialog.value?.openDialog();
      },
      condition: () => instanceInfo.value?.config.type.includes(TYPE_MINECRAFT_JAVA) ?? false
    },
    {
      title: t("TXT_CODE_656a85d8"),
      icon: BuildOutlined,
      click: () => {
        rconSettingsDialog.value?.openDialog();
      },
      condition: () =>
        instanceInfo.value?.config.type.includes(TYPE_STEAM_SERVER_UNIVERSAL) ?? false
    },

    {
      title: t("TXT_CODE_b7d026f8"),
      icon: FieldTimeOutlined,
      condition: () => !isGlobalTerminal.value,
      click: () => {
        toPage({
          path: "/instances/schedule",
          query: {
            instanceId,
            daemonId
          }
        });
      }
    },
    {
      title: t("TXT_CODE_d341127b"),
      icon: DashboardOutlined,
      click: () => {
        eventConfigDialog.value?.openDialog();
      }
    },
    {
      title: t("TXT_CODE_d23631cb"),
      icon: CodeOutlined,
      click: () => {
        terminalConfigDialog.value?.openDialog();
      }
    },
    {
      title: t("TXT_CODE_4f34fc28"),
      icon: AppstoreAddOutlined,
      condition: () => isAdmin.value,
      click: () => {
        instanceDetailsDialog.value?.openDialog();
      }
    },
    {
      title: t("TXT_CODE_40241d8e"),
      icon: UsergroupDeleteOutlined,
      click: () => {
        mcSettingsDialog.value?.openDialog();
      },
      condition: () => instanceInfo.value?.config.type.includes(TYPE_MINECRAFT_JAVA) ?? false
    },
    {
      title: t("TXT_CODE_4f34fc28"),
      icon: AppstoreAddOutlined,
      condition: () =>
        !isAdmin.value &&
        instanceInfo.value?.config.processType === "docker" &&
        state.settings.allowChangeCmd,
      click: () => {
        instanceFundamentalDetailDialog.value?.openDialog();
      }
    }
  ]);
});

watch(instanceInfo, (cfg, oldCfg) => {
  if (cfg?.config?.type && instanceId && daemonId && cfg.config.type !== oldCfg?.config?.type) {
    refreshServerConfig(cfg.config.type, instanceId, daemonId);
  }
});
</script>

<template>
  <CardPanel class="containerWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <ResponsiveLayoutGroup class="function-btns-container" :items="btns">
        <template #default="{ item }">
          <InnerCard :style="{ height: '90px' }" :icon="item.icon" @click="item.click">
            <template #title>
              {{ item.title }}
            </template>
            <template #body>
              <a href="javascript:void(0);">
                <span>
                  {{ t("TXT_CODE_6c5985ca") }}
                  <ArrowRightOutlined style="font-size: 12px" />
                </span>
              </a>
            </template>
          </InnerCard>
        </template>
      </ResponsiveLayoutGroup>
    </template>
  </CardPanel>

  <TermConfig
    ref="terminalConfigDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
    @update="refreshInstanceInfo"
  />

  <EventConfig
    ref="eventConfigDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
    @update="refreshInstanceInfo"
  />

  <PingConfig
    ref="pingConfigDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
    @update="refreshInstanceInfo"
  />

  <InstanceDetail
    ref="instanceDetailsDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
    @update="refreshInstanceInfo"
  />

  <InstanceFundamentalDetail
    ref="instanceFundamentalDetailDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
    @update="refreshInstanceInfo"
  />

  <RconSettings
    ref="rconSettingsDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
    @update="refreshInstanceInfo"
  />

  <McPingSettings
    ref="mcSettingsDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
    @update="refreshInstanceInfo"
  />

  <JavaManager
    ref="javaManagerDialog"
    :instance-info="instanceInfo"
    :daemon-id="daemonId"
    :instance-id="instanceId"
    @update="refreshInstanceInfo"
  />
</template>

<style lang="scss" scoped>
.function-btns-container {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

@media (max-width: 1000px) {
  .function-btns-container {
    position: relative;
    height: auto;
    min-height: 100%;
  }
}
</style>
