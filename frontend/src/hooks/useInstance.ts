import type { InstanceDetail, MapData } from "@/types";
import { t } from "@/lang/i18n";
import { computed, onMounted, onUnmounted, ref, type Ref } from "vue";
import { getInstanceInfo } from "@/services/apis/instance";
import { INSTANCE_STATUS, INSTANCE_STATUS_CODE } from "@/types/const";

export const TYPE_UNIVERSAL = "universal";
export const TYPE_WEB_SHELL = "universal/web_shell";
export const TYPE_MINECRAFT_MCDR = "universal/mcdr";
export const TYPE_MINECRAFT_JAVA = "minecraft/java";
export const TYPE_MINECRAFT_BUKKIT = "minecraft/java/bukkit";
export const TYPE_MINECRAFT_SPIGOT = "minecraft/java/spigot";
export const TYPE_MINECRAFT_PAPER = "minecraft/java/paper";
export const TYPE_MINECRAFT_FORGE = "minecraft/java/forge";
export const TYPE_MINECRAFT_FABRIC = "minecraft/java/fabric";
export const TYPE_MINECRAFT_BUNGEECORD = "minecraft/java/bungeecord";
export const TYPE_MINECRAFT_VELOCITY = "minecraft/java/velocity";
export const TYPE_MINECRAFT_GEYSER = "minecraft/java/geyser";
export const TYPE_MINECRAFT_SPONGE = "minecraft/java/sponge";
export const TYPE_MINECRAFT_MOHIST = "minecraft/java/mohist";
export const TYPE_MINECRAFT_BEDROCK = "minecraft/bedrock";
export const TYPE_MINECRAFT_BDS = "minecraft/bedrock/bds";
export const TYPE_MINECRAFT_NUKKIT = "minecraft/bedrock/nukkit";
export const TYPE_STEAM_SERVER_UNIVERSAL = "steam/universal";
export const TYPE_TERRARIA = "steam/terraria";

export const INSTANCE_TYPE_TRANSLATION: MapData<string> = {
  [TYPE_UNIVERSAL]: t("TXT_CODE_a92a4aa1"),
  [TYPE_STEAM_SERVER_UNIVERSAL]: t("TXT_CODE_3d7fbe30"),
  [TYPE_MINECRAFT_JAVA]: t("TXT_CODE_97f779b3"),
  [TYPE_MINECRAFT_BEDROCK]: t("TXT_CODE_7f1aef9f"),
  [TYPE_MINECRAFT_SPIGOT]: t("TXT_CODE_6c08319b"),
  [TYPE_MINECRAFT_PAPER]: t("TXT_CODE_ec0cda88"),
  [TYPE_MINECRAFT_BUNGEECORD]: t("TXT_CODE_ba86f4a"),
  [TYPE_MINECRAFT_VELOCITY]: t("TXT_CODE_a3abb092"),
  [TYPE_MINECRAFT_BDS]: t("TXT_CODE_67b5f678"),
  [TYPE_MINECRAFT_SPONGE]: t("TXT_CODE_e4dbff32"),
  [TYPE_MINECRAFT_FORGE]: t("TXT_CODE_5112fcb2"),
  [TYPE_MINECRAFT_FABRIC]: t("TXT_CODE_7af6d85a"),
  [TYPE_MINECRAFT_BUKKIT]: t("TXT_CODE_992bf9bc"),
  [TYPE_MINECRAFT_GEYSER]: t("TXT_CODE_4f57868"),
  [TYPE_MINECRAFT_MCDR]: t("TXT_CODE_fa6f95a1"),
  [TYPE_WEB_SHELL]: t("TXT_CODE_31c5a4d0"),
  [TYPE_TERRARIA]: t("TXT_CODE_f25df30a")
};

interface Params {
  instanceId?: string;
  daemonId?: string;
  autoRefresh?: boolean;
  instanceInfo?: Ref<InstanceDetail | undefined>;
}

