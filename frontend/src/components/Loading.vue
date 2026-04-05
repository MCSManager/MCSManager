<script setup lang="ts">
import { LoadingOutlined } from "@ant-design/icons-vue";
import { h, computed } from "vue";

const props = defineProps<{ fontSize?: number }>();

const fontSize = computed(() => {
  return props.fontSize ?? 48;
});

const indicator = h(LoadingOutlined, {
  style: {
    fontSize: `${fontSize.value}px`,
    fontWeight: "bold"
  },
  spin: true
});
</script>

<template>
  <div class="flex align-center justify-center h-100 w-100">
    <a-spin :indicator="indicator" />
  </div>
</template>

<style lang="scss" scoped></style>
