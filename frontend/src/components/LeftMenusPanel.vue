<script setup lang="ts">
import type CardPanel from "./CardPanel.vue";
import { ref, type FunctionalComponent } from "vue";
import LeftMenuBtn from "./LeftMenuBtn.vue";

interface LeftMenuItem {
  title: string;
  key: string;
  icon?: FunctionalComponent;
}

const props = defineProps<{
  menus: LeftMenuItem[];
}>();

const currentMenu = ref<LeftMenuItem>();

const handleChangeMenu = (item: LeftMenuItem) => {
  currentMenu.value = item;
};
</script>

<template>
  <CardPanel :padding="false">
    <template #body>
      <div class="menu-body">
        <div class="left-menu">
          <div
            v-for="item in props.menus"
            :key="item.key"
            class="mb-6"
            @click="handleChangeMenu(item)"
          >
            <LeftMenuBtn :title="item.title" :icon="item.icon"> </LeftMenuBtn>
          </div>
        </div>
        <div class="right-content">
          <slot :name="currentMenu?.key"></slot>
        </div>
      </div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.menu-body {
  height: 100%;
  display: flex;
  .left-menu {
    width: 280px;
    padding: 12px 16px;
    background-color: var(--color-gray-4);
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  .right-content {
    flex-grow: 1;
    padding: 20px;
    text-align: left;
  }
}
</style>
