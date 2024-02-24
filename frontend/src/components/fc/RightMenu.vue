<script setup lang="ts">
import type { RightClickMenuItem } from "@/hooks/useRightClickMenu";
import type { CSSProperties } from "vue";
import { ref, nextTick, computed } from "vue";
import { useWindowSize } from "@vueuse/core";

const props = defineProps<{
  mouseX: number;
  mouseY: number;
  options: RightClickMenuItem[];
}>();

const { width: vw, height: vh } = useWindowSize();
const rightMenu = ref<HTMLElement>();

const x = ref(props.mouseX);
const y = ref(props.mouseY);

const menuStyle = computed<CSSProperties>(() => {
  return {
    position: "fixed",
    top: `${y.value}px`,
    left: `${x.value}px`
    // top: `100px`,
    // left: `100px`
  };
});

const openMenu = () => {
  if (rightMenu.value) {
    const rw = rightMenu.value.offsetWidth;
    const rh = rightMenu.value.offsetHeight;
    if (x.value > vw.value - rw) x.value -= rw;
    if (y.value > vh.value - rh) y.value -= rh;
    rightMenu.value.style.visibility = "unset";
  }
  return new Promise((resolve) => {
    nextTick(() => resolve(true));
  });
};

defineExpose({
  openMenu
});
</script>
<template>
  <div ref="rightMenu" class="right-menu" :style="menuStyle">
    <a-menu>
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
  visibility: hidden;
}
</style>
