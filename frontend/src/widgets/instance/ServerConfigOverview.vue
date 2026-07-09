<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { useAppRouters } from "@/hooks/useAppRouters";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { getInstanceConfigByType, type InstanceConfigs } from "@/hooks/useInstance";
import { useScreen } from "@/hooks/useScreen";
import { t } from "@/lang/i18n";
import { getConfigFileList, initializeConfigFile } from "@/services/apis/instance";
import { reportErrorMsg } from "@/tools/validator";
import type { LayoutCard } from "@/types";
import { FileExclamationOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { computed, onMounted, ref } from "vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { isPhone } = useScreen();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");
const type = getMetaOrRouteValue("type");

const { toPage } = useAppRouters();
const toConsole = () => {
  toPage({
    path: "/instances/terminal",
    query: {
      daemonId,
      instanceId
    }
  });
};

const InstanceConfigsList = ref<InstanceConfigs[]>([]);
const { execute, state: realFiles, isLoading } = getConfigFileList();
const render = async () => {
  try {
    const configFiles: InstanceConfigs[] = getInstanceConfigByType(type ?? "");
    const files: string[] = [];
    configFiles.forEach((v: InstanceConfigs) => {
      files.push(v.path);
      if (v.initializeFrom) files.push(v.initializeFrom);
    });
    await execute({
      params: {
        uuid: instanceId ?? "",
        daemonId: daemonId ?? ""
      },
      data: {
        files: files
      }
    });
    if (!realFiles.value) return reportErrorMsg(t("TXT_CODE_83e553fc"));
    realFiles.value.forEach((v) => {
      configFiles.forEach((z) => {
        if (z.path === v.file) {
          configFiles.forEach((p) => {
            if (p.path == z.path && p.check) z.conflict = true;
          });
          z.check = true;
        }
      });
    });
    const existingFiles = new Set(realFiles.value.map((file) => file.file));
    configFiles.forEach((config) => {
      config.canInitialize =
        !config.check && !!config.initializeFrom && existingFiles.has(config.initializeFrom);
    });
    InstanceConfigsList.value = configFiles;
  } catch (err: any) {
    console.error(err);
    return reportErrorMsg(err.message);
  }
};

const hasAvailableConfigs = computed(() =>
  InstanceConfigsList.value.some((config) => config.check || config.canInitialize)
);

const { execute: initialize, isLoading: isInitializing } = initializeConfigFile();
const initializeConfig = async (config: InstanceConfigs) => {
  if (!config.initializeFrom) return;
  try {
    await initialize({
      params: {
        uuid: instanceId ?? "",
        daemonId: daemonId ?? "",
        sourceFile: config.initializeFrom,
        targetFile: config.path,
        type: config.type
      }
    });
    message.success(t("TXT_CODE_palworld.initialized"));
    await render();
  } catch (err: any) {
    reportErrorMsg(err.message);
  }
};

const toEdit = (configName: string, configPath: string, extName: string) => {
  toPage({
    path: "/instances/terminal/serverConfig/fileEdit",
    query: {
      type: type,
      configName,
      configPath,
      extName
    }
  });
};

onMounted(async () => {
  await render();
});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template v-if="!isPhone" #left>
            <a-typography-title class="mb-0" :level="4">
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button @click="toConsole">
              {{ t("TXT_CODE_95b9833f") }}
            </a-button>
            <a-button :loading="isLoading" @click="render">
              {{ t("TXT_CODE_b76d94e0") }}
            </a-button>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <CardPanel style="height: 100%">
          <template #body>
            <a-list
              v-if="hasAvailableConfigs"
              item-layout="horizontal"
              :data-source="InstanceConfigsList"
              :loading="isLoading"
            >
              <template #renderItem="{ item }">
                <a-list-item v-if="item.check || item.canInitialize">
                  <a-list-item-meta>
                    <template #title>
                      <a-tag v-if="item.conflict" color="warning">
                        {{ t("TXT_CODE_1af148fe") }}
                      </a-tag>
                      <a-typography-title :level="5">{{ item.fileName }}</a-typography-title>
                    </template>
                    <template #description>
                      {{ item.info }}
                      <br />
                      <a-typography-text v-if="item.conflict" type="danger">
                        {{ t("TXT_CODE_91b3fa98") }}
                      </a-typography-text>
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a-button
                      v-if="item.check"
                      size="middle"
                      @click="toEdit(item.redirect, item.path, item.type)"
                    >
                      {{ t("TXT_CODE_ad207008") }}
                    </a-button>
                    <a-button
                      v-else
                      type="primary"
                      size="middle"
                      :loading="isInitializing"
                      @click="initializeConfig(item)"
                    >
                      {{ t("TXT_CODE_palworld.initialize") }}
                    </a-button>
                  </template>
                </a-list-item>
              </template>
            </a-list>
            <a-empty v-else class="mt-40 mb-40">
              <template #description>
                <p style="font-size: 16px; margin-top: 40px">
                  <FileExclamationOutlined class="mr-4" />{{ t("TXT_CODE_37a4c14a") }}
                </p>
                <p style="font-size: 14px; margin-bottom: 10px">
                  {{ t("TXT_CODE_4c0fda9") }}
                </p>
              </template>
            </a-empty>
          </template>
        </CardPanel>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped></style>
