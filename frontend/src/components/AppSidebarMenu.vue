<script setup lang="ts">
import { t } from "@/lang/i18n";
import { useHeaderMenus } from "@/hooks/useHeaderMenus";
import {
  ApartmentOutlined,
  AppstoreOutlined,
  DashboardOutlined,
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
const { menus, appMenus, handleToPage } = useHeaderMenus();

/** 路由 path 对应的侧边栏图标 */
const routePathIcons: Record<string, Component> = {
  "/instances": AppstoreOutlined,
  "/market": ShopOutlined,
  "/overview": DashboardOutlined,
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

const isRouteActive = (path: string): boolean => {
  const currentPath = route.path || "";
  return currentPath === path || currentPath.startsWith(path + "/");
};

const onRouteClick = (path: string) => {
  handleToPage(path);
};

type AppMenuItem = (typeof appMenus.value)[number];

const onAppMenuClick = (item: AppMenuItem, key?: Key) => {
  if (item.menus && key !== undefined) {
    item.click(String(key));
  } else if (!item.menus) {
    (item.click as () => void)();
  }
};

const onMenuClick = (item: AppMenuItem, info: { key: Key }) => {
  onAppMenuClick(item, info.key);
};

const getMenuAriaLabel = (name: string, path: string): string => {
  return isRouteActive(path) ? `${name} ${t("TXT_CODE_097a5b73")}` : name;
};
</script>

<template>
  <nav class="sidebar-menu" role="navigation" :aria-label="t('TXT_CODE_59faa87c')">
    <div class="sidebar-menu-section" role="menubar">
      <a
        v-for="item in menus"
        :key="item.path"
        class="sidebar-item"
        :class="[
          item.customClass,
          { 'sidebar-item--active': isRouteActive(item.path as string) }
        ]"
        role="menuitem"
        :aria-label="getMenuAriaLabel(item.name as string, item.path as string)"
        :aria-current="isRouteActive(item.path as string) ? 'page' : undefined"
        tabindex="0"
        @click.prevent="onRouteClick(item.path as string)"
        @keydown.enter.space.prevent="onRouteClick(item.path as string)"
      >
        <div class="sidebar-item-glass">
          <component :is="getRouteIcon(item.path as string)" class="sidebar-item-icon" aria-hidden="true" />
          <span class="sidebar-item-text">{{ item.name }}</span>
        </div>
      </a>
    </div>

    <!-- 分隔行 -->
    <div class="sidebar-divider" role="separator" />

    <!-- 应用菜单 appMenus -->
    <div class="sidebar-menu-section" role="menubar" :aria-label="t('TXT_CODE_b6e32c2b')">
      <template v-for="(item, index) in appMenus" :key="index">
        <a-dropdown v-if="item.menus && item.conditions" trigger="click" placement="topRight">
          <a
            class="sidebar-item"
            role="menuitem"
            :aria-label="item.title"
            :aria-haspopup="true"
            tabindex="0"
          >
            <div class="sidebar-item-glass">
              <component
                :is="item.icon"
                v-if="item.icon"
                class="sidebar-item-icon"
                aria-hidden="true"
              />
              <span class="sidebar-item-text">{{ item.title }}</span>
            </div>
          </a>
          <template #overlay>
            <a-menu @click="(info) => onMenuClick(item, info)">
              <a-menu-item v-for="m in item.menus" :key="String(m.value)">
                {{ m.title }}
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <a
          v-else-if="item.conditions"
          class="sidebar-item"
          :class="item.customClass"
          role="menuitem"
          :aria-label="item.title"
          tabindex="0"
          @click.prevent="onAppMenuClick(item)"
          @keydown.enter.space.prevent="onAppMenuClick(item)"
        >
          <div class="sidebar-item-glass">
            <component
              :is="item.icon"
              v-if="item.icon"
              class="sidebar-item-icon"
              aria-hidden="true"
            />
            <span class="sidebar-item-text">{{ item.title }}</span>
          </div>
        </a>
      </template>
    </div>
  </nav>
</template>

<style lang="scss" scoped>

.sidebar-menu {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 16px 0;
  color: rgba(255, 255, 255, 0.9);
  min-height: 100%;
  gap: 8px;
}

.sidebar-menu-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}


$sidebar-primary: #409cd8;
$sidebar-warning: #ffc107;
$sidebar-danger: #ff1911;

.sidebar-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 2px;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  border-radius: 12px;
  margin: 0 12px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba($sidebar-primary, 0.5), 0 0 0 6px rgba($sidebar-primary, 0.2);
  }

  &:hover:not(&--active) {
    transform: translateX(-2px);
    will-change: transform;

    .sidebar-item-glass {
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .sidebar-item-icon {
      transform: scale(1.1);
      color: rgba(255, 255, 255, 1);
    }
  }

  &:active {
    transform: scale(0.98) translateX(-1px);
    transition-duration: 100ms;
  }


  &--active {
    .sidebar-item-glass {
      background: rgba($sidebar-primary, 0.25);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba($sidebar-primary, 0.3);
      box-shadow: 0 4px 16px rgba($sidebar-primary, 0.2);
    }

    .sidebar-item-icon {
      color: $sidebar-primary;
      filter: drop-shadow(0 0 8px rgba($sidebar-primary, 0.6));
    }

    .sidebar-item-text {
      color: #ffffff;
      font-weight: 600;
    }
  }
}

/* 玻璃拟态容器 */
.sidebar-item-glass {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
  min-width: 0;
}

/* 图标 */
.sidebar-item-icon {
  font-size: 18px;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.75);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-item-text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.85);
  transition: color 200ms ease;
  letter-spacing: 0.2px;
}

.sidebar-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 20%,
    rgba(255, 255, 255, 0.15) 80%,
    transparent 100%
  );
  margin: 12px 24px;
  flex-shrink: 0;
}


:deep(.nav-button-warning) {
  .sidebar-item-glass {
    border-color: rgba($sidebar-warning, 0.2);
  }

  &:hover .sidebar-item-glass {
    background: rgba($sidebar-warning, 0.15);
    border-color: rgba($sidebar-warning, 0.3);
  }
}

:deep(.nav-button-success) {
  .sidebar-item-glass {
    border-color: rgba($sidebar-primary, 0.2);
  }

  &:hover .sidebar-item-glass {
    background: rgba($sidebar-primary, 0.2);
    border-color: rgba($sidebar-primary, 0.4);
  }
}

:deep(.nav-button-danger) {
  .sidebar-item-glass {
    border-color: rgba($sidebar-danger, 0.2);
  }

  &:hover .sidebar-item-glass {
    background: rgba($sidebar-danger, 0.2);
    border-color: rgba($sidebar-danger, 0.4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-item,
  .sidebar-item-glass,
  .sidebar-item-icon {
    transition: none;
  }

  .sidebar-item:hover:not(.sidebar-item--active) {
    transform: none;
  }

  .sidebar-item:active {
    transform: none;
  }
}

@media (hover: none) {
  .sidebar-item:hover:not(.sidebar-item--active) {
    transform: none;

    .sidebar-item-icon {
      transform: none;
    }
  }
}
</style>
