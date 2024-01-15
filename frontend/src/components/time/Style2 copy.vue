<script setup lang="ts">
defineProps<{
  time: string;
  date: string;
}>();
</script>

<template>
  <div class="h-100 flex-center">
    <div class="time">
      <div class="h">
        <div class="left">
          <span v-for="i in 10" :key="i">{{ i - 1 }}</span>
        </div>
        <div class="right">
          <span v-for="i in 10" :key="i">{{ i - 1 }}</span>
        </div>
      </div>
      :
      <div class="m">
        <div class="left">
          <span v-for="i in 10" :key="i">{{ i - 1 }}</span>
        </div>
        <div class="right">
          <span v-for="i in 10" :key="i">{{ i - 1 }}</span>
        </div>
      </div>
      :
      <div class="s">
        <div class="left">
          <span v-for="i in 10" :key="i">{{ i - 1 }}</span>
        </div>
        <div class="right">
          <span v-for="i in 10" :key="i">{{ i - 1 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.value {
  font-weight: bolder;
}
@keyframes time {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-100%);
  }
}

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
    }
  }
}

.time {
  .h {
    .left {
      animation: time 60 * 60 * 60s linear infinite;
    }
    .right {
      animation: time 60 * 60 * 10s linear infinite;
    }
  }
  .m {
    .left {
      animation: time 60 * 60s linear infinite;
    }
    .right {
      animation: time 60 * 10s linear infinite;
    }
  }
  .s {
    .left {
      animation: time 60s linear infinite;
    }
    .right {
      animation: time 10s linear infinite;
    }
  }
}
</style>
