<script setup lang="ts">
import { t } from "@/lang/i18n";
import { CopyOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import type { ButtonType } from "ant-design-vue/es/button";
import type { SizeType } from "ant-design-vue/es/config-provider";

const props = defineProps<{
  size?: string;
  type?: string;
  value: string;
}>();

const copy = async () => {
  if (!navigator.clipboard) return message.error(t("TXT_CODE_ca07c84c"));
  try {
    await navigator.clipboard.writeText(props.value);
    message.success(t("TXT_CODE_b858d78a"));
  } catch (error) {
    message.error(t("TXT_CODE_81b9b599") + error);
  }
};
</script>

<template>
  <a-tooltip>
    <template #title>{{ t("TXT_CODE_13ae6a93") }}</template>
    <a-button :type="<ButtonType>type" :size="<SizeType>size" @click="copy">
      <template #icon>
        <CopyOutlined />
      </template>
    </a-button>
  </a-tooltip>
</template>
