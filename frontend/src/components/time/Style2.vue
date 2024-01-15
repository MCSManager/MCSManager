<script setup lang="ts">
import dayjs from "dayjs";
import { onUnmounted } from "vue";
import { onMounted } from "vue";
import { ref } from "vue";

const time = ref("");

let timer: NodeJS.Timer | null = null;

onMounted(() => {
  timer = setInterval(() => {
    time.value = dayjs().format("HHmmss");
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  timer = null;
});
</script>

<template>
  <div class="h-100 flex-center overflow-hidden">
    <div class="time">
      <div class="h">
        <div class="left" :style="{ '--n': Number(time[0]) - 1 }">
          <span>1</span>
          <span>2</span>
        </div>
        <div class="right" :style="{ '--n': Number(time[1]) }">
          <span v-for="i in 10" :key="i">{{ i - 1 }}</span>
        </div>
      </div>
      :
      <div class="m">
        <div class="left" :style="{ '--n': Number(time[2]) }">
          <span v-for="i in 7" :key="i">{{ i - 1 }}</span>
        </div>
        <div class="right" :style="{ '--n': Number(time[3]) }">
          <span v-for="i in 10" :key="i">{{ i - 1 }}</span>
        </div>
      </div>
      :
      <div class="s">
        <div class="left" :style="{ '--n': Number(time[4]) }">
          <span v-for="i in 7" :key="i">{{ i - 1 }}</span>
        </div>
        <div class="right" :style="{ '--n': Number(time[5]) }">
          <span v-for="i in 10" :key="i">{{ i - 1 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.time {
  display: flex;
  font-size: 20px;
  align-items: flex-start;

  .h,
  .m,
  .s {
    display: flex;
    margin: 0 10px;
    align-items: flex-start;

    .left,
    .right {
      margin: 0 10px;
      display: flex;
      align-items: flex-start;
      flex-direction: column;
      transition: all 0.3s;
      transform: translateY(calc(var(--n) * -22px));

      span {
        height: 22px;
      }
    }
  }
}
</style>
