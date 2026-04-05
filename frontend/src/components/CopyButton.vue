<script setup lang="ts">
import { t } from "@/lang/i18n";
import { CopyOutlined } from "@ant-design/icons-vue";
import type { ButtonType } from "ant-design-vue/es/button";
import type { SizeType } from "ant-design-vue/es/config-provider";
import { toCopy } from "@/tools/copy";

const props = defineProps<{
  size?: string;
  type?: string;
  value: string;
}>();
</script>

<template>
  <a-tooltip>
    <template #title>{{ t("TXT_CODE_13ae6a93") }}</template>
    <a-button :type="<ButtonType>type" :size="<SizeType>size" @click="toCopy(props.value)">
      <template #icon>
        <CopyOutlined />
      </template>
    </a-button>
  </a-tooltip>
</template>
