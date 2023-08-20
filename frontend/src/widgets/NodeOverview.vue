<script setup lang="ts">
import type { LayoutCard } from "@/types";

const props = defineProps<{
  card: LayoutCard;
}>();
</script>

<template>
  <CardPanel class="NodeOverview" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body> A </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.NodeOverview {
  .value {
    font-weight: 800;
    font-size: 36px;
    margin-top: 4px;
  }
}
</style>
