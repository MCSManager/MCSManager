<script setup lang="ts">
import type { FunctionalComponent } from "vue";

defineProps<{
  title: string;
  textStyle?: any;
  icon?: FunctionalComponent;
  isActive?: boolean;
}>();
</script>

<template>
  <div :class="{ btn: true, isActive: isActive }">
    <component :is="icon" v-if="icon"></component>
    <a-typography-text class="text ml-6" :style="textStyle">
      {{ title }}
    </a-typography-text>
  </div>
</template>

<style lang="scss" scoped>
.isActive {
  background-color: rgba(168, 168, 168, 0.143);
  color: var(--color-blue-5) !important;
}
.btn {
  display: flex;
  text-align: center;
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0px 12px;
  min-width: 40px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.6s;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;

  .text {
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-gray-9);
  }

  &:hover {
    // background-color: var(--color-gray-5);
    background-color: rgba(168, 168, 168, 0.208);
  }
}
</style>
