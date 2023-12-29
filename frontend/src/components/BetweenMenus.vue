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
  gap: 12px;

  .menus-item-center {
    display: flex;
    justify-content: center;
    width: 30%;
    flex: 1;
  }
  .menus-item-left {
    flex: 1;
  }
  .menus-item-right {
    text-align: right;
    flex: 1;
  }
}

@media (max-width: 585px) {
  .between-menus-container {
    display: block;
  }
  .menus-item-center {
    margin-bottom: 12px;
  }
  .menus-item-left {
    display: none;
  }
  .menus-item-center,
  .menus-item-right {
    width: 100% !important;
    text-align: left !important;
  }
}
</style>
