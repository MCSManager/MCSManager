<script setup lang="ts">
import {
  useHeaderMenus,
  type SidebarAppDropdownEntry,
  type SidebarEntry
} from "@/hooks/useHeaderMenus";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
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
import type { Key } from "ant-design-vue/es/table/interface";
import type { Component } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const { sidebarItems, handleToPage } = useHeaderMenus();

/** Whether route menu item is active (current path equals or is child of this path) */
const isRouteActive = (path: string): boolean => {
  if (route.path === path) return true;
  if (path === "/") return false;
  return route.path.startsWith(path + "/");
};

/** Sidebar icon for each route path */
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

const getRouteIcon = (path: string): Component => {
  return routePathIcons[path] ?? MenuOutlined;
};

const getItemKey = (entry: SidebarEntry, index: number): string => {
  if (entry.type === "divider") return "sidebar-divider";
  if (entry.type === "route") return entry.path;
  return `app-${index}-${entry.title}`;
};

const onAppDropdownClick = (item: SidebarAppDropdownEntry, info: { key: Key }) => {
  item.click(String(info.key));
};
const { logoImage } = useAppConfigStore();
</script>

<template>
  <aside class="left-sidebar">
    <nav class="sidebar-menu">
      <a href="." class="logo-link">
        <div class="logo">
          <img :src="logoImage" />
        </div>
      </a>

      <div class="sidebar-menu-section">
        <template v-for="(entry, index) in sidebarItems" :key="getItemKey(entry, index)">
          <!-- Divider -->
          <div v-if="entry.type === 'divider'" class="sidebar-divider" />

          <!-- Route link -->
          <a
            v-else-if="entry.type === 'route'"
            class="sidebar-item"
            :class="[entry.customClass, { 'sidebar-item-active': isRouteActive(entry.path) }]"
            @click.prevent="handleToPage(entry.path)"
          >
            <component :is="getRouteIcon(entry.path)" class="sidebar-item-icon" />
            <span class="sidebar-item-text">{{ entry.name }}</span>
          </a>

          <!-- App menu (dropdown) -->
          <a-dropdown
            v-else-if="entry.type === 'app-dropdown'"
            trigger="click"
            placement="topRight"
          >
            <a class="sidebar-item" @click.prevent>
              <component :is="entry.icon" v-if="entry.icon" class="sidebar-item-icon" />
              <span class="sidebar-item-text">{{ entry.title }}</span>
            </a>
            <template #overlay>
              <a-menu @click="(info) => onAppDropdownClick(entry, info)">
                <a-menu-item v-for="m in entry.menus" :key="String(m.value)">
                  {{ m.title }}
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>

          <!-- App menu (single click) -->
          <a
            v-else-if="entry.type === 'app'"
            class="sidebar-item"
            :class="entry.customClass"
            @click.prevent="entry.click()"
          >
            <component :is="entry.icon" v-if="entry.icon" class="sidebar-item-icon" />
            <span class="sidebar-item-text">{{ entry.title }}</span>
          </a>
        </template>
      </div>
    </nav>
  </aside>
</template>

<style lang="scss" scoped>
.logo-link {
  display: block;
  width: 100%;
  padding-left: 27px;

  .logo {
    margin-bottom: 20px;
    margin-right: 10px;
  }
  img {
    height: 20px;
  }
}

.left-sidebar:hover {
  width: 246px;
  background-position-x: -20px;
}

.left-sidebar {
  top: 0;
  align-self: flex-start;
  position: fixed;
  width: 240px;
  min-height: 100vh;
  text-align: left;
  border-right: 1px solid var(--color-gray-5);
  background-image: url("@/assets/side.png");
  padding: 20px 12px;
  transition: all 0.3s ease;
  background-position-x: -80px;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  color: rgba(255, 255, 255, 0.85);
  min-height: 100%;
}

.sidebar-menu-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 32px 12px 20px;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.4s ease;
  margin: 0 8px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.178);
  }

  &.sidebar-item-active {
    background-color: rgba(255, 255, 255, 0.22);
  }

  .sidebar-item-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .sidebar-item-text {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.sidebar-divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.12);
  margin: 12px 12px;
  flex-shrink: 0;
}

/* Same semantic highlight as AppHeader */
:deep(.nav-button-warning:hover) {
  background-color: rgba(255, 193, 7, 0.2) !important;
}

:deep(.nav-button-success:hover) {
  background-color: rgba(64, 156, 216, 0.15) !important;
}

:deep(.nav-button-danger:hover) {
  background-color: rgba(255, 25, 17, 0.25) !important;
}
</style>
