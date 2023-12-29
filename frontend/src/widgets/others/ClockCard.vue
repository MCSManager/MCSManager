<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types";
import { getCurrentInstance, onMounted, onUnmounted, ref } from "vue";
import dayjs from "dayjs";

// eslint-disable-next-line no-unused-vars
const props = defineProps<{
  card: LayoutCard;
}>();

const getTime = () => dayjs().format("HH:mm:ss");
const getDate = () => dayjs().format("YYYY/MM/DD dddd");

const time = ref(getTime());
const date = ref(getDate());

let timer: NodeJS.Timer | null;

onMounted(() => {
  timer = setInterval(() => {
    time.value = getTime();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  timer = null;
});
</script>

<template>
  <div class="h-100">
    <CardPanel>
      <template #title>{{ card.title }}</template>
      <template #body>
        <div class="h-100 flex-center">
          <div class="value pb-40" style="font-size: 60px">
            {{ time }}
          </div>
          <div
            class="ml-auto"
            style="font-size: 10px; position: absolute; right: 40px; bottom: 20px"
          >
            {{ date }}
          </div>
        </div>
      </template>
    </CardPanel>
  </div>
</template>

<style lang="scss" scoped>
.value {
  font-weight: bolder;
}
</style>
