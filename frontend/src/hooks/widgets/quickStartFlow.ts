import { t } from "@/lang/i18n";
import { remoteNodeList } from "@/services/apis";
import { arrayFilter } from "@/tools/array";
import {
  AppstoreAddOutlined,
  AppstoreTwoTone,
  CalculatorTwoTone,
  DatabaseTwoTone,
  IdcardTwoTone,
  NodeIndexOutlined,
  ShoppingCartOutlined,
  CloudUploadOutlined,
  FileZipOutlined,
  FileExcelOutlined,
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
  Terraria = "Terraria",
  SteamGameServer = "SteamGameServer",
  Docker = "Docker",
  AnyApp = "AnyApp"
}

export enum QUICKSTART_METHOD {
  FAST = "FAST",
  FILE = "FILE",
  IMPORT = "IMPORT",
  SELECT = "SELECT",
  EXIST = "EXIST",
  DOCKER = "DOCKER"
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
      title: t("TXT_CODE_9e3f25e0"),
      key: QUICKSTART_ACTION_TYPE.Minecraft,
      icon: AppstoreAddOutlined
    },
    {
      title: t("TXT_CODE_c8261c85"),
      key: QUICKSTART_ACTION_TYPE.Bedrock,
      icon: AppstoreAddOutlined
    },
    {
      title: t("TXT_CODE_dbefcc6c"),
      key: QUICKSTART_ACTION_TYPE.Terraria,
      icon: AppstoreAddOutlined
    },

    {
      title: t("TXT_CODE_dd8d27ce"),
      key: QUICKSTART_ACTION_TYPE.SteamGameServer,
      icon: ShoppingCartOutlined
    },
    {
      title: t("TXT_CODE_e08e63b5"),
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
    daemonId?: string;
    emptyActionsText?: string;
    emptyActionsLink?: string;
  }>({
    title: t("TXT_CODE_724ce74d"),
    step: 1,
    actions: step1
  });

  const toStep2 = async (appType: QUICKSTART_ACTION_TYPE, daemonId?: string) => {
    formData.appType = appType;

    if (daemonId) {
      toStep3(daemonId);
      return;
    }

    formData.step = 2;
    formData.emptyActionsText = t("TXT_CODE_9337bed1");
    currentIcon.value = DatabaseTwoTone;
    await execute();
    formData.actions = remoteNodes.value
      ?.filter((v) => v.available)
      ?.map((v) => {
        return {
          title: `${v.ip}:${v.port} (${v.remarks})`,
          key: v.uuid,
          icon: NodeIndexOutlined
        };
      });

    formData.title = t("TXT_CODE_d182c422");
  };

  const toStep3 = (daemonId: string) => {
    formData.step = 3;
    formData.title = t("TXT_CODE_49981cb9");
    formData.daemonId = daemonId;
    currentIcon.value = CalculatorTwoTone;
    formData.actions = arrayFilter<ActionButtons>([
      {
        title: t("TXT_CODE_266b7246"),
        key: QUICKSTART_METHOD.FAST,
        icon: AppstoreAddOutlined,
        condition: () =>
          formData.appType === QUICKSTART_ACTION_TYPE.Minecraft ||
          formData.appType === QUICKSTART_ACTION_TYPE.Bedrock,
        click: () => {
          router.push({
            path: "/quickstart/minecraft",
            query: {
              daemonId
            }
          });
        }
      },
      {
        title: t("TXT_CODE_acd4abda"),
        key: QUICKSTART_METHOD.DOCKER,
        icon: CodeOutlined
      },
      {
        title: t("TXT_CODE_444db70f"),
        key: QUICKSTART_METHOD.FILE,
        icon: CloudUploadOutlined
      },
      {
        title: t("TXT_CODE_f2a58270"),
        key: QUICKSTART_METHOD.IMPORT,
        icon: FileZipOutlined
      },
      {
        title: t("TXT_CODE_1baf656e"),
        key: QUICKSTART_METHOD.SELECT,
        icon: FolderOpenOutlined
      },
      {
        title: t("TXT_CODE_c14caab"),
        key: QUICKSTART_METHOD.EXIST,
        icon: FileExcelOutlined
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
    formData.title = t("TXT_CODE_2958a0f8");
    currentIcon.value = SmileTwoTone;

    formData.actions = arrayFilter<ActionButtons>([
      {
        title: t("TXT_CODE_36417656"),
        key: "console",
        icon: CodeOutlined,
        click: () => {
          const daemonId = formData.daemonId;
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
        title: t("TXT_CODE_2864bfbc"),
        key: "files",
        icon: FolderOpenOutlined,
        click: () => {
          const daemonId = formData.daemonId;
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
        title: t("TXT_CODE_d4146944"),
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
    return formData.step !== 4;
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
