<script setup lang="ts">
import type { FunctionalComponent } from "vue";

defineProps<{
  title: string;
  textStyle?: any;
  icon?: FunctionalComponent;
}>();
</script>

<template>
  <div class="btn">
    <component v-if="icon" :is="icon"></component>
    <a-typography-text class="text ml-6" :style="textStyle">
      {{ title }}
    </a-typography-text>
  </div>
</template>

<style lang="scss" scoped>
.btn {
  display: flex;
  text-align: center;
  padding: 8px 12px;
  min-width: 40px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.6s;

  .text {
    color: var(--color-gray-9) !important;
  }

  &:hover {
    // background-color: var(--color-gray-5);
    background-color: rgba(168, 168, 168, 0.208);
  }
}
</style>
