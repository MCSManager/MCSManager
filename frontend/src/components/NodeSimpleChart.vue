<script setup lang="ts">
import { getRandomId } from "@/tools/randId";
import { useSimpleChart } from "../hooks/useOverviewChart";
import { watch, onMounted } from "vue";
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
          {{ t("TXT_CODE_eca8f1b3") }}
        </div>
        <div :id="chartCpuDomId" style="width: 100%; height: 50px"></div>
      </a-col>
      <a-col :span="12">
        <div>
          {{ t("TXT_CODE_6ca6667f") }}
        </div>
        <div :id="chartMemDomId" style="width: 100%; height: 50px"></div>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped></style>
