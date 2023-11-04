<script setup lang="ts">
import { t } from "@/lang/i18n";
import LineOption from "@/components/LineOption.vue";
import { getDescriptionByTitle } from "@/tools/common";
import { jsonToMap } from "@/tools/common";

import { configData } from "@/components/mc_process_config/data";

const props = defineProps<{
  config: Record<string, any>;
  configName: string;
}>();

const data:
  | {
      desc: string;
      config: Record<string, any>;
    }
  | undefined = configData[props.configName];

const description = data?.config || {};

const parsedConfig = jsonToMap(props.config);
</script>

<template>
  <a-col :span="24">
    <CardPanel style="height: 100%">
      <template #body>
        <a-typography>
          <a-typography-title :level="5">
            {{ data ? t("关于配置文件") : t("未知配置文件") }}
          </a-typography-title>
          <a-typography-paragraph v-if="data">
            {{ data?.desc }}
          </a-typography-paragraph>
          <a-typography-paragraph v-else>
            {{ t("我们将很快支持该文件，敬请期待") }}
            <br />
            {{ t("您可前往") }}
            <a href="https://github.com/MCSManager/MCSManager" target="_blank">
              https://github.com/MCSManager/MCSManager
            </a>
            {{ t("提交反馈") }}
          </a-typography-paragraph>
        </a-typography>
      </template>
    </CardPanel>
  </a-col>
  <a-col v-if="data" :span="24">
    <CardPanel style="height: 100%">
      <template #body>
        <div v-for="(item, index) in parsedConfig" :key="index">
          <LineOption :option-value="parsedConfig" :option-key="index">
            <template #title>{{ index }}</template>
            <template #info>{{ getDescriptionByTitle(description, index) }}</template>
          </LineOption>
        </div>
      </template>
    </CardPanel>
  </a-col>
</template>
