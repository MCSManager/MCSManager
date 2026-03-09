<script lang="ts" setup>
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "../types/index";

defineProps<{
  card: LayoutCard;
}>();
</script>

<template>
  <CardPanel>
    <template #title>{{ card.title }}</template>
    <template #body>
      <div class="flex justify-center align-center h-100">
        <a-typography-paragraph style="max-width: 320px; margin: auto; text-align: center">
          <ExclamationCircleOutlined />
          {{ t("TXT_CODE_5ec10cc8") }}
        </a-typography-paragraph>
      </div>
    </template>
  </CardPanel>
</template>
