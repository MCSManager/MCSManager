<script lang="ts" setup>
defineProps<{
  description?: string;
}>();
</script>
<template>
  <a-empty>
    <template #description>
      <span class="color-info">{{ description }}</span>
    </template>
    <!-- <a-button type="primary">Create Now</a-button> -->
  </a-empty>
</template>
