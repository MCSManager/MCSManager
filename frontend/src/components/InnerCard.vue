<script setup lang="ts"></script>

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
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.inner-card-wrapper {
  border: 1px solid var(--color-gray-2);
  background-color: var(--color-gray-2);
  padding: 12px;
  cursor: pointer;
  transition: all 0.4s;
  border-radius: 4px;
}

.inner-card-wrapper:hover {
  border: 1px solid var(--color-gray-8);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
}
</style>
