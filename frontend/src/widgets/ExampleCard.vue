<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";

const props = defineProps<{
  card: LayoutCard;
}>();

const arr = [
  1, 2, 3, 4, 5, 6, 7, 8, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  11,
];
</script>

<template>
  <div style="height: 100%">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24" :md="6" v-for="item in arr" :key="item">
        <CardPanel style="height: 100%">
          <template #title>{{ card.title }}</template>
          <template #body>
            卡片示例 <br />
            测试信息
            <p>
              我是测试信息113sadklasndfiasbifoashiofhwoifhopiashdoias iofan
              oiqwoie rhiwoh oiwa doiaw oid owiaydhoia ocaoshd oiadh oiadhioas
              doiashd oa o123123
            </p>
            <p>我是测试信息113123123</p>
            <p>我是测试信息113123123</p>
            <p>我是测试信息113123123</p>
            <p>我是测试信息113123123</p>
          </template>
        </CardPanel>
      </a-col>
    </a-row>
  </div>
</template>
