<script setup lang="ts">
import type { LayoutCard } from "@/types";

const props = defineProps<{
  card: LayoutCard;
}>();
</script>

<template>
  <CardPanel class="containerWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body> 基本信息 </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.containerWrapper {
}
</style>
