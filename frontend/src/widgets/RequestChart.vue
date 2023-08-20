<script setup lang="ts">
import type { LayoutCard } from "@/types";

const props = defineProps<{
  card: LayoutCard;
}>();
</script>

<template>
  <CardPanel class="CardWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body> TEST </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.CardWrapper {
}
</style>
