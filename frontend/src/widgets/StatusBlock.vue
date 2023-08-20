<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";

const props = defineProps<{
  card: LayoutCard;
}>();

const { title } = props.card.meta ?? {};

const value = "10/11";
</script>

<template>
  <CardPanel class="StatusBlock" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <a-typography-text class="color-info">
        {{ title }}
      </a-typography-text>

      <div class="value">{{ value }}</div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.StatusBlock {
  .value {
    font-weight: 800;
    font-size: 36px;
    margin-top: 4px;
  }
}
</style>
