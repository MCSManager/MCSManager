import type { InstanceDetail, MapData } from "@/types";
import { t } from "@/lang/i18n";
import { computed, onMounted, onUnmounted, ref, type Ref } from "vue";
import { getInstanceInfo } from "@/services/apis/instance";

export const INSTANCE_STATUS_TEXT: MapData<string> = {
  "-1": t("维护中"),
  "0": t("未运行"),
  "1": t("停止中"),
  "2": t("启动中"),
  "3": t("运行中")
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
    return INSTANCE_TYPE_TRANSLATION[String(finalState?.value?.config.type)] || t("未知类型");
  });
  const statusText = computed(
    () => String(INSTANCE_STATUS_TEXT[String(finalState?.value?.status)]) || t("未知状态")
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
