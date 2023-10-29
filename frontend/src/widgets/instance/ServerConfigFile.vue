<script setup lang="ts">
import { ref, onMounted } from "vue";
import { t } from "@/lang/i18n";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types";
import { useScreen } from "@/hooks/useScreen";
import { getConfigFile } from "@/services/apis/instance";
import { message } from "ant-design-vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { getInstanceConfigByType, type InstanceConfigs } from "@/hooks/useInstance";
import { useAppRouters } from "@/hooks/useAppRouters";

import eulaTxt from "@/components/mc_process_config/eula.txt.vue";

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

const component: any = {
  // "common/server.properties": serverProperties,
  "common/eula.txt": eulaTxt
  // "bukkit/spigot.yml": spigotYml,
  // "bukkit/bukkit.yml": bukkitYml,
  // "bungeecord/config.yml": configYml,
  // "bds/server.properties": bdsServerProperties,
  // "mohist/mohist.yml": mohistYml,
  // "paper/paper.yml": paperYml,
  // "paper/paper-global.yml": paperGlobalYml,
  // "paper/paper-world-defaults.yml": paperWorldDefaultsYml,
  // "geyser/config.yml": geyserYml,
  // "mcdr/config.yml": mcdrConfigYml,
  // "mcdr/permission.yml": permissionYml,
  // "velocity/velocity.toml": velocityToml
};
const isFailure = ref(false);
const config = ref();
const { toPage } = useAppRouters();
const toConfigOverview = () => {
  toPage({
    path: "/instances/terminal/serverConfig",
    query: {
      type
    }
  });
};

const { execute, state, isLoading } = getConfigFile();
const render = async () => {
  try {
    await execute({
      params: {
        uuid: instanceId ?? "",
        remote_uuid: daemonId ?? "",
        fileName: configPath ?? "",
        type: extName ?? ""
      }
    });
    if (state.value) {
      config.value = state.value;
    }
  } catch (err: any) {
    console.error(err);
    isFailure.value = true;
    return message.error(err.message);
  }
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
            <a-button type="primary" class="mr-8">
              {{ t("保存文件") }}
            </a-button>
            <a-button v-if="!isPhone" :loading="isLoading" class="mr-8" @click="render">
              {{ t("重新加载") }}
            </a-button>
            <a-button v-if="!isPhone" type="dashed">
              {{ t("编辑源文件") }}
            </a-button>
            <a-dropdown v-if="isPhone">
              <template #overlay>
                <a-menu>
                  <a-menu-item key="2">
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

      <component :is="component[configName ?? '']" v-if="!isFailure" :config="config" />

      <a-col v-else :span="24">
        <a-result
          status="error"
          :title="t('错误')"
          :sub-title="'文件不存在或权限不正确，无法查看此文件的具体配置，您也许可以尝试到 “文件管理”功能在线编辑此文件，或尝试重启实例刷新此文件。'"
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
