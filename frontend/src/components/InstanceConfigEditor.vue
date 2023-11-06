<script setup lang="ts">
import { t } from "@/lang/i18n";
import LineOption from "@/components/LineOption.vue";
import { getDescriptionByTitle } from "@/tools/common";
import { jsonToMap } from "@/tools/common";
import isEmpty from "lodash/isEmpty";
import { configData } from "@/config/instanceConfigMap";

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

const parsedConfig = jsonToMap(props.config);
</script>

<template>
  <a-col :span="24">
    <CardPanel style="height: 100%">
      <template #body>
        <a-typography>
          <a-typography-title :level="5">
            {{ data ? t("关于此配置文件") : t("未知配置文件") }}
          </a-typography-title>
          <a-typography-paragraph v-if="data">
            {{ data?.desc }}
          </a-typography-paragraph>
          <a-typography-paragraph v-else>
            {{ t("此配置文件暂不支持直接配置，请前往文件管理进行编辑。") }}
          </a-typography-paragraph>
        </a-typography>
      </template>
    </CardPanel>
  </a-col>
  <a-col v-if="data" :span="24">
    <CardPanel style="height: 100%">
      <template #body>
        <div v-if="!isEmpty(props.config)">
          <div v-for="(item, index) in parsedConfig" :key="index">
            <LineOption :option-value="parsedConfig" :option-key="index">
              <template #title>{{ index }}</template>
              <template #info>{{ getDescriptionByTitle(data?.config, index) }}</template>
            </LineOption>
          </div>
        </div>
        <div v-else>
          {{ t("配置文件内容为空，请检查文件是否正确，或点击上方 “编辑源文件” 按钮继续编辑。") }}
        </div>
      </template>
    </CardPanel>
  </a-col>
</template>
