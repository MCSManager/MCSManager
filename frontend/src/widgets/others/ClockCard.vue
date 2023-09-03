<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types";
import { onMounted, onUnmounted, ref } from "vue";

// eslint-disable-next-line no-unused-vars
const props = defineProps<{
  card: LayoutCard;
}>();

const time = ref(new Date().toTimeString().substring(0, 8));

let timer: NodeJS.Timer | null;

onMounted(() => {
  timer = setInterval(() => {
    time.value = new Date().toTimeString().substring(0, 8);
  }, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

</script>

<template>
  <div class="h-100">
    <CardPanel>
      <template #title>{{ card.title }}</template>
      <template #body>
        <div class="h-100 items-center flex">
          <div
            class="value ml-auto mr-auto mb-8"
          >
            {{ time }}
          </div>
        </div>
      </template>
    </CardPanel>
  </div>
</template>

<style lang="scss" scoped>
.value {
  font-weight: bolder;
  font-size: 36px;
}
</style>