<template>
  <div style="height: 100%" class="between-menus-container">
    <div v-if="$slots.left" class="menus-item-left">
      <slot name="left"></slot>
    </div>
    <div v-if="$slots.center" class="menus-item-center">
      <slot name="center"></slot>
    </div>
    <div
      v-if="$slots.right"
      class="menus-item-right"
      :class="{ 'phone-menus-item-right': $slots.center }"
    >
      <slot name="right"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.between-menus-container,
.menus-item-center,
.menus-item-left,
.menus-item-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  flex: 1;
}

.between-menus-container {
  flex: unset !important;
  justify-content: space-between;
}

.menus-item-center {
  justify-content: center;
  width: 30%;
}
.menus-item-left {
  justify-content: flex-start;
}
.menus-item-right {
  justify-content: flex-end;
}

@media (max-width: 585px) {
  .menus-item-center {
    flex: unset !important;
    width: 100% !important;
  }
  .phone-menus-item-right {
    justify-content: flex-start !important;
  }
}
</style>
