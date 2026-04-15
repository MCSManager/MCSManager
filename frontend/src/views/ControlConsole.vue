<script setup lang="ts">
import { useControlDashboard } from "@/hooks/useControlDashboard";
import { useControlPanelState } from "@/hooks/useControlPanelState";
import { useControlPreviewState } from "@/hooks/useControlPreviewState";
import { useScreen } from "@/hooks/useScreen";
import { t } from "@/lang/i18n";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { INSTANCE_STATUS, INSTANCE_STATUS_CODE } from "@/types/const";
import type { ControlLogLine, ControlTarget } from "@/types/control";
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SendOutlined
} from "@ant-design/icons-vue";
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const { isPhone } = useScreen();
const { state: appState } = useAppStateStore();
const logBodyRef = ref<HTMLDivElement>();

const isLocalPreviewMode = appState.userInfo?.token === "local-preview-token";
const controlState = isLocalPreviewMode ? useControlPreviewState() : useControlPanelState();

const {
  nodes,
  pollIntervalMs,
  stateSource,
  commandInput,
  currentLogs,
  currentNode,
  currentTarget,
  currentTargetKey,
  currentTargets,
  isPollingPaused,
  isRefreshing,
  selectNode,
  selectTarget,
  refreshCurrentTarget,
  togglePolling,
  clearCurrentLogs,
  startCurrentTarget,
  stopCurrentTarget,
  restartCurrentTarget,
  sendCommand
} = controlState;

const getStatusColor = (target?: ControlTarget) => {
  if (!target?.daemonAvailable) return "default";
  if (target.status === INSTANCE_STATUS_CODE.RUNNING) return "success";
  if (
    target.status === INSTANCE_STATUS_CODE.STARTING ||
    target.status === INSTANCE_STATUS_CODE.STOPPING ||
    target.status === INSTANCE_STATUS_CODE.BUSY
  ) {
    return "processing";
  }
  return "default";
};

const getStatusText = (target?: ControlTarget) => {
  if (!target) return "--";
  if (!target.daemonAvailable) return t("TXT_CODE_66ce073e");
  if (target.status == null) return "--";
  return INSTANCE_STATUS[target.status] || "--";
};

const {
  dashboardMeta,
  dashboardMetrics,
  dashboardSource,
  dashboardSourceText,
  isDashboardRefreshing,
  refreshDashboard
} = useControlDashboard(currentTarget);

const currentTargetModeText = computed(() =>
  currentTarget.value?.mode === "global" ? t("TXT_CODE_CONTROL_HOST_MODE") : t("TXT_CODE_4ccdd3a0")
);

const currentTargetContext = computed(() => {
  if (!currentTarget.value) return "--";
  return `${currentTargetModeText.value} / ${currentTarget.value.daemonDisplayName}`;
});

const commandPlaceholder = computed(() => t("TXT_CODE_555e2c1b"));

const primaryActionLabel = computed(() =>
  currentTarget.value?.mode === "global"
    ? t("TXT_CODE_CONTROL_OPEN_HOST")
    : t("TXT_CODE_8c7318b3")
);

const terminalTitle = computed(() =>
  currentTarget.value?.mode === "global" ? t("TXT_CODE_5bdaf23d") : t("TXT_CODE_4ccdd3a0")
);

const dashboardSourceTagColor = computed(() =>
  dashboardSource.value === "live" ? "blue" : "default"
);

const currentTargetDescription = computed(
  () => currentTarget.value?.description || currentNode.value?.description || ""
);

const isRefreshBusy = computed(() => isRefreshing.value || isDashboardRefreshing.value);
const controlEyebrow = computed(() =>
  t(stateSource === "preview" ? "TXT_CODE_CONTROL_RELAY_PREVIEW" : "TXT_CODE_CONTROL_RELAY_LIVE")
);

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push("/instances");
};

const getLogClass = (line: ControlLogLine) => `terminal-line--${line.level}`;

const handleRefresh = () => {
  refreshCurrentTarget();
  void refreshDashboard(true);
};

