<template>
  <div style="height: 100%" class="between-menus-container">
    <div class="menus-item-left">
      <slot name="left"></slot>
    </div>
    <div class="menus-item-center">
      <slot name="center"></slot>
    </div>
    <div class="menus-item-right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.between-menus-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  .menus-item-center {
    display: flex;
    justify-content: center;
    width: 30%;
  }
}

@media (max-width: 585px) {
  .menus-item-left {
    display: none;
  }
  .menus-item-center {
    width: 100% !important;
  }
}
</style>
