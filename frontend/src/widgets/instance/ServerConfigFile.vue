<script setup lang="ts">
import { ref, onMounted } from "vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { useScreen } from "@/hooks/useScreen";
import { getConfigFile, updateConfigFile } from "@/services/apis/instance";
import { message } from "ant-design-vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useAppRouters } from "@/hooks/useAppRouters";
import { toUnicode } from "@/tools/common";
import Loading from "@/components/Loading.vue";

// import eulaTxt from "@/components/mc_process_config/eula.txt.vue";
// import serverProperties from "@/components/mc_process_config/server.properties.vue";
// import bukkitYml from "@/components/mc_process_config/bukkit.yml.vue";
// import bungeecordConfigYml from "@/components/mc_process_config/bungeecord.config.yml.vue";
// import bdsServerProperties from "@/components/mc_process_config/bds_server.properties.vue";

import configComponent from "@/components/mc_process_config/default.vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { isPhone } = useScreen();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");
const configName = getMetaOrRouteValue("configName");
const configPath = getMetaOrRouteValue("configPath");
const extName = getMetaOrRouteValue("extName");
const type = getMetaOrRouteValue("type");

// const component: { [key: string]: Component } = {
//   "common/server.properties": serverProperties,
//   "common/eula.txt": eulaTxt,
//   // "bukkit/spigot.yml": spigotYml,
//   "bukkit/bukkit.yml": bukkitYml,
//   "bungeecord/config.yml": bungeecordConfigYml,
//   "bds/server.properties": bdsServerProperties
//   // "mohist/mohist.yml": mohistYml,
//   // "paper/paper.yml": paperYml,
//   // "paper/paper-global.yml": paperGlobalYml,
//   // "paper/paper-world-defaults.yml": paperWorldDefaultsYml,
//   // "geyser/config.yml": geyserYml,
//   // "mcdr/config.yml": mcdrConfigYml,
//   // "mcdr/permission.yml": permissionYml,
//   // "velocity/velocity.toml": velocityToml
// };

const isFailure = ref(false);
const { toPage } = useAppRouters();
const toConfigOverview = () => {
  toPage({
    path: "/instances/terminal/serverConfig",
    query: {
      type
    }
  });
};

const {
  execute: reqConfigFile,
  state: configFile,
  isLoading: getConfigFileLoading,
  isReady
} = getConfigFile();
const render = async () => {
  try {
    await reqConfigFile({
      params: {
        uuid: instanceId ?? "",
        remote_uuid: daemonId ?? "",
        fileName: configPath ?? "",
        type: extName ?? ""
      }
    });
  } catch (err: any) {
    console.error(err);
    isFailure.value = true;
    return message.error(err.message);
  }
};

const {
  execute: execUpdateConfigFile,
  state: isOK,
  isLoading: updateConfigFileLoading
} = updateConfigFile();
const save = async () => {
  const config_ = { ...configFile.value };
  if (configPath == "server.properties" && type && type.startsWith("minecraft/java")) {
    for (const key in configFile) {
      const value = config_[key];
      if (value && typeof value == "string") {
        config_[key] = toUnicode(value);
      }
    }
  }
  try {
    await execUpdateConfigFile({
      params: {
        uuid: instanceId ?? "",
        remote_uuid: daemonId ?? "",
        fileName: configPath ?? "",
        type: extName ?? ""
      },
      data: config_
    });
    if (isOK.value) {
      message.success(t("保存成功"));
    }
  } catch (err: any) {
    console.error(err);
    return message.error(err.message);
  }
};

const refresh = async () => {
  await render();
  message.success(t("刷新成功"));
};

onMounted(async () => {
  await render();
});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col v-if="!isFailure" :span="24">
        <BetweenMenus>
          <template #left>
            <a-button class="mr-8" @click="toConfigOverview">
              {{ t("返回配置文件列表") }}
            </a-button>
          </template>
          <template #right>
            <a-button type="primary" :loading="updateConfigFileLoading" class="mr-8" @click="save">
              {{ t("保存文件") }}
            </a-button>
            <a-button v-if="!isPhone" :loading="getConfigFileLoading" class="mr-8" @click="refresh">
              {{ t("重新加载") }}
            </a-button>
            <a-button v-if="!isPhone" type="dashed">
              {{ t("编辑源文件") }}
            </a-button>
            <a-dropdown v-if="isPhone">
              <template #overlay>
                <a-menu>
                  <a-menu-item key="2" @click="refresh">
                    {{ t("重新加载") }}
                  </a-menu-item>
                  <a-menu-item key="3">
                    {{ t("编辑源文件") }}
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button type="primary">
                {{ t("更多操作") }}
                <DownOutlined />
              </a-button>
            </a-dropdown>
          </template>
        </BetweenMenus>
      </a-col>

      <!-- <component :is="component[configName]" v-if="configName && isReady" :config="configFile" /> -->

      <configComponent
        v-if="configName && isReady"
        :config="configFile"
        :config-name="configName"
      />

      <a-col v-else :span="24">
        <Loading v-if="!isFailure" />
      </a-col>
      <a-col v-if="isFailure" :span="24">
        <a-result
          status="error"
          :title="t('暂不支持编辑此文件')"
          :sub-title="t('可能是由于文件为空或权限不足。可尝试使用 “文件管理” 对本文件进行编辑。')"
        >
          <template #extra>
            <a-button type="primary" @click="toConfigOverview">
              {{ t("回到配置文件列表") }}
            </a-button>
          </template>
        </a-result>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped></style>