watch(
  () => [currentTargetKey.value, currentLogs.value.length],
  async () => {
    await nextTick();
    if (!logBodyRef.value) return;
    logBodyRef.value.scrollTop = logBodyRef.value.scrollHeight;
  },
  {
    flush: "post"
  }
);
</script>

<template>
  <div class="control-console">
    <header class="control-console__header">
      <div class="control-console__header-left">
        <a-button class="control-console__back-btn" @click="goBack">
          <template #icon>
            <ArrowLeftOutlined />
          </template>
          <span v-if="!isPhone">Instances</span>
        </a-button>

        <div class="control-console__title-wrap">
          <div class="control-console__eyebrow">{{ controlEyebrow }}</div>
          <h1 class="control-console__title">{{ t("TXT_CODE_CONTROL_TITLE") }}</h1>
        </div>
      </div>

      <div v-if="currentTarget" class="control-console__header-right">
        <div class="control-console__header-pill">
          <CloudServerOutlined />
          <span>{{ currentNode?.daemonDisplayName }}</span>
        </div>
        <div class="control-console__header-pill control-console__header-pill--accent">
          <DesktopOutlined />
          <span>{{ currentTarget.displayName }}</span>
        </div>
        <a-tag class="control-console__mode-tag" :bordered="false">
          {{ currentTargetModeText }}
        </a-tag>
        <a-button :loading="isRefreshBusy" @click="handleRefresh">
          <template #icon>
            <ReloadOutlined />
          </template>
          <span v-if="!isPhone">{{ t("TXT_CODE_REFRESH") }}</span>
        </a-button>
      </div>
    </header>

    <div class="control-console__shell">
      <aside class="control-console__sidebar">
        <section class="control-panel">
          <div class="control-panel__header">
            <span>{{ t("TXT_CODE_20509fa0") }}</span>
            <a-tag>{{ nodes.length }}</a-tag>
          </div>
          <div class="control-console__node-list">
            <button
              v-for="node in nodes"
              :key="node.daemonId"
              type="button"
              class="control-console__node-card"
              :class="{ 'is-active': currentNode?.daemonId === node.daemonId }"
              @click="selectNode(node.daemonId)"
            >
              <div class="control-console__node-main">
                <div>
                  <div class="control-console__card-title">{{ node.daemonDisplayName }}</div>
                  <div class="control-console__card-subtitle">{{ node.endpoint }}</div>
                </div>
                <a-badge :status="node.daemonAvailable ? 'success' : 'default'" />
              </div>
              <div class="control-console__node-footer">
                <span>{{ node.description }}</span>
                <a-tag :color="node.daemonAvailable ? 'green' : 'default'">
                  {{ node.daemonAvailable ? t("TXT_CODE_823bfe63") : t("TXT_CODE_66ce073e") }}
                </a-tag>
              </div>
            </button>
          </div>
        </section>

        <section class="control-panel control-panel--targets">
          <div class="control-panel__header">
            <span>{{ t("TXT_CODE_d655beec") }}</span>
            <a-tag>{{ currentTargets.length }}</a-tag>
          </div>
          <div class="control-console__target-list">
            <button
              v-for="target in currentTargets"
              :key="`${target.daemonId}:${target.mode}:${target.instanceId}`"
              type="button"
              class="control-console__target-card"
              :class="{ 'is-active': currentTargetKey === `${target.daemonId}:${target.mode}:${target.instanceId}` }"
              @click="selectTarget(target)"
            >
              <div class="control-console__target-main">
                <div class="control-console__target-title-row">
                  <component
                    :is="target.mode === 'global' ? DatabaseOutlined : AppstoreOutlined"
                    class="control-console__target-icon"
                  />
                  <span class="control-console__card-title">{{ target.displayName }}</span>
                </div>
                <a-tag class="m-0" :color="getStatusColor(target)">
                  {{ getStatusText(target) }}
                </a-tag>
              </div>
              <div class="control-console__card-subtitle">
                {{ target.mode === "global" ? "global0001" : target.instanceId }}
              </div>
              <div class="control-console__target-footer">
                <span>{{ target.description }}</span>
              </div>
            </button>
          </div>
        </section>
      </aside>

      <main v-if="currentTarget" class="control-console__workspace">
        <section class="control-panel control-panel--summary">
          <div class="control-panel__header">
            <span>{{ t("TXT_CODE_CONTROL_SUMMARY") }}</span>
            <div class="control-console__summary-tags">
              <a-tag :color="getStatusColor(currentTarget)">
                {{ getStatusText(currentTarget) }}
              </a-tag>
              <a-tag :color="dashboardSourceTagColor">
                {{ dashboardSourceText }}
              </a-tag>
            </div>
          </div>
          <div class="control-console__summary-top">
            <div class="control-console__summary-copy">
              <div class="control-console__summary-kicker">{{ currentTargetContext }}</div>
              <div class="control-console__summary-title">{{ currentTarget.displayName }}</div>
              <p v-if="currentTargetDescription" class="control-console__summary-desc">
                {{ currentTargetDescription }}
              </p>
            </div>
            <div class="control-console__summary-meta">
              <div
                v-for="item in dashboardMeta"
                :key="item.key"
                class="control-console__summary-meta-item"
              >
                <span class="control-console__summary-meta-label">{{ item.label }}</span>
                <strong class="control-console__summary-meta-value">{{ item.value }}</strong>
              </div>
            </div>
          </div>
          <div class="control-console__metrics-grid">
            <article
              v-for="metric in dashboardMetrics"
              :key="metric.key"
              class="control-console__metric-card"
              :class="`is-${metric.tone}`"
            >
              <span class="control-console__metric-label">{{ metric.label }}</span>
              <strong class="control-console__metric-value">{{ metric.value }}</strong>
              <span class="control-console__metric-detail">{{ metric.detail }}</span>
            </article>
          </div>
        </section>

        <section class="control-panel control-panel--actions">
          <div class="control-panel__header">
            <span>{{ t("TXT_CODE_OPERATE") }}</span>
            <a-tag :bordered="false">{{ currentTargetModeText }}</a-tag>
          </div>
          <div class="control-console__actions-row">
            <a-button type="primary" :disabled="!currentTarget.daemonAvailable" @click="startCurrentTarget">
              <template #icon>
                <PlayCircleOutlined />
              </template>
              {{ primaryActionLabel }}
            </a-button>
            <a-button danger ghost :disabled="!currentTarget.daemonAvailable" @click="stopCurrentTarget">
              <template #icon>
                <PauseCircleOutlined />
              </template>
              {{ t("TXT_CODE_148d6467") }}
            </a-button>
            <a-button
              v-if="currentTarget.mode === 'instance'"
              :disabled="!currentTarget.daemonAvailable"
              @click="restartCurrentTarget"
            >
              <template #icon>
                <ReloadOutlined />
              </template>
              {{ t("TXT_CODE_77cc12da") }}
            </a-button>
          </div>
        </section>

        <section class="control-panel control-panel--terminal">
          <div class="control-console__terminal-toolbar">
            <div>
              <div class="control-console__terminal-title">{{ terminalTitle }}</div>
              <div class="control-console__terminal-meta">
                outputlog / {{ pollIntervalMs }}ms
              </div>
            </div>
            <div class="control-console__terminal-actions">
              <a-button size="small" @click="togglePolling">
                {{ isPollingPaused ? t("TXT_CODE_ed3fc23") : t("TXT_CODE_CONTROL_PAUSE") }}
              </a-button>
              <a-button size="small" @click="clearCurrentLogs">{{ t("TXT_CODE_7333c7f7") }}</a-button>
              <a-button size="small" :loading="isRefreshBusy" @click="handleRefresh">
                {{ t("TXT_CODE_REFRESH") }}
              </a-button>
            </div>
          </div>

          <div ref="logBodyRef" class="control-console__terminal-body">
            <template v-if="currentLogs.length > 0">
              <div
                v-for="line in currentLogs"
                :key="line.id"
                class="terminal-line"
                :class="getLogClass(line)"
              >
                <span class="terminal-line__time">{{ line.time }}</span>
                <span class="terminal-line__text">{{ line.text }}</span>
              </div>
            </template>
            <a-empty v-else class="control-console__terminal-empty" :description="t('TXT_CODE_5415f009')" />
          </div>

          <div class="control-console__terminal-input">
            <a-input
              v-model:value="commandInput"
              :disabled="!currentTarget.daemonAvailable"
              :placeholder="commandPlaceholder"
              @press-enter="sendCommand"
            />
            <a-button type="primary" :disabled="!commandInput.trim()" @click="sendCommand">
              <template #icon>
                <SendOutlined />
              </template>
              {{ t("TXT_CODE_b7cab91d") }}
            </a-button>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.control-console {
  height: 100svh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top left, rgba(64, 150, 255, 0.18), transparent 34%),
    radial-gradient(circle at top right, rgba(22, 163, 74, 0.12), transparent 28%),
    var(--background-color);
  color: var(--text-color);
}

