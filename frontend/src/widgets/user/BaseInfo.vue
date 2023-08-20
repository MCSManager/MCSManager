<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import DataStatistic from "@/components/DataStatistic.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types/index";

const props = defineProps<{
  card: LayoutCard;
}>();

const userInfoList = [
  {
    title: t("用户名"),
    value: "Master",
  },
  {
    title: t("帐号状态"),
    value: "正常",
  },
  {
    title: t("注册时间"),
    value: "1145/1/4 19:18:10",
  },
  {
    title: t("最后登录"),
    value: "2023/8/14 13:21:56",
  },
  {
    title: t("唯一标识符"),
    value: "229458f9ec6f47f4a1d46a95cd1ed171",
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
            v-for="item in userInfoList"
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
