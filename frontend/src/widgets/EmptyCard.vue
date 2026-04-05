<script setup lang="ts"></script>

<template>
  <div class="empty-card-container"></div>
</template>

<style lang="less" scoped>
.empty-card-container {
  width: 100%;
  height: 100%;
}
</style>

<style lang="less">
.is-order-mode[data-card-type="EmptyCard"] {
  .layout-card-container {
    border: 1px dashed var(--gray-border-color);
    background-color: var(--color-gray-3);
    border-radius: 6px;
    height: 100%;
  }
}
</style>