.control-console__header {
  position: sticky;
  top: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
  background: linear-gradient(135deg, rgba(7, 16, 31, 0.95), rgba(17, 34, 62, 0.9));
  color: var(--color-always-white);
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.16);
}

.control-console__header-left,
.control-console__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.control-console__header-right {
  justify-content: flex-end;
  flex-wrap: wrap;
}

.control-console__back-btn {
  flex-shrink: 0;
}

.control-console__eyebrow {
  opacity: 0.78;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.control-console__title {
  margin: 4px 0 0;
  font-size: 28px;
  line-height: 1.1;
  color: var(--color-always-white);
}

.control-console__header-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  font-size: 13px;
}

.control-console__header-pill span {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.control-console__header-pill--accent {
  background: rgba(59, 130, 246, 0.18);
}

.control-console__mode-tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: var(--color-always-white);
}

.control-console__shell {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
  padding: 20px 24px 24px;
}

.control-console__sidebar,
.control-console__workspace {
  min-height: 0;
}

.control-console__sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-console__workspace {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 16px;
}

.control-panel {
  min-height: 0;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 20px;
  background: var(--background-color-white);
  box-shadow:
    0 16px 36px rgba(15, 23, 42, 0.08),
    0 2px 8px rgba(15, 23, 42, 0.04);
}

