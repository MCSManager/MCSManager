<script setup lang="ts">
import type { LayoutCard } from "@/types";
import { useOverviewChart } from "../hooks/useOverviewChart";
import { getRandomId } from "@/tools/randId";
import { watch } from "vue";
import { useOverviewInfo } from "@/hooks/useOverviewInfo";
import type { JsonData } from "../types/index";

defineProps<{
  card: LayoutCard;
}>();

const domId = getRandomId();
const { state } = useOverviewInfo();

const chart = useOverviewChart(domId);

watch(state, () => {
  const source = state.value?.chart.request;
  if (!source || !chart) return;
  const MAX_TIME = source.length - 1;
  for (const key in source) {
    const v = source[key] as JsonData;
    v.time = `${MAX_TIME - Number(key) * 1}s`;
  }
  const max = Math.max(...source.map((v) => v.value));
  chart.setOption({
    yAxis: {
      max
    },
    dataset: {
      dimensions: ["time", "value"],
      source
    }
  });
});
</script>

<template>
  <CardPanel class="CardWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <div :id="domId" :style="{ width: '100%', height: card.height }"></div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped></style>
