<script setup lang="ts">
import type { RightClickMenuItem } from "@/hooks/useRightClickMenu";
import type { CSSProperties } from "vue";
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
};

defineExpose({
  openMenu
});
</script>
<template>
  <div :style="menuStyle">
    <a-menu v-if="state.menuVisible">
      <a-menu-item>查看 {{ props.mouseX }} | {{ props.mouseY }}</a-menu-item>
      <a-menu-item>删除</a-menu-item>
    </a-menu>
  </div>
</template>
