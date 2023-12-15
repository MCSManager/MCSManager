<script setup lang="ts">
import type { FunctionalComponent } from "vue";

const props = defineProps<{
  icon?: FunctionalComponent;
}>();
</script>

<template>
  <div class="inner-card-wrapper">
    <div class="inner-card-container">
      <a-typography-text strong>
        <slot name="title"></slot>
      </a-typography-text>
      <div class="mt-10">
        <a-typography-text>
          <slot name="body"></slot>
        </a-typography-text>

        <div v-if="props.icon" class="bg-icon">
          <component :is="props.icon"></component>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bg-icon {
  position: absolute;
  right: 12px;
  font-size: 40px;
  bottom: 10px;
  color: var(--color-gray-12);
  opacity: 0.04;
}
.inner-card-wrapper {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-gray-3);
  background-color: var(--color-gray-2);
  padding: 12px;
  cursor: pointer;
  transition: all 0.4s;
  border-radius: 6px;
}

.inner-card-wrapper:hover {
  border: 1px solid var(--color-gray-8);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
}
</style>
