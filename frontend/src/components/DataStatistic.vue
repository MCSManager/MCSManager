<script setup lang="ts">
import type { Component } from "vue";

defineProps<{
  title: string;
  value: string;
  /** Optional Ant Design Vue icon component */
  icon?: Component;
}>();
</script>

<template>
  <div class="container">
    <div class="title">
      <component :is="icon" v-if="icon" class="title-icon" />
      <span style="opacity: 0.7">{{ title }}</span>
    </div>
    <div class="content">
      {{ value }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-gary-4);
    font-size: var(--font-body);
    margin-bottom: 8px;

    .title-icon {
      font-size: 16px;
      color: var(--color-primary);
    }
  }
  .content {
    color: var(--color-gary-6);
    font-size: var(--font-h5);
  }
}
</style>
