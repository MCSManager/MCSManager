<script setup lang="ts">
import type { FunctionalComponent } from "vue";

defineProps<{
  icon: FunctionalComponent;
  title: string;
  placement?: string;
}>();
</script>

<template>
  <span class="btn">
    <a-tooltip :placement="placement ? placement : 'top'">
      <template #title>
        <span>{{ title }}</span>
      </template>
      <component :is="icon"></component>
    </a-tooltip>
  </span>
</template>

<style scoped lang="scss">
.btn {
  padding: 6px 8px;
  border: 1px solid rgb(0, 0, 0, 0);

  cursor: pointer;
  user-select: none;
  transition: all 0.4s;
  border-radius: 4px;

  &:hover {
    background-color: var(--color-gray-2);
    border: 1px solid var(--color-gray-8);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
  }
}
</style>
