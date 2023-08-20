<script setup lang="ts">
const props = defineProps({
  fullHeight: {
    type: Boolean,
    default: true,
  },
});
</script>

<template>
  <div
    :class="{
      'card-panel': true,
      'global-card-container-shadow': true,
      'h-100': props.fullHeight,
    }"
  >
    <div class="card-panel-title" v-if="$slots.title">
      <div>
        <a-typography-title :level="5">
          <slot name="title"></slot>
        </a-typography-title>
      </div>
      <div>
        <a-typography-text>
          <slot name="operator"></slot>
        </a-typography-text>
      </div>
    </div>
    <div class="card-panel-content">
      <slot name="body"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "@/assets/global.scss";

.card-panel {
  background-color: var(--background-color-white);
  padding: 16px;
  display: flex;
  flex-direction: column;

  .card-panel-title {
    font-weight: 600;
    color: var(--text-color);

    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: -4px; // For Ant-Design Font
  }
  .card-panel-content {
    flex-grow: 1;
    color: var(--text-color);
    font-size: 14px;
  }
}

.card-panel-content {
  overflow: hidden;
  zoom: 1;
  word-break: break-all;
  font-size: 14px;
}
</style>
