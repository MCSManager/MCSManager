<script lang="ts" setup>
import type { TagInfo } from "./interface";

defineProps<{
  tags: TagInfo[];
  gap?: string;
}>();
</script>

<template>
  <div
    class="container"
    :style="{
      gap: gap || '6px'
    }"
  >
    <a-tag v-for="tag in tags" :key="tag.label" style="margin: 0" :color="tag.color" class="tag">
      <span>
        <component :is="tag.icon" v-if="tag.icon"></component>
      </span>
      <span>{{ tag.label }}</span>
      <span>{{ tag.value }}</span>
    </a-tag>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  align-items: center;
}
.tag {
  align-items: center;
  display: flex;
  gap: 4px;
}

.tag:hover {
  box-shadow: 0 2px 4px 0 var(--card-shadow-color);
  border: 1px solid var(--color-blue-5);
}
</style>