export interface InstanceMoreDetail extends InstanceDetail {
  moreInfo?: {
    isRunning: boolean;
    isStopped: boolean;
    instanceTypeText: string;
    statusText: string;
  };
}

export function useInstanceMoreDetail(info: InstanceMoreDetail): InstanceMoreDetail {
  const { statusText, isRunning, isStopped, instanceTypeText } = useInstanceInfo({
    instanceInfo: ref(info)
  });

  info.moreInfo = {
    statusText: statusText.value,
    isRunning: isRunning.value,
    isStopped: isStopped.value,
    instanceTypeText: instanceTypeText.value
  };

  return info;
}

export function useInstanceInfo(params: Params) {
  let task: NodeJS.Timer | undefined;
  const { daemonId, instanceId, instanceInfo, autoRefresh } = params;

  const { execute, state, isLoading, isReady } = getInstanceInfo();

  let finalState = state;
  if (instanceInfo) finalState = instanceInfo;

  const isUnknown = computed(() => finalState?.value?.status === INSTANCE_STATUS_CODE.BUSY);
  const isStopped = computed(() => finalState?.value?.status === INSTANCE_STATUS_CODE.STOPPED);
  const isStopping = computed(() => finalState?.value?.status === INSTANCE_STATUS_CODE.STOPPING);
  const isStarting = computed(() => finalState?.value?.status === INSTANCE_STATUS_CODE.STARTING);
  const isRunning = computed(() => finalState?.value?.status === INSTANCE_STATUS_CODE.RUNNING);

  const instanceTypeText = computed(() => {
    return (
      INSTANCE_TYPE_TRANSLATION[String(finalState?.value?.config.type)] || t("TXT_CODE_da7a0328")
    );
  });
  const statusText = computed(
    () => String(INSTANCE_STATUS[finalState.value?.status ?? -1]) || t("TXT_CODE_c8333afa")
  );

  onMounted(async () => {
    if (instanceId && daemonId) {
      await execute({
        params: {
          uuid: instanceId,
          daemonId: daemonId
        }
      });

      if (autoRefresh) {
        task = setInterval(async () => {
          await execute({
            params: {
              uuid: instanceId,
              daemonId: daemonId
            }
          });
        }, 3000);
      }
    }
  });

  onUnmounted(() => {
    if (task) clearInterval(task);
    task = undefined;
  });

  return {
    isLoading,
    isReady,
    instanceInfo: state,
    execute,
    statusText,
    isUnknown,
    isStopped,
    isStopping,
    isStarting,
    isRunning,
    instanceTypeText
  };
}

export interface InstanceConfigs {
  fileName: string;
  path: string;
  redirect: string;
  type: string;
  info: string;
  category: string[];
  conflict?: boolean;
  check?: boolean;
}

export function getInstanceConfigByType(type: string) {
  let result: InstanceConfigs[] = [];
  INSTANCE_CONFIGS.forEach((v) => {
    if (v.category.includes(type)) result.push(v);
  });
  // Return a copy to avoid interfering with the original data
  return JSON.parse(JSON.stringify(result));
}

