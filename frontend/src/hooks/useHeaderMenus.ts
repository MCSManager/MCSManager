import { router, type RouterMetaInfo } from "@/config/router";
import { useAppRouters } from "@/hooks/useAppRouters";
import { t } from "@/lang/i18n";
import { logoutUser } from "@/services/apis/index";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { useLayoutConfigStore } from "@/stores/useLayoutConfig";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { AppTheme } from "@/types/const";
import {
  AppstoreAddOutlined,
  BgColorsOutlined,
  BuildOutlined,
  CloseCircleOutlined,
  GithubFilled,
  LogoutOutlined,
  RedoOutlined,
  SaveOutlined,
  UserOutlined
} from "@ant-design/icons-vue";
import { message, Modal, notification } from "ant-design-vue";
import type { Component } from "vue";
import { computed } from "vue";

/** Sidebar item: divider */
export type SidebarDividerEntry = { type: "divider" };

/** Sidebar item: route link */
export type SidebarRouteEntry = {
  type: "route";
  path: string;
  name: string | symbol | undefined;
  customClass?: string[];
};

/** Sidebar item: app menu (no submenu) */
export type SidebarAppEntry = {
  type: "app";
  title: string;
  icon?: Component;
  customClass?: string[];
  click: () => void;
};

/** Sidebar item: app menu with dropdown */
export type SidebarAppDropdownEntry = {
  type: "app-dropdown";
  title: string;
  icon?: Component;
  customClass?: string[];
  menus: { value: string | number; title: string }[];
  // Param name for type semantics only; overlay passes key
  // eslint-disable-next-line no-unused-vars -- type param name
  click: (menuKey: string) => void;
};

export type SidebarEntry =
  | SidebarDividerEntry
  | SidebarRouteEntry
  | SidebarAppEntry
  | SidebarAppDropdownEntry;

export function useHeaderMenus() {
  const { saveGlobalLayoutConfig, resetGlobalLayoutConfig } = useLayoutConfigStore();
  const { containerState, changeDesignMode } = useLayoutContainerStore();
  const { toPage } = useAppRouters();
  const { setTheme } = useAppConfigStore();
  const { state: appTools } = useAppToolsStore();
  const { isAdmin, state: appState, isLogged } = useAppStateStore();
  const { execute } = logoutUser();

  const openNewCardDialog = (): void => {
    containerState.showNewCardDialog = true;
  };

  const handleToPage = (url: string) => {
    containerState.showPhoneMenu = false;
    toPage({ path: url });
  };

  const onClickIcon = () => {
    window.open("https://github.com/MCSManager/MCSManager", "_blank");
  };

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
      .map((r) => ({
        name: r.name,
        path: r.path,
        meta: r.meta,
        customClass: r.meta.customClass ?? []
      }));
  });

  const appMenus = computed(() => {
    return [
      {
        iconText: "",
        title: "GitHub",
        icon: GithubFilled,
        onlyPC: true,
        onlyHeader: true,
        click: onClickIcon
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
        title: t("TXT_CODE_5d88a9b"),
        leftSideTitle: t("TXT_CODE_ee01c10c"),
        icon: BgColorsOutlined,
        click: (key: string) => {
          setTheme(Number(key) as AppTheme);
        },
        conditions: !containerState.isDesignMode,
        onlyPC: false,
        menus: [
          { value: AppTheme.AUTO, title: t("TXT_CODE_dc8de4ff") },
          { value: AppTheme.LIGHT, title: t("TXT_CODE_673eac8e") },
          { value: AppTheme.DARK, title: t("TXT_CODE_5e4a370d") }
        ]
      },
      {
        title: t("TXT_CODE_ebd2a6a1"),
        leftSideTitle: t("TXT_CODE_4eb158da"),
        icon: BuildOutlined,
        click: (): void => {
          Modal.confirm({
            title: t("TXT_CODE_29e85f34"),
            content: t("TXT_CODE_f18f65db"),
            async onOk() {
              changeDesignMode(true);
              notification.warning({
                placement: "bottom",
                type: "warning",
                message: t("TXT_CODE_7b1adf35"),
                description: t("TXT_CODE_6b6f1d3")
              });
            }
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

  /** Sidebar config: route menu + divider + app menu, rendered in one loop */
  const sidebarItems = computed((): SidebarEntry[] => {
    const routeEntries: SidebarRouteEntry[] = menus.value.map((r) => ({
      type: "route",
      path: r.path,
      name: r.name,
      customClass: Array.isArray(r.customClass) ? r.customClass : []
    }));
    const divider: SidebarDividerEntry = { type: "divider" };
    const appEntries: (SidebarAppEntry | SidebarAppDropdownEntry)[] = appMenus.value
      .filter((item) => item.conditions && !item.onlyHeader)
      .map((item) => {
        if (item.menus && item.menus.length > 0) {
          return {
            type: "app-dropdown" as const,
            title: item.leftSideTitle || item.title,
            icon: item.icon,
            customClass: item.customClass,
            menus: item.menus,
            click: item.click as (_: string) => void
          };
        }
        return {
          type: "app" as const,
          title: item.leftSideTitle || item.title,
          icon: item.icon,
          customClass: item.customClass,
          click: item.click as () => void
        };
      });
    return [...routeEntries, divider, ...appEntries];
  });

  return { menus, appMenus, sidebarItems, handleToPage };
}
