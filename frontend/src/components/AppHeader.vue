<script setup lang="ts">
import { router, type RouterMetaInfo } from "@/config/router";
import logo from "@/assets/logo.png";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { useRoute } from "vue-router";
import { computed, h } from "vue";
import { useAppRouters } from "@/hooks/useAppRouters";
import { notification } from "ant-design-vue";
import {
  BuildOutlined,
  SaveOutlined,
  AppstoreAddOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  FormatPainterOutlined,
  TranslationOutlined
} from "@ant-design/icons-vue";
import { useScreen } from "@/hooks/useScreen";
import CardPanel from "./CardPanel.vue";
import { $t, setLanguage, $t as t } from "@/lang/i18n";
import { THEME, useAppConfigStore } from "@/stores/useAppConfigStore";
import { logoutUser } from "@/services/apis/index";
import { message } from "ant-design-vue";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { useLayoutConfigStore } from "../stores/useLayoutConfig";

const { saveGlobalLayoutConfig } = useLayoutConfigStore();
const { containerState, changeDesignMode } = useLayoutContainerStore();
const { getRouteParamsUrl, toPage } = useAppRouters();
const { setTheme } = useAppConfigStore();
const { state: appTools } = useAppToolsStore();
const { isAdmin } = useAppStateStore();
const openNewCardDialog = () => {
  containerState.showNewCardDialog = true;
};

const { execute } = logoutUser();

const handleToPage = (url: string) => {
  containerState.showPhoneMenu = false;
  toPage({
    path: url
  });
};

const route = useRoute();

const menus = router
  .getRoutes()
  .filter((v) => v.meta.mainMenu)
  .map((r) => {
    return {
      name: r.name,
      path: r.path,
      meta: r.meta
    };
  });

router.beforeEach((to, from) => {
  console.log("Router:", from, "->", to);
  if (to.name == null) {
    router.push({
      path: "/404",
      query: {
        redirect: to.fullPath
      }
    });
    return false;
  }
  return true;
});

const breadcrumbs = computed(() => {
  const arr = [
    {
      title: t("TXT_CODE_f5b9d58f"),
      disabled: false,
      href: "/"
    }
  ];

  const queryUrl = getRouteParamsUrl();

  if (route.meta.breadcrumbs instanceof Array) {
    const meta = route.meta as RouterMetaInfo;
    meta.breadcrumbs?.forEach((v) => {
      const params = queryUrl && !v.mainMenu ? `?${queryUrl}` : "";
      arr.push({
        title: v.name,
        disabled: false,
        href: `/#${v.path}${params}`
      });
    });
  }

  arr.push({
    title: String(route.name),
    disabled: true,
    href: `/#${route.fullPath}`
  });

  return arr;
});

const appMenus = computed(() => {
  return [
    {
      title: t("TXT_CODE_8b0f8aab"),
      icon: AppstoreAddOutlined,
      click: openNewCardDialog,
      conditions: containerState.isDesignMode,
      onlyPC: true
    },
    {
      title: t("TXT_CODE_8145d82"),
      icon: SaveOutlined,
      click: async () => {
        changeDesignMode(false);
        await saveGlobalLayoutConfig();
        notification.success({
          placement: "top",
          message: t("TXT_CODE_47c35915"),
          description: t("TXT_CODE_e10c992a")
        });
      },
      conditions: containerState.isDesignMode,
      onlyPC: true
    },

    {
      title: t("TXT_CODE_f591e2fa"),
      icon: FormatPainterOutlined,
      click: (key: string) => {
        setTheme(key as THEME);
      },
      conditions: !containerState.isDesignMode,
      onlyPC: true,
      menus: [
        {
          title: $t("TXT_CODE_673eac8e"),
          value: THEME.LIGHT
        },
        {
          title: $t("TXT_CODE_5e4a370d"),
          value: THEME.DARK
        }
      ]
    },
    {
      title: t("TXT_CODE_fa40177b"),
      icon: TranslationOutlined,
      click: (key: string) => {
        setLanguage(key);
      },
      conditions: !containerState.isDesignMode,
      onlyPC: false,
      menus: [
        {
          title: "English",
          value: "en_US"
        },
        {
          title: "简体中文",
          value: "zh_CN"
        }
      ]
    },
    {
      title: t("TXT_CODE_ebd2a6a1"),
      icon: BuildOutlined,
      click: () => {
        changeDesignMode(true);

        notification.info({
          placement: "top",
          message: t("TXT_CODE_7b1adf35"),
          description: t("TXT_CODE_6b6f1d3")
        });
      },
      conditions: !containerState.isDesignMode && isAdmin.value,
      onlyPC: true
    },
    {
      title: t("TXT_CODE_8c3164c9"),
      icon: UserOutlined,
      click: () => {
        appTools.showUserInfoDialog = true;
      },
      conditions: !containerState.isDesignMode,
      onlyPC: false
    },
    {
      title: t("TXT_CODE_2c69ab15"),
      icon: LogoutOutlined,
      click: async () => {
        await execute();
        message.success(t("成功退出登录"));
        router.go(0);
        // toPage({ path: "/" });
        // messageApi.success(t("TXT_CODE_e6856d81"));
      },
      conditions: !containerState.isDesignMode,
      onlyPC: false
    }
  ];
});

