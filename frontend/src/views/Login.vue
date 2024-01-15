<script setup lang="ts">
import type { LayoutCard } from "@/types";
import LayoutContainer from "./LayoutContainer.vue";
import { useScreen } from "../hooks/useScreen";
import LoginCard from "@/widgets/LoginCard.vue";

defineProps<{
  card: LayoutCard;
}>();

const { isPhone } = useScreen();
</script>

<template>
  <div v-if="!isPhone">
    <div class="login-page-bg">
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
    </div>
    <div class="login-page-container">
      <div class="login-page-body">
        <LayoutContainer></LayoutContainer>
      </div>
    </div>
  </div>
  <div v-else>
    <LoginCard></LoginCard>
  </div>
</template>

<style></style>

<style lang="scss">
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

.login-page-container {
  position: fixed;
  left: 0px;
  right: 0px;
  bottom: 0px;
  top: 0px;

  background-color: #29292957;
  backdrop-filter: saturate(120%) blur(10px);
  transition: all 0.8s;
  overflow-y: auto;
  overflow-x: hidden;

  .login-page-body {
    padding: 12px;
    padding-top: 84px;
    max-width: 1260px !important;
    margin: 0 auto;
    height: 100%;
    position: relative;
    .main-flex-center {
      margin-top: 0 !important;
      position: absolute;
      left: 0px;
      right: 0px;
      bottom: 0px;
      top: 0px;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: left !important;
    }
  }
}
</style>
