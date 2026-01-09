<script setup lang="ts">
import logo from "@/assets/logo.png";
import { router, type RouterMetaInfo } from "@/config/router";
import { useAppRouters } from "@/hooks/useAppRouters";
import { useScreen } from "@/hooks/useScreen";
import { t } from "@/lang/i18n";
import { logoutUser } from "@/services/apis/index";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { AppTheme } from "@/types/const";
import {
  AppstoreAddOutlined,
  BgColorsOutlined,
  BuildOutlined,
  CloseCircleOutlined,
  GithubFilled,
  LogoutOutlined,
  MenuUnfoldOutlined,
  RedoOutlined,
  SaveOutlined,
  SketchOutlined,
  UserOutlined
} from "@ant-design/icons-vue";
import { useScroll } from "@vueuse/core";
import { message, Modal, notification } from "ant-design-vue";
import { computed, h, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useLayoutConfigStore } from "../stores/useLayoutConfig";
import CardPanel from "./CardPanel.vue";

const { saveGlobalLayoutConfig, resetGlobalLayoutConfig, getSettingsConfig } =
  useLayoutConfigStore();
const { containerState, changeDesignMode } = useLayoutContainerStore();
const { getRouteParamsUrl, toPage } = useAppRouters();
const { setTheme, setLogoImage, logoImage } = useAppConfigStore();
const { state: appTools } = useAppToolsStore();
const { isAdmin, state: appState, isLogged } = useAppStateStore();
const { state: frontendState } = useAppStateStore();

const { y } = useScroll(document.body);

onMounted(async () => {
  try {
    const settingsConfig = await getSettingsConfig();
    if (settingsConfig?.theme?.logoImage) {
      setLogoImage(settingsConfig.theme.logoImage);
    }
  } catch (error) {
    console.error("Failed to load settings config:", error);
  }
});

const isScroll = computed(() => {
  return y.value > 10;
});

const headerStyle = computed(() => {
  return {
    "--header-height": isScroll.value ? "60px" : "64px"
  };
});

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

const menus = computed(() => {
  return router
    .getRoutes()
    .filter((v) => {
      if (v.path === "/" || !v.name) return false;
      const metaInfo = v.meta as RouterMetaInfo;
      if (metaInfo.condition && !metaInfo.condition()) {
        return false;
      }
      if (containerState.isDesignMode) {
        return metaInfo.onlyDisplayEditMode || metaInfo.mainMenu;
      }
      if (isAdmin.value) {
        return metaInfo.mainMenu === true && metaInfo.onlyDisplayEditMode !== true;
      }

      return (
        metaInfo.mainMenu === true &&
        isLogged.value &&
        Number(appState.userInfo?.permission) >= Number(metaInfo.permission)
      );
    })
    .map((r) => {
      return {
        name: r.name,
        path: r.path,
        meta: r.meta,
        customClass: r.meta.customClass ?? []
      };
    });
});

const breadcrumbs = computed(() => {
  const arr = [
    {
      title: t("TXT_CODE_f5b9d58f"),
      disabled: false,
      href: `.`
    }
  ];

  const queryUrl = getRouteParamsUrl();

  if (route.meta.breadcrumbs instanceof Array) {
    const meta = route.meta as RouterMetaInfo;
    meta.breadcrumbs?.forEach((v) => {
      const params = queryUrl && !v.mainMenu ? `?${queryUrl}` : "";
      if ((appState.userInfo?.permission || 0) < v.permission) return;
      arr.push({
        title: v.name,
        disabled: false,
        href: `./#${v.path}${params}`
      });
    });
  }

  arr.push({
    title: String(route.name),
    disabled: true,
    href: `./#${route.fullPath}`
  });

  return arr;
});

