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
  breadcrumbs?: Array<{
    name: string;
    path: string;
    mainMenu?: boolean;
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

let originRouterConfig: RouterConfig[] = [
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: {
      permission: ROLE.GUEST,
      mainMenu: false
    }
  },
  {
    path: "/init",
    name: "init",
    component: InstallPage,
    meta: {
      permission: ROLE.GUEST,
      mainMenu: false
    }
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
        path: "/instances/terminal",
        name: t("TXT_CODE_524e3036"),
        component: LayoutContainer,
        meta: {
          permission: ROLE.USER
        },
        children: [
          {
            path: "/instances/terminal/files",
            name: t("TXT_CODE_ae533703"),
            component: LayoutContainer,
            meta: {
              permission: ROLE.USER
            }
          },
          {
            path: "/instances/terminal/serverConfig",
            name: t("TXT_CODE_d07742fe"),
            component: LayoutContainer,
            meta: {
              permission: ROLE.USER
            },
            children: [
              {
                path: "/instances/terminal/serverConfig/fileEdit",
                name: t("编辑配置文件"),
                component: LayoutContainer,
                meta: {
                  permission: ROLE.USER
                }
              }
            ]
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
        path: "/users/config",
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
        name: t("镜像管理"),
        component: LayoutContainer,
        meta: {
          permission: ROLE.ADMIN,
          mainMenu: false
        },
        children: [
          {
            path: "/node/image/new",
            name: t("创建镜像"),
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
    path: "/customer",
    name: t("我的应用"),
    component: LayoutContainer,
    meta: {
      permission: ROLE.USER,
      mainMenu: true
    }
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
    name: "404",
    component: LayoutContainer,
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
        name: t("创建 Minecraft 实例"),
        component: LayoutContainer,
        meta: {
          permission: ROLE.ADMIN
        }
      }
    ]
  }
];

function routersConfigOptimize(
  config: RouterConfig[],
  list: Array<{ name: string; path: string }> = []
) {
  for (const r of config) {
    r.meta.breadcrumbs = list;
    if (r.children && r.children instanceof Array) {
      const newList = JSON.parse(JSON.stringify(list));
      newList.push({ name: r.name, path: r.path, mainMenu: r.meta.mainMenu });
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
  const permission = state.userInfo?.permission ?? 0;
  if (Number(to.meta.permission ?? 0) <= permission) {
    next();
  } else {
    next("/404");
  }
});

export { originRouterConfig, router };
