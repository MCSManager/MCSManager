<script setup lang="ts">
import dayjs from "dayjs";
import { onUnmounted } from "vue";
import { onMounted } from "vue";
import { ref } from "vue";

defineProps<{
  date: string;
}>();

const time = ref("");
const st = ref(0);

let timer: NodeJS.Timer | null = null;

onMounted(() => {
  timer = setInterval(() => {
    time.value = dayjs().format("HHmmss");
    st.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  timer = null;
});
</script>

<template>
  <div class="time-wrapper h-100 flex-center overflow-hidden">
    <div class="time mb-40">
      <div class="time-container">
        <div class="h">
          <div class="left" :style="{ '--n': Number(time[0]) }">
            <span>0</span>
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
            <span v-for="i in 7" :key="i" class="second-item">{{ i - 1 }}</span>
          </div>
          <div class="right" :style="{ '--n': Number(time[5]) }">
            <span v-for="i in 10" :key="i" class="second-item">{{ i - 1 }}</span>
          </div>
        </div>
      </div>

      <div class="flex-center mt-12 date">
        <div>
          <div class="flex-center">
            <span>Timestamp: {{ st }}</span>
          </div>
          <div class="flex-center">
            {{ date }}
          </div>
        </div>
      </div>
    </div>
  </div>
  <div>{{ date }}</div>
</template>

<style lang="less" scoped>
.time-wrapper {
  --size: 60px;

  .time {
    .date {
      font-size: 12px;
      opacity: 0.76;
    }
    .time-container {
      height: var(--size);
      overflow: hidden;
      display: flex;
      font-size: var(--size);
      align-items: flex-start;

      .h,
      .m,
      .s {
        font-weight: 600;
        display: flex;
        margin: 0 6px;
        align-items: flex-start;

        .left,
        .right {
          display: flex;
          align-items: flex-start;
          flex-direction: column;
          transition: all 0.8s;
          transform: translateY(calc(var(--n) * -60px));
          span {
            height: var(--size);
          }
        }
      }
      .second-item {
        opacity: 0.8;
      }
    }
  }
}
</style>
