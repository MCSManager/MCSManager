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
import configComponent from "@/components/InstanceConfigEditor.vue";
import { DownOutlined } from "@ant-design/icons-vue";

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
      message.success(t("TXT_CODE_a7907771"));
    }
  } catch (err: any) {
    console.error(err);
    return message.error(err.message);
  }
};

const refresh = async () => {
  await render();
  message.success(t("TXT_CODE_7863f28d"));
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
              {{ t("TXT_CODE_16ed68d") }}
            </a-button>
          </template>
          <template #right>
            <a-button type="primary" :loading="updateConfigFileLoading" class="mr-8" @click="save">
              {{ t("TXT_CODE_30a3c45d") }}
            </a-button>
            <a-button v-if="!isPhone" :loading="getConfigFileLoading" class="mr-8" @click="refresh">
              {{ t("TXT_CODE_d080f2d7") }}
            </a-button>
            <a-button v-if="!isPhone" type="dashed">
              {{ t("TXT_CODE_1f61e5a3") }}
            </a-button>
            <a-dropdown v-if="isPhone">
              <template #overlay>
                <a-menu>
                  <a-menu-item key="2" @click="refresh">
                    {{ t("TXT_CODE_d080f2d7") }}
                  </a-menu-item>
                  <a-menu-item key="3">
                    {{ t("TXT_CODE_1f61e5a3") }}
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button type="primary"> {{ t("TXT_CODE_fbf985cb") }}<DownOutlined /> </a-button>
            </a-dropdown>
          </template>
        </BetweenMenus>
      </a-col>

      <configComponent
        v-if="configName && isReady"
        :config="configFile"
        :config-name="configName"
      />

      <a-col v-else :span="24">
        <Loading v-if="!isFailure" />
      </a-col>
      <a-col v-if="isFailure" :span="24">
        <a-result status="error" :title="t('TXT_CODE_f859eac')" :sub-title="t('TXT_CODE_b8814f15')">
          <template #extra>
            <a-button type="primary" @click="toConfigOverview">
              {{ t("TXT_CODE_537cd5ad") }}
            </a-button>
          </template>
        </a-result>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped></style>
