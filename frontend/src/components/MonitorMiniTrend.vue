<script setup lang="ts">
import { useOverviewChart } from "@/hooks/useOverviewChart";
import { getRandomId } from "@/tools/randId";
import { computed, onMounted, watch } from "vue";

const props = defineProps<{
  title: string;
  currentText: string;
  max?: number;
  data: Array<{
    label: string;
    value: number;
  }>;
}>();

const domId = `${getRandomId()}-monitor-trend`;
const chart = useOverviewChart(domId);

const source = computed(() =>
  props.data.map((item) => ({
    time: item.label,
    value: item.value
  }))
);

const refreshChart = () => {
  chart.setOption({
    yAxis: {
      max: props.max
    },
    dataset: {
      dimensions: ["time", "value"],
      source: source.value
    }
  });
};

onMounted(() => {
  refreshChart();
});

watch(source, () => {
  refreshChart();
});
</script>

<template>
  <div class="monitor-mini-trend">
    <div class="monitor-mini-trend__header">
      <span class="monitor-mini-trend__title">{{ title }}</span>
      <span class="monitor-mini-trend__value">{{ currentText }}</span>
    </div>
    <div :id="domId" class="monitor-mini-trend__chart"></div>
  </div>
</template>

<style scoped lang="scss">
.monitor-mini-trend {
  width: 100%;
}

.monitor-mini-trend__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.monitor-mini-trend__title {
  font-size: 13px;
}

.monitor-mini-trend__value {
  font-size: 12px;
  color: var(--color-gray-7);
}

.monitor-mini-trend__chart {
  width: 100%;
  height: 180px;
  margin-top: 12px;
}
</style>
