<script setup lang="ts">
import { LinkOutlined } from "@ant-design/icons-vue";

defineProps<{
  icon?: any;
  title: string;
  click?: (...args: any) => any;
}>();
</script>

<template>
  <div class="actions-button w-100">
    <a-col :span="24">
      <div class="btn w-100 flex" @click="click">
        <div>
          <component :is="icon || LinkOutlined" />
        </div>
        <div class="ml-8">
          {{ title }}
        </div>
      </div>
    </a-col>
  </div>
</template>

<style scoped lang="scss">
.btn {
  padding: 20px 12px;
  border: 1px solid var(--color-gray-2);
  background-color: var(--color-gray-2);

  cursor: pointer;
  user-select: none;
  transition: all 0.4s;
  border-radius: 4px;

  &:hover {
    border: 1px solid var(--color-gray-8);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
  }
}
</style>
