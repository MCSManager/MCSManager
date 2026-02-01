<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { useInstanceInfo } from "@/hooks/useInstance";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { t } from "@/lang/i18n";
import { sendInstanceCommand } from "@/services/apis/instance";
import { fileContent } from "@/services/apis/fileManager";
import { reportErrorMsg } from "@/tools/validator";
import type { LayoutCard } from "@/types";
import { message } from "ant-design-vue";
import { computed, onMounted, ref } from "vue";

type WhitelistRecord = {
  uuid?: string;
  name: string;
};

type BannedPlayerRecord = {
  uuid?: string;
  name: string;
  created?: string;
  source?: string;
  expires?: string;
  reason?: string;
};

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const { instanceInfo, isRunning, execute } = useInstanceInfo({
  instanceId,
  daemonId,
  autoRefresh: true
});

const isMinecraftJava = computed(() => String(instanceInfo.value?.config.type || "").includes("minecraft/java"));

const playerName = ref("");
const banReason = ref("");
const activeTab = ref<"whitelist" | "banned">("whitelist");

const whitelist = ref<WhitelistRecord[]>([]);
const bannedPlayers = ref<BannedPlayerRecord[]>([]);

const isOperating = ref(false);
const whitelistLoading = ref(false);
const bannedLoading = ref(false);

const whitelistColumns: any[] = [
  {
    title: t("TXT_CODE_INSTANCE_PLAYER_MANAGER_PLAYER"),
    dataIndex: "name",
    key: "name"
  },
  {
    title: "UUID",
    dataIndex: "uuid",
    key: "uuid",
    responsive: ["lg"]
  },
  {
    title: t("TXT_CODE_INSTANCE_PLAYER_MANAGER_ACTION"),
    key: "action",
    width: 120
  }
];

const bannedColumns: any[] = [
  {
    title: t("TXT_CODE_INSTANCE_PLAYER_MANAGER_PLAYER"),
    dataIndex: "name",
    key: "name"
  },
  {
    title: t("TXT_CODE_INSTANCE_PLAYER_MANAGER_REASON"),
    dataIndex: "reason",
    key: "reason"
  },
  {
    title: t("TXT_CODE_INSTANCE_PLAYER_MANAGER_ACTION"),
    key: "action",
    width: 120
  }
];

