import EmptyCard from "@/widgets/EmptyCard.vue";
import ExampleCard from "@/widgets/ExampleCard.vue";
import ExampleCard2 from "@/widgets/ExampleCard2.vue";
import ExampleCard3 from "@/widgets/ExampleCard3.vue";
import ExampleCard4 from "@/widgets/ExampleCard4.vue";
import { getRandomId } from "@/tools/randId";
import type { LayoutCard } from "@/types";
import { LayoutCardHeight } from "./originLayoutConfig";
import DataOverview from "@/widgets/PanelOverview.vue";
import StatusBlock from "@/widgets/StatusBlock.vue";
import { t } from "@/lang/i18n";
import NodeOverview from "@/widgets/NodeOverview.vue";
import QuickStart from "@/widgets/QuickStart.vue";
import RequestChart from "@/widgets/RequestChart.vue";
import InstanceChart from "@/widgets/InstanceChart.vue";
import InstanceList from "@/widgets/InstanceList.vue";
import NodeList from "@/widgets/NodeList.vue";
import Settings from "@/widgets/Settings.vue";
import UserList from "@/widgets/UserList.vue";
import Terminal from "@/widgets/instance/Terminal.vue";
import InstanceManagerBtns from "@/widgets/instance/ManagerBtns.vue";
import InstanceBaseInfo from "@/widgets/instance/BaseInfo.vue";
import InstanceServerConfigOverview from "@/widgets/instance/ServerConfigOverview.vue";
import InstanceFileManager from "@/widgets/instance/FileManager.vue";
import UserAccessSettings from "@/widgets/user/AccessSettings.vue";
import UserInfo from "@/widgets/user/BaseInfo.vue";
import ImageBox from "@/widgets/others/ImageBox.vue";
import TextCard from "@/widgets/others/TextCard.vue";
import LinkCard from "@/widgets/others/LinkCard.vue";
import QuickStartFlow from "@/widgets/setupApp/QuickStartFlow.vue";
import IframeCard from "@/widgets/others/IframeCard.vue";

import { NEW_CARD_TYPE } from "../types/index";

// Register specified Vue components for each card.
export const LAYOUT_CARD_TYPES: { [key: string]: any } = {
  ExampleCard,
  ExampleCard2,
  ExampleCard3,
  ExampleCard4,
  EmptyCard,
  DataOverview,
  StatusBlock,
  QuickStart,
  NodeOverview,
  RequestChart,
  InstanceChart,
  InstanceList,
  NodeList,
  Settings,
  UserList,
  Terminal,
  InstanceManagerBtns,
  InstanceBaseInfo,
  InstanceServerConfigOverview,
  InstanceFileManager,
  UserAccessSettings,
  UserInfo,
  ImageBox,
  QuickStartFlow,
  IframeCard,
  TextCard,
  LinkCard,
};

export interface NewCardItem extends LayoutCard {
  category: NEW_CARD_TYPE;
}

// For create new card∂
export function getLayoutCardPool() {
  const LAYOUT_CARD_POOL: NewCardItem[] = [
    // 占位卡片
    {
      id: getRandomId(),
      meta: {},
      type: "EmptyCard",
      title: "占位卡片",
      width: 2,
      description: "此卡片没有任何内容，可以用来占位，实现居中等排版需求。",
      height: LayoutCardHeight.MINI,
      category: NEW_CARD_TYPE.OTHER,
    },

    // 只展示到个人资料的卡片（但是不推荐这样用）
    {
      id: getRandomId(),
      meta: {},
      type: "ExampleCard2",
      title: "个人资料的卡片",
      width: 6,
      onlyPath: ["/user"],
      description: "这个卡片只能在「个人资料」这种界面出现，不能在其他场景使用。",
      height: LayoutCardHeight.MEDIUM,
      category: NEW_CARD_TYPE.USER,
    },

    // 一个新增时要求设置参数的卡片
    {
      id: getRandomId(),
      type: "Terminal",
      title: "实例控制台",
      width: 6,
      description: "用于显示和交互某个实例的控制台。",
      height: LayoutCardHeight.BIG,
      category: NEW_CARD_TYPE.INSTANCE,

      // 新增卡片时被要求填写的参数
      meta: {},
      params: [
        {
          field: "instanceId",
          label: "实例 ID",
          type: "string",
        },
        {
          field: "daemonId",
          label: "节点 ID",
          type: "string",
        },
      ],
    },

    {
      id: getRandomId(),
      type: "StatusBlock",
      title: t("节点在线数444"),
      meta: {
        title: "在线节点 / 总节点",
        type: "node",
      },
      width: 3,
      description: t("用于显示面板的所有基本数据"),
      height: LayoutCardHeight.SMALL,
      category: NEW_CARD_TYPE.COMMON,
    },

    // 一个正常的卡片
    {
      id: getRandomId(),
      meta: {},
      type: "Settings",
      title: "设置",
      width: 4,
      description: "卡片的详细说明以及使用方式。",
      height: LayoutCardHeight.SMALL,
      category: NEW_CARD_TYPE.COMMON,
    },

    // 一个多个项目组合一起的卡片
    {
      id: getRandomId(),
      meta: {},
      type: "ExampleCard",
      title: "多项目卡片",
      width: 12,
      description: "卡片的详细说明以及使用方式。",
      height: LayoutCardHeight.SMALL,
      category: NEW_CARD_TYPE.INSTANCE,
    },

    // 包含上下布局的卡片
    {
      id: getRandomId(),
      meta: {},
      type: "ExampleCard3",
      title: "上下布局的卡片",
      width: 6,
      description: "卡片的详细说明以及使用方式。",
      height: LayoutCardHeight.MEDIUM,
      category: NEW_CARD_TYPE.COMMON,
    },

    // 图片卡片
    {
      id: getRandomId(),
      meta: {},
      type: "ImageBox",
      title: t("图片框"),
      width: 4,
      description: t("可以用来显示图片"),
      height: LayoutCardHeight.SMALL,
      category: NEW_CARD_TYPE.OTHER,
    },

    // iframe卡片
    {
      id: getRandomId(),
      meta: {},
      type: "IframeCard",
      title: t("内嵌网页框"),
      width: 4,
      description: t("可以用来显示外部网站"),
      height: LayoutCardHeight.SMALL,
      category: NEW_CARD_TYPE.OTHER,
    },

    // 自定义文本卡片
    {
      id: getRandomId(),
      meta: {},
      type: "TextCard",
      title: t("自定义文本框"),
      width: 4,
      description: t("显示指定文本，支持 Markdown 语法"),
      height: LayoutCardHeight.SMALL,
      category: NEW_CARD_TYPE.OTHER,
    },

    // 超链接块卡片
    {
      id: getRandomId(),
      meta: {},
      type: "LinkCard",
      title: t("超链接块"),
      width: 4,
      description: t("显示一组自定义超链接按钮"),
      height: LayoutCardHeight.SMALL,
      category: NEW_CARD_TYPE.OTHER,
    },
  ];
  return LAYOUT_CARD_POOL;
}