.control-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
  font-weight: 700;
}

.control-panel--targets {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.control-console__node-list,
.control-console__target-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 14px 16px;
  overflow-y: auto;
}

.control-console__target-list {
  flex: 1;
  min-height: 0;
}

.control-console__node-card,
.control-console__target-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  padding: 14px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.82), rgba(255, 255, 255, 0.96));
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
  color: inherit;
}

.control-console__node-card:hover,
.control-console__target-card:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.26);
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.08);
}

.control-console__node-card.is-active,
.control-console__target-card.is-active {
  border-color: rgba(59, 130, 246, 0.48);
  box-shadow:
    0 14px 28px rgba(59, 130, 246, 0.12),
    inset 0 0 0 1px rgba(59, 130, 246, 0.22);
}

.control-console__node-main,
.control-console__target-main,
.control-console__node-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.control-console__node-footer,
.control-console__target-footer {
  margin-top: 10px;
  color: var(--color-gray-8);
  font-size: 12px;
}

.control-console__card-title {
  font-weight: 700;
  line-height: 1.3;
}

.control-console__card-subtitle {
  margin-top: 6px;
  color: var(--color-gray-7);
  font-size: 12px;
  word-break: break-all;
}

.control-console__target-main {
  align-items: center;
}

.control-console__target-title-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.control-console__target-icon {
  color: var(--color-blue-6);
  font-size: 16px;
}

.control-panel--summary,
.control-panel--actions {
  padding-bottom: 14px;
}

.control-console__summary-tags {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.control-console__summary-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px 16px;
}

.control-console__summary-copy {
  min-width: 0;
  flex: 1;
}

.control-console__summary-kicker {
  color: var(--color-gray-7);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.control-console__summary-title {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.control-console__summary-desc {
  margin: 10px 0 0;
  color: var(--color-gray-8);
}

.control-console__summary-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-width: min(100%, 380px);
}

.control-console__summary-meta-item {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(241, 245, 249, 0.92);
}

.control-console__summary-meta-label,
.control-console__metric-label,
.control-console__metric-detail {
  color: var(--color-gray-7);
  font-size: 12px;
}

.control-console__summary-meta-label,
.control-console__metric-label {
  display: block;
}

.control-console__summary-meta-value {
  display: block;
  margin-top: 8px;
  word-break: break-all;
}

.control-console__metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 0 18px;
}