function normalizePlayerName(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function getTarget() {
  if (!instanceId || !daemonId) return null;
  return { uuid: instanceId, daemonId };
}

function ensureReady(target: ReturnType<typeof getTarget>): target is { uuid: string; daemonId: string } {
  if (!target) {
    message.error(t("TXT_CODE_INSTANCE_PLAYER_MANAGER_MISSING_TARGET"));
    return false;
  }
  if (!isMinecraftJava.value) {
    message.warning(t("TXT_CODE_INSTANCE_PLAYER_MANAGER_ONLY_JAVA"));
    return false;
  }
  if (!isRunning.value) {
    message.warning(t("TXT_CODE_INSTANCE_PLAYER_MANAGER_NEED_RUNNING"));
    return false;
  }
  return true;
}

const { execute: doSendCommand } = sendInstanceCommand();
async function runCommand(command: string) {
  const target = getTarget();
  if (!ensureReady(target)) return;
  isOperating.value = true;
  try {
    await doSendCommand({
      params: {
        uuid: target.uuid,
        daemonId: target.daemonId,
        command
      }
    });
    message.success(t("TXT_CODE_INSTANCE_PLAYER_MANAGER_SENT"));
  } catch (err: any) {
    reportErrorMsg(err);
  } finally {
    isOperating.value = false;
  }
}

const whitelistFile = fileContent();
async function refreshWhitelist() {
  if (!instanceId || !daemonId) return;
  if (!isMinecraftJava.value) return;
  whitelistLoading.value = true;
  try {
    await whitelistFile.execute({
      params: { uuid: instanceId, daemonId },
      data: { target: "whitelist.json" }
    });
    const raw = whitelistFile.state.value;
    if (typeof raw !== "string") {
      whitelist.value = [];
      return;
    }
    const parsed = JSON.parse(raw);
    whitelist.value = Array.isArray(parsed)
      ? parsed
          .map((v: any) => ({
            uuid: typeof v?.uuid === "string" ? v.uuid : undefined,
            name: String(v?.name || "").trim()
          }))
          .filter((v) => v.name)
      : [];
  } catch (err: any) {
    whitelist.value = [];
    message.warning(t("TXT_CODE_INSTANCE_PLAYER_MANAGER_WHITELIST_READ_FAIL"));
  } finally {
    whitelistLoading.value = false;
  }
}

const bannedFile = fileContent();
async function refreshBannedPlayers() {
  if (!instanceId || !daemonId) return;
  if (!isMinecraftJava.value) return;
  bannedLoading.value = true;
  try {
    await bannedFile.execute({
      params: { uuid: instanceId, daemonId },
      data: { target: "banned-players.json" }
    });
    const raw = bannedFile.state.value;
    if (typeof raw !== "string") {
      bannedPlayers.value = [];
      return;
    }
    const parsed = JSON.parse(raw);
    bannedPlayers.value = Array.isArray(parsed)
      ? parsed
          .map((v: any) => ({
            uuid: typeof v?.uuid === "string" ? v.uuid : undefined,
            name: String(v?.name || "").trim(),
            created: typeof v?.created === "string" ? v.created : undefined,
            source: typeof v?.source === "string" ? v.source : undefined,
            expires: typeof v?.expires === "string" ? v.expires : undefined,
            reason: typeof v?.reason === "string" ? v.reason : undefined
          }))
          .filter((v) => v.name)
      : [];
  } catch (err: any) {
    bannedPlayers.value = [];
    message.warning(t("TXT_CODE_INSTANCE_PLAYER_MANAGER_BANNED_READ_FAIL"));
  } finally {
    bannedLoading.value = false;
  }
}

async function whitelistAdd() {
  const name = normalizePlayerName(playerName.value);
  if (!name) return message.warning(t("TXT_CODE_INSTANCE_PLAYER_MANAGER_EMPTY_PLAYER"));
  await runCommand(`whitelist add ${name}`);
  await refreshWhitelist();
}

async function whitelistRemove(name?: string) {
  const target = normalizePlayerName(name ?? playerName.value);
  if (!target) return message.warning(t("TXT_CODE_INSTANCE_PLAYER_MANAGER_EMPTY_PLAYER"));
  await runCommand(`whitelist remove ${target}`);
  await refreshWhitelist();
}

async function banPlayer(name?: string) {
  const target = normalizePlayerName(name ?? playerName.value);
  if (!target) return message.warning(t("TXT_CODE_INSTANCE_PLAYER_MANAGER_EMPTY_PLAYER"));
  const reason = banReason.value.trim();
  const cmd = reason ? `ban ${target} ${reason}` : `ban ${target}`;
  await runCommand(cmd);
  await refreshBannedPlayers();
}

async function unbanPlayer(name?: string) {
  const target = normalizePlayerName(name ?? playerName.value);
  if (!target) return message.warning(t("TXT_CODE_INSTANCE_PLAYER_MANAGER_EMPTY_PLAYER"));
  await runCommand(`pardon ${target}`);
  await refreshBannedPlayers();
}

async function refreshActiveTab() {
  if (!isMinecraftJava.value) return;
  if (activeTab.value === "whitelist") return refreshWhitelist();
  return refreshBannedPlayers();
}

onMounted(async () => {
  if (instanceId && daemonId) {
    await execute({
      params: {
        uuid: instanceId,
        daemonId
      }
    });
  }
  if (isMinecraftJava.value) {
    await refreshWhitelist();
  }
});
</script>

<template>
  <CardPanel style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #operator>
      <a-button size="small" @click="refreshActiveTab" :loading="whitelistLoading || bannedLoading">
        {{ t("TXT_CODE_INSTANCE_PLAYER_MANAGER_REFRESH") }}
      </a-button>
    </template>
    <template #body>
      <a-alert
        v-if="!isMinecraftJava"
        type="info"
        show-icon
        :message="t('TXT_CODE_INSTANCE_PLAYER_MANAGER_ONLY_JAVA')"
        class="mb-12"
      />
      <a-alert
        v-else-if="!isRunning"
        type="warning"
        show-icon
        :message="t('TXT_CODE_INSTANCE_PLAYER_MANAGER_NEED_RUNNING')"
        class="mb-12"
      />

      <a-row :gutter="[12, 12]" class="mb-12">
        <a-col :span="24" :md="12">
          <a-input
            v-model:value="playerName"
            :placeholder="t('TXT_CODE_INSTANCE_PLAYER_MANAGER_PLAYER_PLACEHOLDER')"
            :disabled="isOperating"
          />
        </a-col>
        <a-col :span="24" :md="12">
          <a-input
            v-model:value="banReason"
            :placeholder="t('TXT_CODE_INSTANCE_PLAYER_MANAGER_REASON_PLACEHOLDER')"
            :disabled="isOperating"
          />
        </a-col>
        <a-col :span="24">
          <a-space wrap>
            <a-button type="primary" @click="whitelistAdd" :loading="isOperating">
              {{ t("TXT_CODE_INSTANCE_PLAYER_MANAGER_WHITELIST_ADD") }}
            </a-button>
            <a-button @click="() => whitelistRemove()" :loading="isOperating">
              {{ t("TXT_CODE_INSTANCE_PLAYER_MANAGER_WHITELIST_REMOVE") }}
            </a-button>
            <a-button danger @click="() => banPlayer()" :loading="isOperating">
              {{ t("TXT_CODE_INSTANCE_PLAYER_MANAGER_BAN") }}
            </a-button>
            <a-button @click="() => unbanPlayer()" :loading="isOperating">
              {{ t("TXT_CODE_INSTANCE_PLAYER_MANAGER_UNBAN") }}
            </a-button>
          </a-space>
        </a-col>
      </a-row>

      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="whitelist" :tab="t('TXT_CODE_INSTANCE_PLAYER_MANAGER_TAB_WHITELIST')">
          <a-table
            size="small"
            :columns="whitelistColumns"
            :data-source="whitelist"
            :loading="whitelistLoading"
            :pagination="false"
            row-key="name"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button
                  size="small"
                  danger
                  @click="() => whitelistRemove(record.name)"
                  :loading="isOperating"
                >
                  {{ t("TXT_CODE_INSTANCE_PLAYER_MANAGER_REMOVE") }}
                </a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="banned" :tab="t('TXT_CODE_INSTANCE_PLAYER_MANAGER_TAB_BANNED')">
          <a-table
            size="small"
            :columns="bannedColumns"
            :data-source="bannedPlayers"
            :loading="bannedLoading"
            :pagination="false"
            row-key="name"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button
                  size="small"
                  @click="() => unbanPlayer(record.name)"
                  :loading="isOperating"
                >
                  {{ t("TXT_CODE_INSTANCE_PLAYER_MANAGER_UNBAN") }}
                </a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </template>
  </CardPanel>
</template>

<style scoped lang="scss">
.mb-12 {
  margin-bottom: 12px;
}
</style>
