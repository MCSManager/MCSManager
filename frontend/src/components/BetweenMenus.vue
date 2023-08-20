<script setup lang="ts">
import { useScreen } from "../hooks/useScreen";

const screen = useScreen();
</script>

<template>
  <div style="height: 100%" class="between-menus-container">
    <a-row :gutter="[0, 24]" style="height: 100%">
      <a-col :span="12" :lg="8" class="align-center">
        <slot name="left"></slot>
      </a-col>
      <a-col v-if="!screen.isPhone.value" :lg="8">
        <div class="flex-center">
          <slot name="center"></slot>
        </div>
      </a-col>
      <a-col
        :span="12"
        :lg="8"
        class="align-center"
        style="display: flex; justify-content: flex-end"
      >
        <slot name="right"></slot>
      </a-col>

      <a-col v-if="screen.isPhone.value && $slots.center" :span="24">
        <div class="flex-center">
          <slot name="center"></slot>
        </div>
      </a-col>
    </a-row>
  </div>
</template>
