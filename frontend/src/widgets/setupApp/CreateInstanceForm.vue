<script setup lang="ts">
import type { QUICKSTART_ACTION_TYPE, QUICKSTART_METHOD } from "@/hooks/widgets/quickStartFlow";

// 这里需要根据创建的APP类型+创建方式两种来决定这个表单该如何实现
// 具体参考 MCSM 9 的创建实例界面
defineProps<{
  appType: QUICKSTART_ACTION_TYPE;
  createMethod: QUICKSTART_METHOD;
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
