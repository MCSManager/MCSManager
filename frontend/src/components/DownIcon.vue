<script setup lang="ts">
import { DoubleLeftOutlined } from "@ant-design/icons-vue";
import { Flex } from "ant-design-vue";

defineProps<{
  text: string;
}>();
</script>

<template>
  <Flex vertical class="down-icon" justify="center" align="center" :gap="8">
    <DoubleLeftOutlined class="icon" />
    <a-typography-text class="text">
      {{ text }}
    </a-typography-text>
  </Flex>
</template>

<style scoped lang="scss">
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.down-icon {
  font-size: 16px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s;
  border-radius: 6px;
  animation: float 2s ease-in-out infinite;
  color: var(--color-gray-7);

  .icon {
    transform: rotate(-90deg);
  }

  .text {
    color: var(--color-gray-7);
  }

  &:hover {
    background-color: var(--color-gray-2);
    animation-play-state: paused;
  }
}
</style>
