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
const sizeTime = ref(`font-size: 60px;`);
const sizeDate = ref(`font-size: 10px;`);

let timer: NodeJS.Timer | null;

onMounted(() => {
  timer = setInterval(() => {
    time.value = getTime();
  }, 1000);
  sizeTime.value = (`font-size: ${(<HTMLDivElement>getCurrentInstance()?.refs.boxTime).offsetHeight * .6}px;`);
  sizeDate.value = (`font-size: ${(<HTMLDivElement>getCurrentInstance()?.refs.boxTime).offsetHeight * .1}px;`);
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
        <div ref="boxTime" class="h-100 items-center flex flex-wrap">
          <div class="value ml-auto mr-auto mb-2" :style="sizeTime">
            {{ time }}
          </div>
          <div ref="boxDate" class="ml-auto" :style="sizeDate">
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
