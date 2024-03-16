import { v4 } from "uuid";
import { IPageLayoutConfig } from "../../../../common/global";
import { $t as t } from "../i18n";
import storage from "../common/system_storage";
import { GlobalVariable } from "common";
import path from "path";
import fs from "fs-extra";

const LAYOUT_CONFIG_NAME = "layout.json";

export const SAVE_DIR_PATH = "public/upload_files/";

function getRandomId() {
  return v4();
}

export function getFrontendLayoutConfig(): string {
  let layoutConfig: string = "";
  if (storage.fileExists(LAYOUT_CONFIG_NAME)) {
    layoutConfig = storage.readFile(LAYOUT_CONFIG_NAME);
  }
  if (layoutConfig) {
    if (GlobalVariable.get("versionChange")) {
      const latestLayoutConfig = getDefaultFrontendLayoutConfig();
      const currentLayoutConfig = JSON.parse(layoutConfig) as IPageLayoutConfig[];
      for (const page of latestLayoutConfig) {
        if (!currentLayoutConfig.find((item) => item.page === page.page)) {
          currentLayoutConfig.push(page);
        }
      }
      GlobalVariable.set("versionChange", null);
      setFrontendLayoutConfig(currentLayoutConfig);
      return JSON.stringify(currentLayoutConfig);
    }
    return layoutConfig as string;
  } else {
    return JSON.stringify(getDefaultFrontendLayoutConfig());
  }
}

export function setFrontendLayoutConfig(config: IPageLayoutConfig[]) {
  storage.writeFile(LAYOUT_CONFIG_NAME, JSON.stringify(config, null, 2));
}

export function resetFrontendLayoutConfig() {
  storage.deleteFile(LAYOUT_CONFIG_NAME);
  const filesDir = path.join(process.cwd(), SAVE_DIR_PATH);
  if (fs.existsSync(filesDir)) {
    for (const fileName of fs.readdirSync(filesDir)) {
      fs.remove(path.join(filesDir, fileName), () => {});
    }
  }
}

export enum LayoutCardHeight {
  MINI = "100px",
  SMALL = "200px",
  MEDIUM = "400px",
  BIG = "600px",
  LARGE = "800px",
  AUTO = "unset"
}

function getDefaultFrontendLayoutConfig(): IPageLayoutConfig[] {
  return [
    {
      page: "__settings__",
      items: [],
      theme: {
        backgroundImage: ""
      }
    },
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
          title: t("TXT_CODE_ae533703"),
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
          title: t("TXT_CODE_d07742fe"),
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
          title: t("TXT_CODE_1c45f7fe"),
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
      page: "/instances/schedule",
      items: [
        {
          id: getRandomId(),
          meta: {},
          type: "Schedule",
          title: t("TXT_CODE_b7d026f8"),
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
          title: t("TXT_CODE_97d17cce"),
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
      page: "/users/resources",
      items: [
        {
          id: getRandomId(),
          meta: {},
          type: "UserAccessSettings",
          title: t("TXT_CODE_eb579d63"),
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
          title: t("TXT_CODE_3fe97dcc"),
          width: 8,
          height: LayoutCardHeight.LARGE,
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
          title: t("TXT_CODE_e6c30866"),
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
          title: t("TXT_CODE_3d09f0ac"),
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
          title: t("TXT_CODE_7411336e"),
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
          title: t("TXT_CODE_f912fadc"),
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
          title: t("TXT_CODE_15f2e564"),
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
          title: t("TXT_CODE_342a04a9"),
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
          title: t("TXT_CODE_d655beec"),
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
      page: "/login",
      items: [
        {
          id: getRandomId(),
          meta: {},
          type: "LoginCard",
          title: t("TXT_CODE_ccb60658"),
          width: 4,
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
          title: t("TXT_CODE_6aa286df"),
          width: 6,
          height: LayoutCardHeight.MINI,
          disableDelete: true
        }
      ]
    },
    {
      page: "/_open_page",
      items: [
        {
          id: getRandomId(),
          meta: {},
          type: "DefaultCard",
          title: t("TXT_CODE_463375d2"),
          width: 6,
          height: LayoutCardHeight.SMALL
        }
      ]
    }
  ];
}