.control-console__metric-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 132px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9), rgba(255, 255, 255, 0.98));
  --metric-accent: rgba(59, 130, 246, 0.38);
}

.control-console__metric-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--metric-accent);
}

.control-console__metric-card.is-success {
  --metric-accent: rgba(22, 163, 74, 0.78);
}

.control-console__metric-card.is-warning {
  --metric-accent: rgba(245, 158, 11, 0.82);
}

.control-console__metric-card.is-danger {
  --metric-accent: rgba(239, 68, 68, 0.78);
}

.control-console__metric-card.is-muted {
  --metric-accent: rgba(148, 163, 184, 0.72);
}

.control-console__metric-value {
  margin-top: auto;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.control-console__metric-card.is-success .control-console__metric-value {
  color: #15803d;
}

.control-console__metric-card.is-warning .control-console__metric-value {
  color: #b45309;
}

.control-console__metric-card.is-danger .control-console__metric-value {
  color: #b91c1c;
}

.control-console__metric-card.is-muted .control-console__metric-value {
  color: var(--color-gray-6);
}

.control-console__metric-detail {
  margin-top: auto;
}

.control-console__actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 18px;
}

.control-panel--terminal {
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
}

.control-console__terminal-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.control-console__terminal-title {
  font-weight: 700;
}

.control-console__terminal-meta {
  margin-top: 4px;
  color: var(--color-gray-7);
  font-size: 12px;
}

.control-console__terminal-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.control-console__terminal-body {
  min-height: 0;
  overflow-y: auto;
  padding: 16px 18px;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 32%),
    linear-gradient(180deg, #081120 0%, #0b1526 100%);
  color: #dbeafe;
  font-family:
    Consolas, "SFMono-Regular", Menlo, Monaco, "Liberation Mono", "Courier New", monospace;
}

.terminal-line {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  gap: 12px;
  padding: 6px 0;
  font-size: 13px;
  line-height: 1.55;
}

.terminal-line__time {
  color: rgba(191, 219, 254, 0.62);
}

.terminal-line__text {
  word-break: break-word;
  white-space: pre-wrap;
}

.terminal-line--warn .terminal-line__text {
  color: #fde68a;
}

.terminal-line--error .terminal-line__text {
  color: #fca5a5;
}

.terminal-line--command .terminal-line__text {
  color: #86efac;
}

.control-console__terminal-empty {
  padding-top: 48px;
}

.control-console__terminal-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  padding: 16px 18px 18px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

@media (max-width: 992px) {
  .control-console__header {
    padding: 14px 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .control-console__header-left,
  .control-console__header-right {
    justify-content: space-between;
  }

  .control-console__title {
    font-size: 24px;
  }

  .control-console__header-pill span {
    max-width: 120px;
  }

  .control-console__shell {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px;
    overflow-y: auto;
  }

  .control-console__workspace {
    grid-template-rows: auto auto auto;
  }

  .control-panel__header,
  .control-console__terminal-toolbar,
  .control-console__terminal-input {
    padding-right: 14px;
    padding-left: 14px;
  }

  .control-console__summary-top {
    flex-direction: column;
    padding-right: 14px;
    padding-left: 14px;
  }

  .control-console__summary-meta,
  .control-console__metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .control-console__metrics-grid,
  .control-console__actions-row {
    padding-right: 14px;
    padding-left: 14px;
  }

  .control-console__summary-meta {
    min-width: 0;
    width: 100%;
  }

  .control-console__metric-card {
    min-height: 120px;
  }

  .control-console__metric-value {
    font-size: 24px;
  }

  .control-console__terminal-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .control-console__terminal-actions {
    justify-content: flex-start;
  }

  .control-console__terminal-body {
    min-height: 320px;
    max-height: 48svh;
  }

  .control-console__terminal-input {
    grid-template-columns: 1fr;
  }

  .terminal-line {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
