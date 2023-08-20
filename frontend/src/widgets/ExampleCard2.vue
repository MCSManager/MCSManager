<script setup lang="ts">
import type { LayoutCard } from "@/types";
import { onUnmounted } from "vue";
import { onMounted } from "vue";
import { ref } from "vue";
import CardPanel from "@/components/CardPanel.vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const test = ref(0);
let task: any = null;

onMounted(() => {
  task = setInterval(() => {
    test.value++;
  }, 200);
});

onUnmounted(() => {
  clearInterval(task);
});
</script>

<template>
  <div style="height: 100%">
    <CardPanel style="height: 100%">
      <template #title>{{ card.title }}</template>
      <template #body> 测试消息状态值：{{ test }} </template>
    </CardPanel>
  </div>
</template>
