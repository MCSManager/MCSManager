import { t } from "@/lang/i18n";
import { remoteNodeList } from "@/services/apis";
import { arrayFilter } from "@/tools/array";
import type { LayoutCard } from "@/types";
import {
  AppstoreAddOutlined,
  AppstoreOutlined,
  AppstoreTwoTone,
  CalculatorTwoTone,
  DatabaseTwoTone,
  IdcardTwoTone,
  NodeIndexOutlined,
  ShoppingCartOutlined,
  TransactionOutlined
} from "@ant-design/icons-vue";
import { computed, onMounted, reactive, ref, type FunctionalComponent } from "vue";

export enum QUICKSTART_ACTION_TYPE {
  Minecraft = "Minecraft",
  SteamGameServer = "SteamGameServer",
  AnyApp = "AnyApp"
}

export enum QUICKSTART_METHOD {
  FAST = "FAST",
  IMPORT = "IMPORT",
  SELECT = "SELECT"
}

export function useQuickStartFlow() {
  const { state: remoteNodes, execute, isReady, isLoading } = remoteNodeList();

  const currentIcon = ref<FunctionalComponent>(AppstoreTwoTone);

  interface ActionButtons {
    title: string;
    key: string;
    icon: any;
  }

  const step1: ActionButtons[] = [
    {
      title: "Minecraft 游戏服务器",
      key: QUICKSTART_ACTION_TYPE.Minecraft,
      icon: AppstoreAddOutlined
    },
    {
      title: "Steam 游戏服务器",
      key: QUICKSTART_ACTION_TYPE.SteamGameServer,
      icon: ShoppingCartOutlined
    },
    {
      title: "部署任何控制台可执行程序",
      key: QUICKSTART_ACTION_TYPE.AnyApp,
      icon: TransactionOutlined
    }
  ];

  const formData = reactive<{
    title: string;
    step: number;
    actions?: ActionButtons[];
    appType?: QUICKSTART_ACTION_TYPE;
    createMethod?: QUICKSTART_METHOD;
  }>({
    title: t("您想部署一个什么应用程序？"),
    step: 1,
    actions: step1
  });

  const toStep2 = async (appType: QUICKSTART_ACTION_TYPE) => {
    formData.step = 2;
    formData.appType = appType;
    currentIcon.value = DatabaseTwoTone;
    await execute();
    formData.actions = remoteNodes.value?.map((v) => {
      return {
        title: `${v.ip}:${v.port} (${v.remarks})`,
        key: v.uuid,
        icon: NodeIndexOutlined
      };
    });
    formData.title = t("新的程序部署在哪台机器？");
  };

  const toStep3 = () => {
    formData.step = 3;
    formData.title = t("请选择部署应用程序的方式？");
    currentIcon.value = CalculatorTwoTone;
    formData.actions = arrayFilter<ActionButtons>([
      {
        title: "Minecraft 快速部署",
        key: QUICKSTART_METHOD.FAST,
        icon: AppstoreAddOutlined,
        condition: () => formData.appType === QUICKSTART_ACTION_TYPE.Minecraft
      },
      {
        title: "上传服务端文件压缩包",
        key: QUICKSTART_METHOD.IMPORT,
        icon: ShoppingCartOutlined
      },
      {
        title: "选择服务器现有目录",
        key: QUICKSTART_METHOD.SELECT,
        icon: TransactionOutlined
      },
      {
        title: "无需额外文件",
        key: QUICKSTART_METHOD.SELECT,
        icon: TransactionOutlined
      }
    ]);
  };

  const toStep4 = (key: QUICKSTART_METHOD) => {
    formData.step = 4;
    formData.createMethod = key;
    currentIcon.value = IdcardTwoTone;
  };

  const isFormStep = computed(() => {
    return formData.step === 4;
  });

  const isNormalStep = computed(() => {
    return formData.step < 4;
  });

  return {
    formData,
    toStep2,
    toStep3,
    toStep4,
    isReady,
    isLoading,
    isFormStep,
    isNormalStep,
    currentIcon
  };
}
