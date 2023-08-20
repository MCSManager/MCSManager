<script setup lang="ts">
import DataStatistic from "@/components/DataStatistic.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";

const props = defineProps<{
  card: LayoutCard;
}>();

const overviewList = [
  {
    title: t("计算机型号"),
    value: "6666",
  },
  {
    title: t("计算机型号"),
    value: "6666",
  },
  {
    title: t("计算机型号"),
    value: "6666",
  },
  {
    title: t("计算机型号"),
    value: "6666oasihdiah23oi1u28921938y1298312983h2189h",
  },
  {
    title: t("计算机型号"),
    value: "6666oasihdiah23oi1u28921938y1298312983h2189h",
  },
  {
    title: t("计算机型号"),
    value: "6666oasihdiah23oi1u28921938y1298312983h2189h",
  },
  {
    title: t("计算机型号"),
    value: "6666",
  },
  {
    title: t("计算机型号"),
    value: "6666",
  },
  {
    title: t("计算机型号"),
    value: "6666",
  },
  {
    title: t("计算机型号"),
    value: "6666",
  },
];
</script>

<template>
  <div style="height: 100%">
    <CardPanel style="height: 100%">
      <template #title>{{ card.title }}</template>
      <template #body>
        <a-row :gutter="[24, 24]">
          <a-col
            :span="12"
            :md="12"
            :lg="6"
            v-for="item in overviewList"
            :key="item.value"
          >
            <DataStatistic :title="item.title" :value="item.value">
            </DataStatistic>
          </a-col>
        </a-row>
      </template>
    </CardPanel>
  </div>
</template>

<style lang="scss" scoped></style>
