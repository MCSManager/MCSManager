<script setup lang="ts">
import type { RightClickMenuItem } from "@/hooks/useRightClickMenu";
import type { CSSProperties } from "vue";
import { nextTick } from "vue";
import { reactive, computed } from "vue";

const props = defineProps<{
  mouseX: number;
  mouseY: number;
  options: RightClickMenuItem[];
}>();

const state = reactive({
  menuVisible: false
});

const menuStyle = computed<CSSProperties>(() => {
  return {
    position: "fixed",
    top: `${props.mouseY}px`,
    left: `${props.mouseX}px`
    // top: `100px`,
    // left: `100px`
  };
});

const openMenu = () => {
  state.menuVisible = true;
  return new Promise((resolve) => {
    nextTick(() => resolve(true));
  });
};

defineExpose({
  openMenu
});
</script>
<template>
  <div class="right-menu" :style="menuStyle">
    <a-menu v-if="state.menuVisible">
      <a-menu-item
        v-for="item in options"
        :key="item.value"
        :style="{ width: item.width ? item.width + 'px' : '140px' }"
        @click="() => item.onClick(item.value)"
      >
        {{ item.label }}
      </a-menu-item>
    </a-menu>
  </div>
</template>

<style lang="scss" scoped>
.right-menu {
  z-index: 9999;
  border: 1px solid var(--color-gray-5);
  border-radius: 8px;
  overflow: hidden;
}
</style>
