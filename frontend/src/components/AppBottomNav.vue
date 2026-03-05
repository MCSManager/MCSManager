<script setup lang="ts">
import { useHeaderMenus } from "@/hooks/useHeaderMenus";
import {
  ApartmentOutlined,
  AppstoreOutlined,
  AreaChartOutlined,
  LinkOutlined,
  LoginOutlined,
  MenuOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons-vue";
import type { Component } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const { menus, handleToPage } = useHeaderMenus();

const routePathIcons: Record<string, Component> = {
  "/instances": AppstoreOutlined,
  "/market": ShopOutlined,
  "/overview": AreaChartOutlined,
  "/users": TeamOutlined,
  "/node": ApartmentOutlined,
  "/settings": SettingOutlined,
  "/customer": UserOutlined,
  "/login": LoginOutlined,
  "/shop": ShoppingOutlined,
  "/_open_page": LinkOutlined
};

const getRouteIcon = (path: string): Component => routePathIcons[path] ?? MenuOutlined;

const isActive = (path: string): boolean => {
  if (route.path === path) return true;
  if (path === "/") return false;
  return route.path.startsWith(path + "/");
};
</script>

<template>
  <nav class="bottom-nav-bar">
    <div class="bottom-nav-inner">
      <button
        v-for="item in menus"
        :key="item.path"
        class="bottom-nav-item"
        :class="{ 'bottom-nav-item--active': isActive(item.path) }"
        @click="handleToPage(item.path)"
      >
        <span class="bottom-nav-icon-wrap">
          <component :is="getRouteIcon(item.path)" class="bottom-nav-icon" />
        </span>
      </button>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.bottom-nav-bar {
  position: fixed;
  bottom: 14px;
  left: 0px;
  right: 0px;
  z-index: 1002;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
}

.bottom-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: 8px;
  padding: 6px;
  background: var(--background-color-white);
  border-radius: 999px;
  box-shadow:
    0 8px 32px var(--card-shadow-extend-color),
    0 2px 8px var(--card-shadow-color);
  pointer-events: auto;
  max-width: 366px;
  margin: auto;
}

.bottom-nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 46px;
  border-radius: 50%;

  transition:
    background 0.22s ease,
    transform 0.18s ease;

  .bottom-nav-icon {
    font-size: 20px;
    color: var(--color-gray-7);
    transition: color 0.22s ease;
  }
}

.bottom-nav-item--active .bottom-nav-icon-wrap {
  // background: linear-gradient(135deg, var(--color-blue-4) 0%, var(--color-blue-6) 100%);
  background: var(--color-gray-4);

  // box-shadow: 0 4px 16px color-mix(in srgb, var(--color-blue-6) 40%, transparent);

  .bottom-nav-icon {
    font-size: 22px;
    color: var(--color-gray-13);
  }
}

.bottom-nav-item:active .bottom-nav-icon-wrap {
  transform: scale(0.92);
}
</style>
