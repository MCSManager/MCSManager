<script setup lang="ts">
import { ref, onMounted } from "vue";
import { t } from "@/lang/i18n";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types";
import { getConfigFileList } from "@/services/apis/instance";
import { reportErrorMsg } from "@/tools/validator";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { getInstanceConfigByType, type InstanceConfigs } from "@/hooks/useInstance";
import { useAppRouters } from "@/hooks/useAppRouters";
import { useScreen } from "@/hooks/useScreen";

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
    InstanceConfigsList.value = configFiles;
  } catch (err: any) {
    console.error(err);
    return reportErrorMsg(err.message);
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
              v-if="realFiles && realFiles.length > 0"
              item-layout="horizontal"
              :data-source="InstanceConfigsList"
              :loading="isLoading"
            >
              <template #renderItem="{ item }">
                <a-list-item v-if="item.check">
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
                    <a-button size="middle" @click="toEdit(item.redirect, item.path, item.type)">
                      {{ t("TXT_CODE_ad207008") }}
                    </a-button>
                  </template>
                </a-list-item>
              </template>
            </a-list>
            <a-empty v-else>
              <template #description>
                {{ t("TXT_CODE_432cfb62") }}
              </template>
              {{ t("TXT_CODE_70a2613b") }}
            </a-empty>
          </template>
        </CardPanel>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped></style>
