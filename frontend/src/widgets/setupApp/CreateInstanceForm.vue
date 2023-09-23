<script setup lang="ts">
import type { QUICKSTART_ACTION_TYPE, QUICKSTART_METHOD } from "@/hooks/widgets/quickStartFlow";

defineProps<{
  appType: string;
  createMethod: string;
}>();
</script>

<template>
  <div>各种表单实现</div>
</template>

<style lang="scss" scoped>
.CardWrapper {
  min-height: 500px;
}
.btn-area {
  position: absolute;
  bottom: 16px;
  right: 16px;
}
</style>
