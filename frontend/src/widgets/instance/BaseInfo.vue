<script setup lang="ts">
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { LayoutCard } from "@/types";
const { state } = useAppStateStore();
const props = defineProps<{
  card: LayoutCard;
}>();

const userInfo = state.userInfo;
</script>

<template>
  <CardPanel class="containerWrapper" style="height: 100%">
    <template #title>
      {{ card.title }}
    </template>
    <template #body>
      <div>基本信息</div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
// .containerWrapper {
// }
</style>
