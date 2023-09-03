<script setup lang="ts">
import { getRandomId } from "@/tools/randId";
import { useOverviewChart, useSimpleChart } from "../hooks/useOverviewChart";
import { watch, unref, onMounted } from "vue";
import { t } from "@/lang/i18n";

const props = defineProps<{
  cpuData: number[];
  memData: number[];
}>();

const chartCpuDomId = `${getRandomId()}-cpu-chart`;
const chartMemDomId = `${getRandomId()}-mem-chart`;

const chartCpu = useSimpleChart(chartCpuDomId);
const chartMem = useSimpleChart(chartMemDomId);

onMounted(() => {
  refreshChart();
});

const refreshChart = () => {
  chartCpu.setOption({
    dataset: {
      dimensions: ["time", "value"],
      source: props.cpuData.map((v, index) => {
        return {
          value: v,
          time: index
        };
      })
    }
  });

  chartMem.setOption({
    dataset: {
      dimensions: ["time", "value"],
      source: props.memData.map((v, index) => {
        return {
          value: v,
          time: index
        };
      })
    }
  });
};

watch(props, () => {
  refreshChart();
});
</script>

<template>
  <div style="width: 100%">
    <a-row :gutter="[24, 24]">
      <a-col :span="12">
        <div>
          {{ t("CPU 使用率（10min）") }}
        </div>
        <div :id="chartCpuDomId" style="width: 100%; height: 50px"></div>
      </a-col>
      <a-col :span="12">
        <div>
          {{ t("内存使用率（10min）") }}
        </div>
        <div :id="chartMemDomId" style="width: 100%; height: 50px"></div>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped></style>