export const INSTANCE_CONFIGS: InstanceConfigs[] = [
  {
    fileName: t("TXT_CODE_9b36d5a2"),
    path: "server.properties",
    redirect: "common/server.properties",
    type: "properties",
    info: t("TXT_CODE_12e3afa9"),
    category: [
      TYPE_MINECRAFT_SPIGOT,
      TYPE_MINECRAFT_PAPER,
      TYPE_MINECRAFT_JAVA,
      TYPE_MINECRAFT_BUKKIT,
      TYPE_MINECRAFT_FORGE,
      TYPE_MINECRAFT_FABRIC,
      TYPE_MINECRAFT_SPONGE
    ]
  },
  {
    fileName: t("TXT_CODE_90f684dc"),
    type: "properties",
    info: t("TXT_CODE_ab4cc2dc"),
    path: "eula.txt",
    redirect: "common/eula.txt",
    category: [
      TYPE_MINECRAFT_SPIGOT,
      TYPE_MINECRAFT_PAPER,
      TYPE_MINECRAFT_JAVA,
      TYPE_MINECRAFT_BUKKIT,
      TYPE_MINECRAFT_FABRIC,
      TYPE_MINECRAFT_SPONGE
    ]
  },
  {
    fileName: "[Spigot] spigot.yml",
    path: "spigot.yml",
    redirect: "bukkit/spigot.yml",
    type: "yml",
    info: t("TXT_CODE_509d7d9a"),
    category: [
      TYPE_MINECRAFT_SPIGOT,
      TYPE_MINECRAFT_PAPER,
      TYPE_MINECRAFT_JAVA,
      TYPE_MINECRAFT_BUKKIT
    ]
  },
  {
    fileName: "[Bukkit] bukkit.yml",
    path: "bukkit.yml",
    redirect: "bukkit/bukkit.yml",
    type: "yml",
    info: t("TXT_CODE_d03c3e0e"),
    category: [
      TYPE_MINECRAFT_SPIGOT,
      TYPE_MINECRAFT_PAPER,
      TYPE_MINECRAFT_JAVA,
      TYPE_MINECRAFT_BUKKIT
    ]
  },
  {
    fileName: "[Bungeecord] config.yml",
    type: "yml",
    info: t("TXT_CODE_e9dcbfe4"),
    path: "config.yml",
    redirect: "bungeecord/config.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_BUNGEECORD]
  },
  {
    fileName: "[Velocity] velocity.toml",
    type: "toml",
    info: t("TXT_CODE_751f9bc1"),
    path: "velocity.toml",
    redirect: "velocity/velocity.toml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_VELOCITY]
  },
  {
    fileName: "[Bedrock] server.properties",
    path: "server.properties",
    redirect: "bds/server.properties",
    type: "properties",
    info: t("TXT_CODE_3a3f9a57"),
    category: [TYPE_MINECRAFT_BDS, TYPE_MINECRAFT_BEDROCK]
  },
  {
    fileName: "[Mohist] mohist.yml",
    path: "mohist.yml",
    redirect: "mohist/mohist.yml",
    type: "yml",
    info: t("TXT_CODE_6eead111"),
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_MOHIST]
  },
  {
    fileName: "[Paper] paper.yml",
    type: "yml",
    info: t("TXT_CODE_f3fc17f3"),
    path: "paper.yml",
    redirect: "paper/paper.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_PAPER]
  },
  {
    fileName: "[Paper] paper-global.yml",
    type: "yml",
    info: t("TXT_CODE_2931127f"),
    path: "config/paper-global.yml",
    redirect: "paper/paper-global.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_PAPER]
  },
  {
    fileName: "[Paper] paper-world-defaults.yml",
    type: "yml",
    info: t("TXT_CODE_4880ef77"),
    path: "config/paper-world-defaults.yml",
    redirect: "paper/paper-world-defaults.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_PAPER]
  },
  {
    fileName: "[Geyser] config.yml",
    type: "yml",
    info: t("TXT_CODE_1d39feca"),
    path: "config.yml",
    redirect: "geyser/config.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_GEYSER]
  },
  {
    fileName: "[MCDR] config.yml",
    type: "yml",
    info: t("TXT_CODE_25699fea"),
    path: "config.yml",
    redirect: "mcdr/config.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_MCDR]
  },
  {
    fileName: "[MCDR] permission.yml",
    type: "yml",
    info: t("TXT_CODE_5207688f"),
    path: "permission.yml",
    redirect: "mcdr/permission.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_MCDR]
  },
  {
    fileName: "[Tshock] config.json",
    type: "yml",
    info: t("TXT_CODE_1cd8f9d2"),
    path: "tshock/config.json",
    redirect: "tshock/config.json",
    category: [TYPE_TERRARIA]
  }
];
