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
@keyframes icon-sway {
  0%,
  100% {
    transform: translateX(0) rotate(0deg);
  }
  25% {
    transform: translateX(-4px) rotate(-3deg);
  }
  75% {
    transform: translateX(4px) rotate(3deg);
  }
}

.bg-icon {
  position: absolute;
  right: 12px;
  font-size: 40px;
  bottom: 10px;
  color: var(--color-gray-12);
  opacity: 0.04;
  transition: transform 0.25s ease-out;
}

.inner-card-wrapper {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-gray-3);
  background-color: var(--color-gray-2);
  padding: 12px;
  cursor: pointer;
  transition:
    background 0.35s ease,
    border-color 0.35s ease,
    box-shadow 0.35s ease;
  border-radius: 6px;
}

.inner-card-wrapper:hover {
  border-color: var(--color-gray-8);
  background: var(--inner-card-hover-bg);
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.12);
}

.inner-card-wrapper:hover .bg-icon {
  animation: icon-sway 0.34s ease-in-out;
}
</style>
