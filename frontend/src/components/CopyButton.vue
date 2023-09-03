<script setup lang="ts">
import { t } from "@/lang/i18n";
import { CopyOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

const props = defineProps<{
  size?: string;
  type?: string;
  value: string;
}>();

const copy = async () => {
  if (!navigator.clipboard) return message.error(t("您当前的浏览器不支持 Clipboard API"));
  try {
    await navigator.clipboard.writeText(props.value);
    message.success(t("复制成功"));
  } catch (error) {
    message.error(t("复制失败：") + error);
  }
};
</script>

<template>
  <a-tooltip>
    <template #title>{{ t("复制") }}</template>
    <a-button :type="type" :size="size" @click="copy">
      <template #icon>
        <CopyOutlined />
      </template>
    </a-button>
  </a-tooltip>
</template>
