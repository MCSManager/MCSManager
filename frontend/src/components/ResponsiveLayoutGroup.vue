<script lang="ts" setup>
import { ref } from "vue";
import { useResizeObserver } from "@vueuse/core";

const props = defineProps<{
  items: any[];
  fullWidth?: number;
  defaultWidth?: string;
}>();

const responsiveLayoutGroup = ref<HTMLElement>();
const fullModeWidth = props.fullWidth ?? 600;
const initWidth = ref(props.defaultWidth ?? "25%");

const fullWidthMode = ref(false);

useResizeObserver(responsiveLayoutGroup, (entries) => {
  const entry = entries[0];
  const { width } = entry.contentRect;

  if (width > fullModeWidth) {
    fullWidthMode.value = false;
  } else {
    fullWidthMode.value = true;
  }
});
</script>

<template>
  <div ref="responsiveLayoutGroup" class="responsive-layout-group">
    <div
      v-for="(item, index) in items"
      :key="index + String(fullWidthMode)"
      class="responsive-item"
      :class="{ 'responsive-item-full': fullWidthMode }"
    >
      <slot :item="item"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.responsive-layout-group {
  display: flex;

  flex-wrap: wrap;
  overflow-y: auto;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: center;
}

.responsive-item {
  width: v-bind(initWidth);
  padding: 4px 4px;
  overflow: hidden;
}

.responsive-item-full {
  width: 100% !important;
}
</style>
