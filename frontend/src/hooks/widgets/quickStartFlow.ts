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
  TransactionOutlined,
  SmileTwoTone,
  CodeOutlined,
  FolderOpenOutlined,
  HomeOutlined
} from "@ant-design/icons-vue";
import { computed, onMounted, reactive, ref, type FunctionalComponent } from "vue";
import { router } from "@/config/router";

export enum QUICKSTART_ACTION_TYPE {
  Minecraft = "Minecraft",
  Bedrock = "Bedrock",
  SteamGameServer = "SteamGameServer",
  AnyApp = "AnyApp"
}

export enum QUICKSTART_METHOD {
  FAST = "FAST",
  IMPORT = "IMPORT",
  SELECT = "SELECT",
  EXIST = "EXIST"
}

export function useQuickStartFlow() {
  const { state: remoteNodes, execute, isReady, isLoading } = remoteNodeList();

  const currentIcon = ref<FunctionalComponent>(AppstoreTwoTone);

  interface ActionButtons {
    title: string;
    key: string;
    icon: any;
    click?: () => void;
  }

  const step1: ActionButtons[] = [
    {
      title: t("Minecraft Java版游戏服务器"),
      key: QUICKSTART_ACTION_TYPE.Minecraft,
      icon: AppstoreAddOutlined
    },
    {
      title: t("Minecraft 基岩版游戏服务器"),
      key: QUICKSTART_ACTION_TYPE.Bedrock,
      icon: AppstoreAddOutlined
    },
    {
      title: t("Steam 游戏服务器"),
      key: QUICKSTART_ACTION_TYPE.SteamGameServer,
      icon: ShoppingCartOutlined
    },
    {
      title: t("部署任何控制台可执行程序"),
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
    remoteUuid?: string;
  }>({
    title: t("您想部署一个什么应用实例？"),
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

  const toStep3 = (remoteUuid: string) => {
    formData.step = 3;
    formData.title = t("请选择部署应用实例的方式？");
    formData.remoteUuid = remoteUuid;
    currentIcon.value = CalculatorTwoTone;
    formData.actions = arrayFilter<ActionButtons>([
      {
        title: t("Minecraft 快速部署"),
        key: QUICKSTART_METHOD.FAST,
        icon: AppstoreAddOutlined,
        condition: () =>
          formData.appType === QUICKSTART_ACTION_TYPE.Minecraft ||
          formData.appType === QUICKSTART_ACTION_TYPE.Bedrock
      },
      {
        title: t("上传服务端文件压缩包"),
        key: QUICKSTART_METHOD.IMPORT,
        icon: ShoppingCartOutlined
      },
      {
        title: t("选择服务器现有目录"),
        key: QUICKSTART_METHOD.SELECT,
        icon: TransactionOutlined
      },
      {
        title: t("无需额外文件"),
        key: QUICKSTART_METHOD.EXIST,
        icon: TransactionOutlined
      }
    ]);
  };

  const toStep4 = (key: QUICKSTART_METHOD) => {
    formData.step = 4;
    formData.createMethod = key;
    currentIcon.value = IdcardTwoTone;
  };

  const toStep5 = (instanceId?: string) => {
    formData.step = 5;
    formData.title = t("恭喜，实例创建成功");
    currentIcon.value = SmileTwoTone;

    formData.actions = arrayFilter<ActionButtons>([
      {
        title: t("前往实例控制台"),
        key: "console",
        icon: CodeOutlined,
        click: () => {
          const daemonId = formData.remoteUuid;
          router.push({
            path: "/instances/terminal",
            query: {
              daemonId,
              instanceId
            }
          });
        }
      },
      {
        title: t("前往实例文件管理"),
        key: "files",
        icon: FolderOpenOutlined,
        click: () => {
          const daemonId = formData.remoteUuid;
          router.push({
            path: "/instances/terminal/files",
            query: {
              daemonId,
              instanceId
            }
          });
        }
      },
      {
        title: t("返回面板首页"),
        key: "main",
        icon: HomeOutlined,
        click: () => {
          router.push({
            path: "/"
          });
        }
      }
    ]);
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
    toStep5,
    isReady,
    isLoading,
    isFormStep,
    isNormalStep,
    currentIcon
  };
}
