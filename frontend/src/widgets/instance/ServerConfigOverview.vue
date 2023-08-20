<script setup lang="ts">
import type { LayoutCard } from "@/types";

const props = defineProps<{
  card: LayoutCard;
}>();
</script>

<template>
  <CardPanel class="ServerConfigOverview" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body> ServerConfigOverview </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.ServerConfigOverview {
}
</style>