const appMenus = computed(() => {
  return [
    {
      iconText: "",
      // iconText: t("TXT_CODE_3ccb26e"),
      title: t("TXT_CODE_b01f8383"),
      icon: GithubFilled,
      conditions: !isProMode.value,
      onlyPC: true,
      click: onClickIcon
    },
    {
      iconText: t("TXT_CODE_80f0904e"),
      title: t("TXT_CODE_b6c675d6"),
      icon: SketchOutlined,
      click: onClickIcon,
      conditions: isProMode.value,
      onlyPC: true,
      customClass: ["nav-button-success"]
    },
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
        Modal.confirm({
          title: t("TXT_CODE_d73c8510"),
          content: t("TXT_CODE_6d9b9f22"),
          async onOk() {
            changeDesignMode(false);
            await saveGlobalLayoutConfig();
            notification.success({
              placement: "top",
              message: t("TXT_CODE_47c35915"),
              description: t("TXT_CODE_e10c992a")
            });
            setTimeout(() => window.location.reload(), 400);
          }
        });
      },
      conditions: containerState.isDesignMode,
      onlyPC: true,
      customClass: ["nav-button-success"]
    },
    {
      title: t("TXT_CODE_5b5d6f04"),
      icon: CloseCircleOutlined,
      click: async () => {
        Modal.confirm({
          title: t("TXT_CODE_8f20c21c"),
          content: t("TXT_CODE_9740f199"),
          async onOk() {
            window.location.reload();
          }
        });
      },
      conditions: containerState.isDesignMode,
      onlyPC: true,
      customClass: ["nav-button-warning"]
    },
    {
      title: t("TXT_CODE_abd2f7e1"),
      icon: RedoOutlined,
      click: async () => {
        Modal.confirm({
          title: t("TXT_CODE_74fa2f73"),
          content: t("TXT_CODE_f63bfe78"),
          async onOk() {
            await resetGlobalLayoutConfig();
            notification.success({
              placement: "top",
              message: t("TXT_CODE_15c6d4eb"),
              description: t("TXT_CODE_e10c992a")
            });
            setTimeout(() => window.location.reload(), 400);
          }
        });
      },
      conditions: containerState.isDesignMode,
      onlyPC: true,
      customClass: ["nav-button-danger"]
    },

    {
      title: t("TXT_CODE_f591e2fa"),
      icon: BgColorsOutlined,
      click: (key: string) => {
        setTheme(Number(key) as AppTheme);
      },
      conditions: !containerState.isDesignMode,
      onlyPC: false,
      menus: [
        {
          value: AppTheme.AUTO,
          title: t("TXT_CODE_dc8de4ff")
        },
        {
          value: AppTheme.LIGHT,
          title: t("TXT_CODE_673eac8e")
        },
        {
          value: AppTheme.DARK,
          title: t("TXT_CODE_5e4a370d")
        }
      ]
    },
    {
      title: t("TXT_CODE_ebd2a6a1"),
      icon: BuildOutlined,
      click: () => {
        changeDesignMode(true);
        notification.warning({
          placement: "bottom",
          type: "warning",
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
      conditions: !containerState.isDesignMode && isLogged.value,
      onlyPC: false
    },
    {
      title: t("TXT_CODE_2c69ab15"),
      icon: LogoutOutlined,
      click: async () => {
        Modal.confirm({
          title: t("TXT_CODE_9654b91c"),
          async onOk() {
            await execute();
            message.success(t("TXT_CODE_11673d8c"));
            setTimeout(() => (window.location.href = "/"), 400);
          }
        });
      },
      customClass: ["nav-button-danger"],
      conditions: !containerState.isDesignMode && isLogged.value,
      onlyPC: false
    }
  ];
});

const { isPhone } = useScreen();

const isProMode = computed(() => {
  return !!frontendState.settings.businessMode;
});

const openPhoneMenu = (b = false) => {
  containerState.showPhoneMenu = b;
};

const onClickIcon = () => {
  window.open("https://github.com/MCSManager/MCSManager", "_blank");
};
</script>

<template>
  <header class="app-header-wrapper" :style="headerStyle">
    <div v-if="!isPhone" class="app-header-content">
      <nav class="btns">
        <a href="." style="margin-right: 12px">
          <div class="logo">
            <img :src="logoImage" style="height: 18px" />
          </div>
        </a>

        <div
          v-for="item in menus"
          :key="item.path"
          class="nav-button"
          :class="item.customClass"
          @click="handleToPage(item.path)"
        >
          <span>{{ item.name }}</span>
        </div>
      </nav>
      <div class="btns">
        <div v-for="(item, index) in appMenus" :key="index">
          <a-dropdown v-if="item.menus && item.conditions" placement="bottom">
            <div
              :class="item.customClass"
              class="nav-button right-nav-button flex-center"
              @click.prevent
            >
              <component :is="item.icon" v-if="item.icon"></component>
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
            <div
              :class="item.customClass"
              class="nav-button right-nav-button flex-center"
              type="text"
              @click="(e: any) => item.click(e.key)"
            >
              <component :is="item.icon" v-if="item.icon"></component>
              <span v-if="item?.iconText" class="ml-6" style="font-size: 12px">
                {{ item?.iconText }}
              </span>
            </div>
          </a-tooltip>
        </div>
      </div>
    </div>
  </header>
  <div v-if="!isPhone" style="height: 64px"></div>

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
              <a-dropdown
                v-if="item.menus && item.conditions && !item.onlyPC"
                class="phone-nav-button"
                placement="bottom"
              >
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
                class="phone-nav-button"
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

.nav-button-warning:hover {
  background-color: rgba(255, 193, 7, 0.34) !important;
}

.nav-button-success:hover {
  background-color: rgba(64, 156, 216, 0.12) !important;
}

.nav-button-danger:hover {
  background-color: #ff19116f !important;
}

.nav-button-primary:hover {
  background-color: rgba(255, 255, 255, 0.25) !important;
}

.nav-button-success:hover {
  background-color: #48e6635a !important;
}

.phone-menu {
  .phone-menu-btn {
    padding: 16px 8px;
    border-bottom: 1px solid var(--color-gray-4);
    color: var(--color-gray-12);
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
      color: var(--color-always-white) !important;
    }
  }

  .phone-nav-button,
  .phone-nav-button * {
    margin: 0px 6px;
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
  backdrop-filter: saturate(180%) blur(20px);
  color: var(--app-header-text-color);

  position: fixed;
  top: 0;
  left: 0;
  right: 0;

  z-index: 20;

  // 添加平滑过渡效果
  transition: height 0.4s ease-in-out;

  .app-header-content {
    @extend .global-app-container;

    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: var(--header-height);

    // 添加平滑过渡效果
    transition: height 0.4s ease-in-out;

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
    user-select: none;
  }

  .right-nav-button {
    margin: 0 2px;
    font-size: 14px;
    padding: 8px 8px;
  }

  .icon-button {
    font-size: 16px !important;
  }
  .nav-button:hover {
    background-color: rgba(215, 215, 215, 0.261);
  }

  .logo {
    cursor: pointer;
  }

  .pro-mode-order-container {
    @extend .nav-button;
    @extend .nav-button-success;
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
