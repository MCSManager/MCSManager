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
            {{ data ? t("TXT_CODE_958fd70c") : t("TXT_CODE_2ce953da") }}
          </a-typography-title>
          <a-typography-paragraph v-if="data">
            {{ data?.desc }}
          </a-typography-paragraph>
          <a-typography-paragraph v-else>
            {{ t("TXT_CODE_75e5af9b") }}
          </a-typography-paragraph>
        </a-typography>
      </template>
    </CardPanel>
  </a-col>
  <a-col v-if="data" :span="24">
    <CardPanel style="height: 100%">
      <template #body>
        <div v-if="!isEmpty(props.config)">
          <div v-for="(item, index) in parsedConfig" :key="index" class="p-1">
            <LineOption :option-value="parsedConfig" :option-key="index">
              <template #title>{{ index }}</template>
              <template #info>{{ getDescriptionByTitle(data?.config, index) }}</template>
            </LineOption>
          </div>
        </div>
        <div v-else>
          {{ t("TXT_CODE_1a730d48") }}
        </div>
      </template>
    </CardPanel>
  </a-col>
</template>
