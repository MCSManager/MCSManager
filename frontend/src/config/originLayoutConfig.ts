/* eslint-disable no-unused-vars */
import { $t as t } from "@/lang/i18n";
import { getRandomId } from "@/tools/randId";
import type { JsonData, LayoutCard } from "@/types";

export enum LayoutCardHeight {
  MINI = "100px",
  SMALL = "200px",
  MEDIUM = "400px",
  BIG = "600px",
  LARGE = "800px",
  AUTO = "unset"
}

export interface PageLayoutConfig {
  page: string;
  items: LayoutCard[];
}

export function setAllLayoutConfig(cfg: PageLayoutConfig[]) {
  console.debug("设置布局配置：", cfg);
  ORIGIN_LAYOUT_CONFIG = cfg;
}

export function getAllLayoutConfig() {
  return ORIGIN_LAYOUT_CONFIG;
}

// 在 Web 端没有返回用户自定义布局时，使用默认的布局。
// 这里是所有不同页面的默认的布局配置
export let ORIGIN_LAYOUT_CONFIG: PageLayoutConfig[] = [
  {
    page: "/",
    items: [
      {
        id: getRandomId(),
        type: "StatusBlock",
        title: t("TXT_CODE_e627e546"),
        meta: {
          type: "node"
        },
        width: 3,
        description: t("TXT_CODE_55ade942"),
        height: LayoutCardHeight.SMALL
      },
      {
        id: getRandomId(),
        type: "StatusBlock",
        title: t("TXT_CODE_88e9361a"),
        meta: {
          type: "instance"
        },
        width: 3,
        description: t("TXT_CODE_55ade942"),
        height: LayoutCardHeight.SMALL
      },
      {
        id: getRandomId(),
        type: "StatusBlock",
        title: t("TXT_CODE_db64faf6"),
        meta: {
          type: "users"
        },
        width: 3,
        description: t("TXT_CODE_55ade942"),
        height: LayoutCardHeight.SMALL
      },
      {
        id: getRandomId(),
        type: "StatusBlock",
        title: t("TXT_CODE_66056676"),
        meta: {
          type: "system"
        },
        width: 3,
        description: t("TXT_CODE_55ade942"),
        height: LayoutCardHeight.SMALL
      },
      {
        id: getRandomId(),
        meta: {},
        type: "DataOverview",
        title: t("TXT_CODE_721157a3"),
        width: 9,
        description: t("TXT_CODE_55ade942"),
        height: LayoutCardHeight.MEDIUM
      },
      {
        id: getRandomId(),
        meta: {},
        type: "QuickStart",
        title: t("TXT_CODE_2799a1dd"),
        width: 3,
        description: t("TXT_CODE_55ade942"),
        height: LayoutCardHeight.MEDIUM
      },
      {
        id: getRandomId(),
        meta: {},
        type: "RequestChart",
        title: t("TXT_CODE_a4037a98"),
        width: 6,
        description: t("TXT_CODE_55ade942"),
        height: LayoutCardHeight.SMALL
      },
      {
        id: getRandomId(),
        meta: {},
        type: "InstanceChart",
        title: t("TXT_CODE_d6d9c42c"),
        width: 6,
        description: t("TXT_CODE_55ade942"),
        height: LayoutCardHeight.SMALL
      },
      {
        id: getRandomId(),
        meta: {},
        type: "NodeOverview",
        title: t("TXT_CODE_bfb50126"),
        width: 12,
        description: t("TXT_CODE_55ade942"),
        height: LayoutCardHeight.MEDIUM
      }
    ]
  },
  {
    page: "/instances",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "InstanceList",
        title: t("TXT_CODE_e21473bc"),
        width: 12,
        height: LayoutCardHeight.AUTO,
        disableDelete: true
      },
      {
        id: getRandomId(),
        meta: {},
        type: "EmptyCard",
        title: "",
        width: 12,
        height: LayoutCardHeight.MINI
      }
    ]
  },
  {
    page: "/instances/terminal",
    items: [
      {
        id: getRandomId(),
        meta: {
          viewType: "inner"
        },
        type: "Terminal",
        title: t("TXT_CODE_4ccdd3a0"),
        width: 12,
        height: LayoutCardHeight.BIG,
        disableDelete: true
      },

      {
        id: getRandomId(),
        meta: {},
        type: "InstanceBaseInfo",
        title: t("TXT_CODE_eadb4f60"),
        width: 4,
        height: LayoutCardHeight.SMALL
      },
      {
        id: getRandomId(),
        meta: {},
        type: "InstanceManagerBtns",
        title: t("TXT_CODE_efd37c48"),
        width: 8,
        height: LayoutCardHeight.SMALL,
        disableDelete: true
      }
    ]
  },
  {
    page: "/instances/terminal/files",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "InstanceFileManager",
        title: t("文件管理"),
        width: 12,
        height: LayoutCardHeight.AUTO,
        disableDelete: true
      },
      {
        id: getRandomId(),
        meta: {},
        type: "EmptyCard",
        title: "",
        width: 12,
        height: LayoutCardHeight.MINI
      }
    ]
  },
  {
    page: "/instances/terminal/serverConfig",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "InstanceServerConfigOverview",
        title: t("服务端配置文件"),
        width: 12,
        height: LayoutCardHeight.AUTO,
        disableDelete: true
      },
      {
        id: getRandomId(),
        meta: {},
        type: "EmptyCard",
        title: "",
        width: 12,
        height: LayoutCardHeight.MINI
      }
    ]
  },
  {
    page: "/instances/terminal/serverConfig/fileEdit",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "InstanceServerConfigFile",
        title: t("编辑服务端配置文件"),
        width: 12,
        height: LayoutCardHeight.AUTO,
        disableDelete: true
      },
      {
        id: getRandomId(),
        meta: {},
        type: "EmptyCard",
        title: "",
        width: 12,
        height: LayoutCardHeight.MINI
      }
    ]
  },
  {
    page: "/users",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "UserList",
        title: t("用户列表"),
        width: 12,
        height: LayoutCardHeight.AUTO,
        disableDelete: true
      },
      {
        id: getRandomId(),
        meta: {},
        type: "EmptyCard",
        title: "",
        width: 12,
        height: LayoutCardHeight.MINI
      }
    ]
  },
  {
    page: "/users/config",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "UserAccessSettings",
        title: t("用户权限设定"),
        width: 12,
        height: LayoutCardHeight.AUTO,
        disableDelete: true
      },
      {
        id: getRandomId(),
        meta: {},
        type: "EmptyCard",
        title: "",
        width: 12,
        height: LayoutCardHeight.MINI
      }
    ]
  },
  {
    page: "/settings",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "Settings",
        title: t("系统设置"),
        width: 8,
        height: LayoutCardHeight.MEDIUM,
        disableDelete: true
      }
    ]
  },
  {
    page: "/node",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "NodeList",
        title: t("TXT_CODE_20509fa0"),
        width: 12,
        height: LayoutCardHeight.AUTO,
        disableDelete: true
      },
      {
        id: getRandomId(),
        meta: {},
        type: "EmptyCard",
        title: "",
        width: 12,
        height: LayoutCardHeight.MINI
      }
    ]
  },
  {
    page: "/node/image",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "ImageManager",
        title: t("镜像管理"),
        width: 12,
        height: LayoutCardHeight.AUTO,
        disableDelete: true
      },
      {
        id: getRandomId(),
        meta: {},
        type: "EmptyCard",
        title: "",
        width: 12,
        height: LayoutCardHeight.MINI
      }
    ]
  },
  {
    page: "/node/image/new",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "NewImage",
        title: t("创建镜像"),
        width: 12,
        height: LayoutCardHeight.AUTO,
        disableDelete: true
      },
      {
        id: getRandomId(),
        meta: {},
        type: "EmptyCard",
        title: "",
        width: 12,
        height: LayoutCardHeight.MINI
      }
    ]
  },
  {
    page: "/quickstart",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "QuickStartFlow",
        title: t("TXT_CODE_9b99b72e"),
        width: 8,
        height: LayoutCardHeight.AUTO
      }
    ]
  },
  {
    page: "/quickstart/minecraft",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "McPreset",
        title: "",
        width: 12,
        height: LayoutCardHeight.AUTO
      },
      {
        id: getRandomId(),
        meta: {},
        type: "EmptyCard",
        title: "",
        width: 12,
        height: LayoutCardHeight.MINI
      }
    ]
  },
  {
    page: "/customer",
    items: [
      {
        id: getRandomId(),
        type: "UserStatusBlock",
        title: t("实例总计"),
        meta: {
          type: "instance_all"
        },
        width: 3,
        height: LayoutCardHeight.SMALL,
        disableDelete: true
      },
      {
        id: getRandomId(),
        type: "UserStatusBlock",
        title: t("正在运行"),
        meta: {
          type: "instance_running"
        },
        width: 3,
        height: LayoutCardHeight.SMALL,
        disableDelete: true
      },
      {
        id: getRandomId(),
        type: "UserStatusBlock",
        title: t("未运行"),
        meta: {
          type: "instance_stop"
        },
        width: 3,
        height: LayoutCardHeight.SMALL,
        disableDelete: true
      },
      {
        id: getRandomId(),
        type: "UserStatusBlock",
        title: t("维护中"),
        meta: {
          type: "instance_error"
        },
        width: 3,
        height: LayoutCardHeight.SMALL,
        disableDelete: true
      },
      {
        id: getRandomId(),
        type: "UserInstanceList",
        title: t("实例列表"),
        meta: {
          type: "instance_error"
        },
        width: 12,
        height: LayoutCardHeight.AUTO,
        disableDelete: true
      }
    ]
  },

  {
    page: "/404",
    items: [
      {
        id: getRandomId(),
        meta: {},
        type: "Page404",
        title: t("页面未找到"),
        width: 6,
        height: LayoutCardHeight.MINI,
        disableDelete: true
      }
    ]
  }
];
