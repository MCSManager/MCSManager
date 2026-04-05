<script setup lang="ts">
import type { LayoutCard } from "@/types";
import IframeBox from "@/components/IframeBox/index.vue";
import { getProPanelUrl } from "@/components/IframeBox/config";
defineProps<{
  card: LayoutCard;
}>();
</script>

<template>
  <CardPanel class="card-wrapper h-100 w-100" :style="{ maxHeight: card.height }">
    <template #body>
      <IframeBox :src="getProPanelUrl('/shop')" :height="card.height" />
    </template>
  </CardPanel>
</template>

<style lang="less" scoped>
.shop-item-container {
  overflow-y: auto;
  text-align: left;
  color: var(--color-gray-13);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.card-wrapper {
  pre {
    white-space: pre-wrap;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif,
      "Apple Color Emoji",
      "Segoe UI Emoji",
      Segoe UI Symbol,
      "Noto Color Emoji";
    background: unset !important;
    border: unset !important;

    padding: 0 !important;
  }
}

.shelves-card-container {
  width: 100%;
  margin-bottom: 20px;
}

.shelves-card-item-title {
  margin-bottom: 12px;
}

.shelves-card-item-price {
  display: flex;
  justify-content: flex-end;
  font-size: 14px;
  text-align: right;

  .shelves-card-item-price-label {
    opacity: 0.6;
    font-size: 12px;
    text-align: right;
    margin-bottom: 4px;
  }
}

.price-text {
  color: var(--color-red-6);
  font-size: 20px;
}
</style>
