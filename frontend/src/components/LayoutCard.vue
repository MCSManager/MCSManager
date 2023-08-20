<script setup lang="ts">
import type { LayoutCard } from "@/types/index";
import { LAYOUT_CARD_TYPES } from "@/config/index";

const props = defineProps<{
  card: LayoutCard;
}>();

const componentMap: { [key: string]: any } = LAYOUT_CARD_TYPES;
</script>

<template>
  <div
    :id="'layout-card-container-' + card.id"
    class="layout-card-container transition-all-6 global-drag-animation"
  >
    <component
      style="height: 100%"
      :card="props.card"
      :is="componentMap[card.type]"
    ></component>
  </div>
</template>

<style lang="scss" scoped>
.layout-card-container {
  width: 100%;
  height: 100%;
}
</style>
