import type { InstanceDetail, MapData } from "@/types";
import { t } from "@/lang/i18n";
import { computed, onMounted, onUnmounted, ref, type Ref } from "vue";
import { getInstanceInfo } from "@/services/apis/instance";

export const INSTANCE_STATUS_TEXT: MapData<string> = {
  "-1": t("TXT_CODE_342a04a9"),
  "0": t("TXT_CODE_15f2e564"),
  "1": t("TXT_CODE_a409b8a9"),
  "2": t("TXT_CODE_175b570d"),
  "3": t("TXT_CODE_bdb620b9")
};

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
  [TYPE_UNIVERSAL]: "General Console Application",
  [TYPE_STEAM_SERVER_UNIVERSAL]: "Steam Game Server",
  [TYPE_MINECRAFT_JAVA]: "MC Java Edition",
  [TYPE_MINECRAFT_BEDROCK]: "MC Bedrock Edition",
  [TYPE_MINECRAFT_SPIGOT]: "MC Spigot",
  [TYPE_MINECRAFT_PAPER]: "MC Paper",
  [TYPE_MINECRAFT_BUNGEECORD]: "MC BungeeCord",
  [TYPE_MINECRAFT_VELOCITY]: "MC Velocity",
  [TYPE_MINECRAFT_BDS]: "MC Bedrock",
  [TYPE_MINECRAFT_SPONGE]: "MC Sponge",
  [TYPE_MINECRAFT_FORGE]: "MC Forge",
  [TYPE_MINECRAFT_FABRIC]: "MC Fabric",
  [TYPE_MINECRAFT_BUKKIT]: "MC Bukkit",
  [TYPE_MINECRAFT_GEYSER]: "MC Geyser",
  [TYPE_MINECRAFT_MCDR]: "MC MCDR",
  [TYPE_WEB_SHELL]: "Web Shell",
  [TYPE_TERRARIA]: "Terraria"
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

  const isRunning = computed(() => finalState?.value?.status === 3);
  const isStopped = computed(() => finalState?.value?.status === 0);
  const instanceTypeText = computed(() => {
    return (
      INSTANCE_TYPE_TRANSLATION[String(finalState?.value?.config.type)] || t("TXT_CODE_da7a0328")
    );
  });
  const statusText = computed(
    () => String(INSTANCE_STATUS_TEXT[String(finalState?.value?.status)]) || t("TXT_CODE_c8333afa")
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
    isRunning,
    isStopped,
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
    info: t("Tshock 服务端配置文件"),
    path: "tshock/config.json",
    redirect: "tshock/config.json",
    category: [TYPE_TERRARIA]
  }
];