const screen = useScreen();
const isPhone = computed(() => screen.isPhone.value);

const openPhoneMenu = (b = false) => {
  containerState.showPhoneMenu = b;
};
</script>

<template>
  <header class="app-header-wrapper">
    <div v-if="!isPhone" class="app-header-content">
      <div class="btns">
        <a href="/" style="margin-right: 12px">
          <div class="logo">
            <img :src="logo" style="height: 18px" />
          </div>
        </a>

        <div
          v-for="item in menus"
          :key="item.path"
          class="nav-button"
          @click="handleToPage(item.path)"
        >
          <span>{{ item.name }}</span>
        </div>
      </div>
      <div class="btns">
        <div v-for="(item, index) in appMenus" :key="index">
          <a-dropdown v-if="item.menus && item.conditions" placement="bottom">
            <div class="nav-button" @click.prevent>
              <component :is="item.icon"></component>
            </div>
            <template #overlay>
              <a-menu @click="(e: any) => item.click(String(e.key))">
                <a-menu-item v-for="m in item.menus" :key="m.value">
                  {{ m.title }}
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-tooltip v-else-if="item.conditions" placement="bottom">
            <template #title>
              <span>{{ item.title }}</span>
            </template>
            <div class="nav-button" type="text" @click="item.click">
              <component :is="item.icon"></component>
            </div>
          </a-tooltip>
        </div>
      </div>
    </div>
  </header>
  <div v-if="!isPhone" style="height: 60px"></div>

  <!-- Menus for phone -->
  <header v-if="isPhone" class="app-header-content-for-phone">
    <CardPanel class="card-panel">
      <template #body>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <div style="width: 100px" class="flex">
            <a-button
              type="text"
              :icon="h(MenuUnfoldOutlined)"
              size="small"
              @click="openPhoneMenu(true)"
            ></a-button>
            <div v-for="(item, index) in appMenus" :key="index">
              <a-dropdown v-if="item.menus && item.conditions && !item.onlyPC" placement="bottom">
                <a-button type="text" :icon="h(item.icon)" size="small" @click.prevent></a-button>
                <template #overlay>
                  <a-menu @click="(e: any) => item.click(String(e.key))">
                    <a-menu-item v-for="m in item.menus" :key="m.value">
                      {{ m.title }}
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
          <div>
            <img :src="logo" style="height: 18px" />
          </div>
          <div style="width: 100px" class="justify-end">
            <div v-for="(item, index) in appMenus" :key="index">
              <a-button
                v-if="item.conditions && !item.onlyPC && !item.menus"
                type="text"
                :icon="h(item.icon)"
                size="small"
                @click="item.click"
              ></a-button>
            </div>
          </div>
        </div>
      </template>
    </CardPanel>
  </header>

  <a-drawer
    :width="500"
    title="MENU"
    placement="top"
    :open="containerState.showPhoneMenu"
    @close="() => (containerState.showPhoneMenu = false)"
  >
    <div class="phone-menu">
      <div
        v-for="item in menus"
        :key="item.path"
        class="phone-menu-btn"
        @click="handleToPage(item.path)"
      >
        {{ item.name }}
      </div>
    </div>
  </a-drawer>

  <div class="breadcrumbs">
    <a-breadcrumb>
      <a-breadcrumb-item v-for="item in breadcrumbs" :key="item.title">
        <a v-if="!item.disabled" :href="item.href">{{ item.title }}</a>
        <span v-else>{{ item.title }}</span>
      </a-breadcrumb-item>
    </a-breadcrumb>
  </div>
</template>

<style lang="scss" scoped>
@import "@/assets/global.scss";

.phone-menu {
  .phone-menu-btn {
    padding: 16px 8px;
    border-bottom: 1px solid var(--color-gray-4);
  }
}

.app-header-content-for-phone {
  height: 60px;
  width: 100%;

  // display: flex;
  // justify-content: space-between;
  // align-items: center;
  // margin: 0px;
  .card-panel {
    background-color: var(--app-header-bg);
    margin-top: 8px;

    button {
      color: var(--color-gray-4);
    }
  }
}

.breadcrumbs {
  font-size: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0px;
}

.app-header-wrapper {
  box-shadow: 0 2px 4px 0 var(--card-shadow-color);

  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--app-header-bg);
  color: var(--app-header-text-color);

  position: fixed;
  top: 0;
  left: 0;
  right: 0;

  z-index: 20;
  .app-header-content {
    @extend .global-app-container;

    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 60px;

    .btns {
      display: flex;
      align-items: center;
    }
  }

  .nav-button {
    margin: 0 4px;
    font-size: 14px;
    transition: all 0.4s;
    color: var(--app-header-text-color) !important;
    text-align: center;
    padding: 8px 12px;
    min-width: 40px;
    cursor: pointer;
    border-radius: 6px;
  }

  .icon-button {
    font-size: 16px !important;
  }
  .nav-button:hover {
    background-color: rgba(215, 215, 215, 0.12);
  }

  .logo {
    cursor: pointer;
  }

  // Sync margin
  @media (max-width: 1470px) {
    .app-header-content,
    .app-header-content-for-phone {
      margin: 0px 25px;
    }
  }

  @media (max-width: 992px) {
    .app-header-content {
      margin: 0px 8px;
    }
  }
}
</style>
