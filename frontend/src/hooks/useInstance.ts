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
  [TYPE_WEB_SHELL]: "Web Shell"
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
          remote_uuid: daemonId
        }
      });

      if (autoRefresh) {
        task = setInterval(async () => {
          await execute({
            params: {
              uuid: instanceId,
              remote_uuid: daemonId
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
  // 返回副本以避免干扰原始数据
  return JSON.parse(JSON.stringify(result));
}

export const INSTANCE_CONFIGS = [
  {
    // 配置文件显示名
    fileName: t("[通用] server.properties"),
    // 配置文件对应的实际路径（相对于实例根目录）
    path: "server.properties",
    // 配置文件用于显示界面的组件名
    redirect: "common/server.properties",
    // 配置文件解析类型，支持 yml,json,txt,properties
    type: "properties",
    // 配置文件中文解释
    info: t(
      "Minecraft 服务端极其重要的配置文件，几乎绝大部分常用配置（端口，人数，视距等）均在此文件中进行编辑"
    ),
    // 在哪些服务端类型下此配置文件可见
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
    fileName: t("[通用] eula.txt"),
    type: "properties",
    info: t("软件最终用户协议，此协议必须设置同意，否则无法启用服务端软件"),
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
    info: t(
      "Spigot 配置文件，能够进一步的控制服务器的行为和具体参数，一些更为高级的限制都在此配置文件中"
    ),
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
    info: t("Bukkit 原始配置文件"),
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
    info: t(
      "Bungeecord 群组服务端的重要配置文件，可以进行分布式管理，节点控制等，但此配置文件较为复杂，此处仅供简单的配置和操作"
    ),
    path: "config.yml",
    redirect: "bungeecord/config.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_BUNGEECORD]
  },
  {
    fileName: "[Velocity] velocity.toml",
    type: "toml",
    info: t(
      "Velocity 群组服务端的重要配置文件，可以进行分布式管理，节点控制等，但此配置文件较为复杂，此处仅供简单的配置和操作"
    ),
    path: "velocity.toml",
    redirect: "velocity/velocity.toml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_VELOCITY]
  },
  {
    fileName: "[Bedrock] server.properties",
    path: "server.properties",
    redirect: "bds/server.properties",
    type: "properties",
    info: t(
      "Minecraft Bedrock 服务端极其重要的配置文件，几乎绝大部分常用配置（端口，人数，视距等）均在此文件中进行编辑"
    ),
    category: [TYPE_MINECRAFT_BDS, TYPE_MINECRAFT_BEDROCK]
  },
  {
    fileName: "[Mohist] mohist.yml",
    path: "mohist.yml",
    redirect: "mohist/mohist.yml",
    type: "yml",
    info: t("mohist.yml 服务端配置文件"),
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_MOHIST]
  },
  {
    fileName: "[Paper] paper.yml",
    type: "yml",
    info: t(
      "PaperSpigot 服务端软件配置文件，能够进一步的配置高级参数以及更具体化的游戏设置，对整体性能有极大的决定效果"
    ),
    path: "paper.yml",
    redirect: "paper/paper.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_PAPER]
  },
  {
    fileName: "[Paper] paper-global.yml",
    type: "yml",
    info: t(
      "PaperSpigot 服务端软件全局配置文件，能够进一步的配置高级参数以及更具体化的游戏设置，对整体性能有极大的决定效果"
    ),
    path: "config/paper-global.yml",
    redirect: "paper/paper-global.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_PAPER]
  },
  {
    fileName: "[Paper] paper-world-defaults.yml",
    type: "yml",
    info: t("PaperSpigot 服务端软件世界配置文件，能够进一步在每个世界的基础上进行配置"),
    path: "config/paper-world-defaults.yml",
    redirect: "paper/paper-world-defaults.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_PAPER]
  },
  {
    fileName: "[Geyser] config.yml",
    type: "yml",
    info: t(
      "Geyser 服务端软件配置文件，拥有基本的服务器参数设定（如端口，最大玩家数等）并且也可以设定服务端细节参数（区块缓存，线程数等）"
    ),
    path: "config.yml",
    redirect: "geyser/config.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_GEYSER]
  },
  {
    fileName: "[MCDR] config.yml",
    type: "yml",
    info: t("MCDReforged 服务端控制工具配置文件"),
    path: "config.yml",
    redirect: "mcdr/config.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_MCDR]
  },
  {
    fileName: "[MCDR] permission.yml",
    type: "yml",
    info: t("MCDReforged 服务端控制工具权限配置文件"),
    path: "permission.yml",
    redirect: "mcdr/permission.yml",
    category: [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_MCDR]
  }
];
