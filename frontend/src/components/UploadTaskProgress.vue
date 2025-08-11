<script setup lang="ts">
const props = defineProps<{
  progress: number;
  retries: number;
}>();
</script>

<template>
  <div
    class="flex overflow-hidden"
    :style="`width: 16px; height: 16px; border-radius: 6px; border: 1px solid #ccc; overflow: hidden; background-color: rgba(255, 0, 0, ${
      props.retries / 5
    })`"
  >
    <div
      :style="`width: 100%; height: ${
        (props.progress > 1 ? 1 : props.progress) * 100
      }%; background-color: rgba(200, 200, 200, 0.8); margin-top: auto;`"
    ></div>
  </div>
</template>

<style scoped lang="scss"></style>
