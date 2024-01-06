import { createRouter, createWebHashHistory, type Router, type RouteRecordRaw } from "vue-router";
import LayoutContainer from "@/views/LayoutContainer.vue";
import { $t as t } from "@/lang/i18n";
import LoginPage from "@/views/Login.vue";
import InstallPage from "@/views/Install.vue";
import { useAppStateStore } from "@/stores/useAppStateStore";

export interface RouterMetaInfo {
  icon?: string;
  mainMenu?: boolean;
  permission?: number;
  redirect?: string;
  onlyDisplayEditMode?: boolean;
  breadcrumbs?: Array<{
    name: string;
    path: string;
    mainMenu?: boolean;
    permission: number;
  }>;
}

export interface RouterConfig {
  path: string;
  name: string;
  component?: any;
  children?: RouterConfig[];
  meta: RouterMetaInfo;
}

export enum ROLE {
  ADMIN = 10,
  USER = 1,
  GUEST = 0
}

const originRouterConfig: RouterConfig[] = [
  {
    path: "/install",
    name: t("TXT_CODE_82d650be"),
    component: InstallPage,
    meta: {
      permission: ROLE.GUEST,
      mainMenu: false
    }
  },
  {
    path: "/quickstart",
    name: t("TXT_CODE_2799a1dd"),
    component: LayoutContainer,
    meta: {
      permission: ROLE.ADMIN,
      mainMenu: false
    },
    children: [
      {
        path: "/quickstart/minecraft",
        name: t("TXT_CODE_8d8b1d6a"),
        component: LayoutContainer,
        meta: {
          permission: ROLE.ADMIN
        }
      }
    ]
  },
  {
    path: "/",
    name: t("TXT_CODE_16d71239"),
    component: LayoutContainer,
    meta: {
      mainMenu: true,
      permission: ROLE.ADMIN
    }
  },
  {
    path: "/instances",
    name: t("TXT_CODE_e21473bc"),
    component: LayoutContainer,
    meta: {
      mainMenu: true,
      permission: ROLE.ADMIN
    },
    children: [
      {
        path: `/instances/terminal`,
        name: t("TXT_CODE_524e3036"),
        component: LayoutContainer,
        meta: {
          permission: ROLE.USER
        },
        children: [
          {
            path: `/instances/terminal/files`,
            name: t("TXT_CODE_ae533703"),
            component: LayoutContainer,
            meta: {
              permission: ROLE.USER
            }
          },
          {
            path: `/instances/terminal/serverConfig`,
            name: t("TXT_CODE_d07742fe"),
            component: LayoutContainer,
            meta: {
              permission: ROLE.USER
            },
            children: [
              {
                path: `/instances/terminal/serverConfig/fileEdit`,
                name: t("TXT_CODE_78019c60"),
                component: LayoutContainer,
                meta: {
                  permission: ROLE.USER
                }
              }
            ]
          },
          {
            path: `/instances/schedule`,
            name: t("TXT_CODE_b7d026f8"),
            component: LayoutContainer,
            meta: {
              permission: ROLE.USER
            }
          }
        ]
      }
    ]
  },
  {
    path: "/users",
    name: t("TXT_CODE_1deaa2dd"),
    component: LayoutContainer,
    meta: {
      mainMenu: true,
      permission: ROLE.ADMIN
    },
    children: [
      {
        path: "/users/resources",
        name: t("TXT_CODE_236f70aa"),
        component: LayoutContainer,
        meta: {
          permission: ROLE.ADMIN
        }
      }
    ]
  },
  {
    path: "/node",
    name: t("TXT_CODE_e076d90b"),
    component: LayoutContainer,
    meta: {
      permission: ROLE.ADMIN,
      mainMenu: true
    },
    children: [
      {
        path: "/node/image",
        name: t("TXT_CODE_e6c30866"),
        component: LayoutContainer,
        meta: {
          permission: ROLE.ADMIN,
          mainMenu: false
        },
        children: [
          {
            path: "/node/image/new",
            name: t("TXT_CODE_3d09f0ac"),
            component: LayoutContainer,
            meta: {
              permission: ROLE.ADMIN,
              mainMenu: false
            }
          }
        ]
      }
    ]
  },

  {
    path: "/settings",
    name: t("TXT_CODE_b5c7b82d"),
    component: LayoutContainer,
    meta: {
      permission: ROLE.ADMIN,
      mainMenu: true
    }
  },
  {
    path: "/user",
    name: t("TXT_CODE_8c3164c9"),
    component: LayoutContainer,
    meta: {
      permission: ROLE.ADMIN,
      mainMenu: false
    }
  },
  {
    path: "/404",
    name: t("TXT_CODE_393c816c"),
    component: LayoutContainer,
    meta: {
      permission: ROLE.GUEST,
      mainMenu: false
    }
  },
  {
    path: "/customer",
    name: t("TXT_CODE_ec299306"),
    component: LayoutContainer,
    meta: {
      permission: ROLE.USER,
      mainMenu: true,
      onlyDisplayEditMode: true
    }
  },
  {
    path: "/login",
    name: t("TXT_CODE_24873a8a"),
    component: LoginPage,
    meta: {
      permission: ROLE.GUEST,
      onlyDisplayEditMode: true
    }
  },
  {
    path: "/_open_page",
    name: t("TXT_CODE_2cf59872"),
    component: LayoutContainer,
    meta: {
      permission: ROLE.ADMIN, // open page without permission
      mainMenu: true,
      onlyDisplayEditMode: true
    }
  }
];

function routersConfigOptimize(
  config: RouterConfig[],
  list: Array<{ name: string; path: string; permission: number }> = []
) {
  for (const r of config) {
    r.meta.breadcrumbs = list;
    if (r.children && r.children instanceof Array) {
      const newList = JSON.parse(JSON.stringify(list));
      newList.push({
        name: r.name,
        path: r.path,
        mainMenu: r.meta.mainMenu,
        permission: r.meta.permission
      });
      routersConfigOptimize(r.children, newList);
    }
  }
  return config;
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: routersConfigOptimize(originRouterConfig) as RouteRecordRaw[]
});

router.beforeEach((to, from, next) => {
  const { state } = useAppStateStore();
  const userPermission = state.userInfo?.permission ?? 0;
  const toPagePermission = Number(to.meta.permission ?? 0);
  const fromRoutePath = router.currentRoute.value.path.trim();
  const toRoutePath = to.path.trim();
  console.info(
    "Router Changed:",
    fromRoutePath,
    "->",
    toRoutePath,
    "\nMyPermission:",
    userPermission,
    "toPagePermission:",
    toPagePermission
  );

  if (toRoutePath.includes("_open_page") || ["/login", "/install", "/404"].includes(toRoutePath)) {
    return next();
  }

  if (!state.isInstall) {
    return next("/install");
  }

  if (!to.name) return next("/404");

  if (!state.userInfo?.token) return next("/login");

  if (toPagePermission > userPermission && userPermission !== ROLE.ADMIN) {
    return next("/customer");
  }

  if (toPagePermission <= userPermission) {
    next();
  } else {
    next("/404");
  }
});

export { originRouterConfig, router };
