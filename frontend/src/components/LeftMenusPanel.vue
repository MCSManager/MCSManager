<script setup lang="ts">
import { useScreen } from "@/hooks/useScreen";
import { onMounted, ref, type FunctionalComponent } from "vue";
import LeftMenuBtn from "./LeftMenuBtn.vue";

const { isPhone } = useScreen();

interface LeftMenuItem {
  title: string;
  key: string;
  icon?: FunctionalComponent;
  click?: () => void;
}

const props = defineProps<{
  menus: LeftMenuItem[];
}>();

const activeKey = ref<string>();

const handleChangeMenu = (item: LeftMenuItem) => {
  if (item.click) {
    return item.click();
  }
  activeKey.value = item.key;
};

const setActiveKey = (key: string) => {
  activeKey.value = key;
};

onMounted(() => {
  activeKey.value = props.menus[0].key;
});

defineExpose({
  setActiveKey
});
</script>

<template>
  <div v-if="!isPhone" class="menu-body">
    <div class="left-menu">
      <div v-for="item in props.menus" :key="item.key" class="mb-6" @click="handleChangeMenu(item)">
        <LeftMenuBtn
          :title="item.title"
          :icon="item.icon"
          :is-active="activeKey === item.key"
        ></LeftMenuBtn>
      </div>
    </div>
    <div class="right-content" style="text-align: left">
      <slot :name="activeKey"></slot>
    </div>
  </div>

  <div v-else class="ml-16 mr-16 mt-8 mb-8">
    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane
        v-for="item in props.menus"
        :key="item.key"
        class="mb-6"
        @click="handleChangeMenu(item)"
      >
        <template #tab>
          <!-- <component :is="item.icon"></component> -->
          {{ item.title }}
        </template>
        <div style="text-align: left">
          <slot :name="activeKey"></slot>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style lang="scss" scoped>
.menu-body {
  height: 100%;
  .left-menu {
    height: 100%;
    float: left;
    width: 240px;
    padding: 12px 16px;
    background-color: var(--color-gray-4);
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  .right-content {
    padding-right: 1px;
    overflow: hidden;
    flex-grow: 1;
    text-align: left;
  }
}
</style>
