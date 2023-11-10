<script setup lang="ts">
import type { LayoutCard } from "@/types/index";
import { LAYOUT_CARD_TYPES } from "@/config/index";
import { onErrorCaptured, ref } from "vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const componentMap: { [key: string]: any } = LAYOUT_CARD_TYPES;

const loadError = ref(false);
const cardError = ref<Error>(new Error(""));

onErrorCaptured((error: Error) => {
  console.error(`Card: ${props.card.id}-${props.card.type}-${props.card.title} Error:`, error);
  loadError.value = true;
  cardError.value = error;
  return false;
});
</script>

<template>
  <div
    :id="'layout-card-container-' + card.id"
    class="layout-card-container transition-all-6 global-drag-animation"
  >
    <component
      :is="componentMap[card.type]"
      v-if="!loadError"
      style="height: 100%"
      :card="props.card"
    ></component>

    <CardError v-else :error="cardError" :title="card.title"></CardError>
  </div>
</template>

<style lang="scss" scoped>
.layout-card-container {
  width: 100%;
  height: 100%;
}
</style>
