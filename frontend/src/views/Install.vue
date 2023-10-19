<script setup lang="ts"></script>

<template>
  <a-row :gutter="[24, 24]">
    <a-col :span="6">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 4 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="6">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 4 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="6">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 4 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="6">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 4 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="24">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 9 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="8">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 6 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="16">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 6 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="8">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 6 }" />
        </template>
      </CardPanel>
    </a-col>
    <a-col :span="16">
      <CardPanel>
        <template #body>
          <a-skeleton :paragraph="{ rows: 6 }" />
        </template>
      </CardPanel>
    </a-col>
  </a-row>
  <div class="install-page-container">
    <CardPanel class="install-panel">
      <template #body> 安装页面 </template>
    </CardPanel>
  </div>
</template>

<style lang="scss" scoped>
.install-page-container {
  position: fixed;
  left: 0px;
  right: 0px;
  bottom: 0px;
  top: 0px;
  background-color: #29292957;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: saturate(120%) blur(10px);
  z-index: 200;
  transition: all 0.8s;

  .install-panel {
    transition: all 0.6s;
    max-width: 420px;
    max-height: 400px;
    width: 100%;
    background-color: var(--login-panel-bg);
    backdrop-filter: saturate(120%) blur(12px);
  }
}

@keyframes scaleAnimation {
  0% {
    transform: scale(1);
  }
  20% {
    transform: scale(0.9);
    opacity: 1;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
</style>
