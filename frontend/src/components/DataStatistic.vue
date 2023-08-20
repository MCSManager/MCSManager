<script setup lang="ts">
defineProps<{
  title: string;
  value: string;
}>();
</script>

<template>
  <div class="container">
    <div class="title">
      {{ title }}
    </div>
    <div class="content">
      {{ value }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  .title {
    color: var(--color-gary-4);
    font-size: var(--font-body);
    margin-bottom: 8px;
  }
  .content {
    color: var(--color-gary-6);
    font-size: var(--font-h5);
  }
}
</style>
