import { computed, onUnmounted, ref, watch } from "vue";
import { INSTANCE_STATUS_CODE } from "@/types/const";
import { CONTROL_POLL_INTERVAL_MS, createControlLogLine, createControlTargetKey, trimControlLogLines } from "@/tools/control";
import type { ControlLogLine, ControlPreviewNode, ControlTarget } from "@/types/control";

export const CONTROL_PREVIEW_GLOBAL_TARGET_ID = "global0001";
export const CONTROL_PREVIEW_POLL_INTERVAL_MS = CONTROL_POLL_INTERVAL_MS;

const createLogLine = createControlLogLine;
const makeTargetKey = createControlTargetKey;

const buildMockNodes = (): ControlPreviewNode[] => {
  const createTarget = (
    node: Omit<ControlPreviewNode, "targets">,
    target: Omit<ControlTarget, "daemonDisplayName" | "daemonAvailable" | "daemonId">
  ): ControlTarget => ({
    daemonId: node.daemonId,
    daemonDisplayName: node.daemonDisplayName,
    daemonAvailable: node.daemonAvailable,
    ...target
  });

  const nodeA = {
    daemonId: "home-daemon-a",
    daemonDisplayName: "家庭主机 A",
    daemonAvailable: true,
    endpoint: "Panel relay / home-daemon-a",
    description: "家庭动态 IP，经 Panel 中转访问。"
  };

  const nodeB = {
    daemonId: "nas-daemon-b",
    daemonDisplayName: "客厅 NAS B",
    daemonAvailable: true,
    endpoint: "Panel relay / nas-daemon-b",
    description: "适合长期在线实例和宿主机命令。"
  };

  const nodeC = {
    daemonId: "backup-daemon-c",
    daemonDisplayName: "备份节点 C",
    daemonAvailable: false,
    endpoint: "Panel relay / backup-daemon-c",
    description: "用于预览离线节点错误态。"
  };

  return [
    {
      ...nodeA,
      targets: [
        createTarget(nodeA, {
          mode: "global",
          instanceId: CONTROL_PREVIEW_GLOBAL_TARGET_ID,
          displayName: "Host Shell",
          description: "使用 global0001 预览宿主机模式，不需要浏览器直连 daemon。",
          status: INSTANCE_STATUS_CODE.RUNNING
        }),
        createTarget(nodeA, {
          mode: "instance",
          instanceId: "paper-lobby",
          displayName: "Lobby",
          description: "Paper 1.20.4，大厅服。",
          status: INSTANCE_STATUS_CODE.RUNNING
        }),
        createTarget(nodeA, {
          mode: "instance",
          instanceId: "survival-main",
          displayName: "Survival",
          description: "主生存服，持续轮询 outputlog 预览。",
          status: INSTANCE_STATUS_CODE.STARTING
        }),
        createTarget(nodeA, {
          mode: "instance",
          instanceId: "proxy-gate",
          displayName: "Velocity Proxy",
          description: "代理层实例，适合观察命令转发反馈。",
          status: INSTANCE_STATUS_CODE.STOPPED
        })
      ]
    },
    {
      ...nodeB,
      targets: [
        createTarget(nodeB, {
          mode: "global",
          instanceId: CONTROL_PREVIEW_GLOBAL_TARGET_ID,
          displayName: "Host Shell",
          description: "宿主机命令入口，用于 open / command / outputlog / stop。",
          status: INSTANCE_STATUS_CODE.STOPPED
        }),
        createTarget(nodeB, {
          mode: "instance",
          instanceId: "creative-test",
          displayName: "Creative Test",
          description: "创意测试服，便于确认样式下的实例操作流程。",
          status: INSTANCE_STATUS_CODE.RUNNING
        }),
        createTarget(nodeB, {
          mode: "instance",
          instanceId: "forge-pack",
          displayName: "Forge Pack",
          description: "模组整合包实例，用于预览停止态与重启态。",
          status: INSTANCE_STATUS_CODE.STOPPED
        })
      ]
    },
    {
      ...nodeC,
      targets: [
        createTarget(nodeC, {
          mode: "global",
          instanceId: CONTROL_PREVIEW_GLOBAL_TARGET_ID,
          displayName: "Host Shell",
          description: "节点离线时，后续这里会映射 Panel 侧错误处理。",
          status: INSTANCE_STATUS_CODE.STOPPED
        }),
        createTarget(nodeC, {
          mode: "instance",
          instanceId: "backup-world",
          displayName: "Backup World",
          description: "离线节点上的实例，用于预览不可操作状态。",
          status: INSTANCE_STATUS_CODE.STOPPED
        })
      ]
    }
  ];
};

const buildInitialLogs = (nodes: ControlPreviewNode[]) => {
  const initialLogs: Record<string, ControlLogLine[]> = {};

  for (const node of nodes) {
    for (const target of node.targets) {
      const commonLines = [
        createLogLine("info", `[panel] ${node.endpoint}`),
        createLogLine("info", `[target] ${target.displayName} (${target.instanceId})`)
      ];

      if (!node.daemonAvailable) {
        initialLogs[makeTargetKey(target)] = [
          ...commonLines,
          createLogLine("error", "节点离线，当前仅展示样式预览状态。")
        ];
        continue;
      }

      if (target.mode === "global") {
        initialLogs[makeTargetKey(target)] = [
          ...commonLines,
          createLogLine("info", "[global0001] host shell ready."),
          createLogLine("command", "$ uname -a"),
          createLogLine("info", "Linux relay-host 6.6.0-preview x86_64")
        ];
        continue;
      }

      initialLogs[makeTargetKey(target)] = [
        ...commonLines,
        createLogLine("info", `[outputlog] polling every ${CONTROL_PREVIEW_POLL_INTERVAL_MS}ms`),
        createLogLine("info", `${target.displayName} 正在等待下一次日志刷新。`)
      ];
    }
  }

  return initialLogs;
};

export function useControlPreviewState() {
  const nodes = ref<ControlPreviewNode[]>(buildMockNodes());
  const logsByTarget = ref<Record<string, ControlLogLine[]>>(buildInitialLogs(nodes.value));
  const commandInput = ref("");
  const isPollingPaused = ref(false);
  const isRefreshing = ref(false);
  const selectedDaemonId = ref(nodes.value[0]?.daemonId || "");
  const selectedTargetKey = ref("");

  let pollTimer: number | undefined;
  const pendingTimers = new Set<number>();

  const clearPollTimer = () => {
    if (pollTimer) {
      window.clearInterval(pollTimer);
      pollTimer = undefined;
    }
  };

  const scheduleTask = (callback: () => void, delay: number) => {
    const timerId = window.setTimeout(() => {
      pendingTimers.delete(timerId);
      callback();
    }, delay);
    pendingTimers.add(timerId);
  };

  const currentNode = computed(() =>
    nodes.value.find((node) => node.daemonId === selectedDaemonId.value) || nodes.value[0]
  );

  const currentTargets = computed(() => currentNode.value?.targets || []);

  const findTargetByKey = (targetKey: string) => {
    for (const node of nodes.value) {
      const target = node.targets.find((item) => makeTargetKey(item) === targetKey);
      if (target) return target;
    }
    return undefined;
  };

  const currentTarget = computed(() => {
    const matchedTarget = findTargetByKey(selectedTargetKey.value);
    if (matchedTarget && matchedTarget.daemonId === currentNode.value?.daemonId) return matchedTarget;
    return currentTargets.value[0];
  });

  const currentTargetKey = computed(() =>
    currentTarget.value ? makeTargetKey(currentTarget.value) : ""
  );

  const currentLogs = computed(() => {
    const targetKey = currentTargetKey.value;
    if (!targetKey) return [];
    return logsByTarget.value[targetKey] || [];
  });

  const appendLogByKey = (
    targetKey: string,
    level: ControlLogLine["level"],
    text: string,
    date = new Date()
  ) => {
    const nextLogs = [...(logsByTarget.value[targetKey] || []), createLogLine(level, text, date)];
    logsByTarget.value[targetKey] = trimControlLogLines(nextLogs);
  };

  const appendLog = (target: ControlTarget, level: ControlLogLine["level"], text: string) => {
    appendLogByKey(makeTargetKey(target), level, text);
  };

  const updateTargetStatus = (targetKey: string, status: INSTANCE_STATUS_CODE) => {
    const target = findTargetByKey(targetKey);
    if (target) {
      target.status = status;
    }
  };

  const ensureSelectionForNode = (daemonId: string) => {
    const node = nodes.value.find((item) => item.daemonId === daemonId);
    const nextTarget = node?.targets[0];
    selectedTargetKey.value = nextTarget ? makeTargetKey(nextTarget) : "";
  };

  const emitPollLog = () => {
    const target = currentTarget.value;
    const targetKey = currentTargetKey.value;
    if (!target || !targetKey || isPollingPaused.value) return;
    if (!target.daemonAvailable) return;

    if (target.mode === "global") {
      if (target.status === INSTANCE_STATUS_CODE.RUNNING) {
        appendLogByKey(
          targetKey,
          "info",
          `[outputlog] host relay heartbeat ${Math.floor(Math.random() * 90) + 10}ms`
        );
      }
      return;
    }

    if (target.status === INSTANCE_STATUS_CODE.RUNNING) {
      const fakeUsage = (Math.random() * 30 + 25).toFixed(1);
      appendLogByKey(targetKey, "info", `[outputlog] tick ok, cpu=${fakeUsage}% memory=2.4G`);
      return;
    }

    if (target.status === INSTANCE_STATUS_CODE.STARTING) {
      appendLogByKey(targetKey, "info", "[outputlog] starting runtime, waiting for next state...");
    }
  };

  const startPoller = () => {
    clearPollTimer();
    if (!currentTarget.value || isPollingPaused.value) return;
    pollTimer = window.setInterval(() => emitPollLog(), CONTROL_PREVIEW_POLL_INTERVAL_MS);
  };

  const selectNode = (daemonId: string) => {
    if (daemonId === selectedDaemonId.value) return;
    selectedDaemonId.value = daemonId;
    ensureSelectionForNode(daemonId);
  };

  const selectTarget = (target: ControlTarget) => {
    selectedDaemonId.value = target.daemonId;
    selectedTargetKey.value = makeTargetKey(target);
  };

  const refreshCurrentTarget = () => {
    if (isRefreshing.value || !currentTarget.value) return;
    isRefreshing.value = true;
    const target = currentTarget.value;
    const targetKey = currentTargetKey.value;
    scheduleTask(() => {
      if (target.daemonAvailable) {
        appendLogByKey(
          targetKey,
          "info",
          target.mode === "global"
            ? "[manual-refresh] global0001 outputlog snapshot pulled."
            : `[manual-refresh] ${target.displayName} outputlog snapshot pulled.`
        );
      } else {
        appendLogByKey(targetKey, "error", "节点离线，手动刷新失败。");
      }
      isRefreshing.value = false;
    }, 180);
  };

  const togglePolling = () => {
    isPollingPaused.value = !isPollingPaused.value;
    if (!currentTarget.value) return;
    appendLog(
      currentTarget.value,
      "info",
      isPollingPaused.value ? "[polling] paused by operator." : "[polling] resumed."
    );
  };

  const clearCurrentLogs = () => {
    const targetKey = currentTargetKey.value;
    if (!targetKey) return;
    logsByTarget.value[targetKey] = [];
  };

  const startCurrentTarget = () => {
    const target = currentTarget.value;
    const targetKey = currentTargetKey.value;
    if (!target || !targetKey) return;
    if (!target.daemonAvailable) {
      appendLog(target, "error", "节点离线，无法执行启动操作。");
      return;
    }

    if (target.mode === "global") {
      if (target.status === INSTANCE_STATUS_CODE.RUNNING) {
        appendLog(target, "warn", "宿主机终端已经处于打开状态。");
        return;
      }
      updateTargetStatus(targetKey, INSTANCE_STATUS_CODE.RUNNING);
      appendLogByKey(targetKey, "info", "[global0001] host shell opened.");
      return;
    }

    if (
      target.status === INSTANCE_STATUS_CODE.RUNNING ||
      target.status === INSTANCE_STATUS_CODE.STARTING
    ) {
      appendLog(target, "warn", "实例已经在运行或启动中。");
      return;
    }

    updateTargetStatus(targetKey, INSTANCE_STATUS_CODE.STARTING);
    appendLogByKey(targetKey, "info", `[instance] start ${target.displayName}`);
    scheduleTask(() => {
      updateTargetStatus(targetKey, INSTANCE_STATUS_CODE.RUNNING);
      appendLogByKey(targetKey, "info", `[instance] ${target.displayName} is now running.`);
    }, 700);
  };

  const stopCurrentTarget = () => {
    const target = currentTarget.value;
    const targetKey = currentTargetKey.value;
    if (!target || !targetKey) return;
    if (!target.daemonAvailable) {
      appendLog(target, "error", "节点离线，无法执行停止操作。");
      return;
    }

    if (target.status === INSTANCE_STATUS_CODE.STOPPED) {
      appendLog(target, "warn", target.mode === "global" ? "宿主机终端已经关闭。" : "实例已经停止。");
      return;
    }

    if (target.mode === "global") {
      updateTargetStatus(targetKey, INSTANCE_STATUS_CODE.STOPPED);
      appendLogByKey(targetKey, "info", "[global0001] host shell closed.");
      return;
    }

    updateTargetStatus(targetKey, INSTANCE_STATUS_CODE.STOPPING);
    appendLogByKey(targetKey, "warn", `[instance] stop ${target.displayName}`);
    scheduleTask(() => {
      updateTargetStatus(targetKey, INSTANCE_STATUS_CODE.STOPPED);
      appendLogByKey(targetKey, "info", `[instance] ${target.displayName} stopped.`);
    }, 650);
  };

  const restartCurrentTarget = () => {
    const target = currentTarget.value;
    const targetKey = currentTargetKey.value;
    if (!target || !targetKey || target.mode !== "instance") return;
    if (!target.daemonAvailable) {
      appendLog(target, "error", "节点离线，无法执行重启操作。");
      return;
    }

    updateTargetStatus(targetKey, INSTANCE_STATUS_CODE.BUSY);
    appendLogByKey(targetKey, "warn", `[instance] restart ${target.displayName}`);
    scheduleTask(() => {
      updateTargetStatus(targetKey, INSTANCE_STATUS_CODE.RUNNING);
      appendLogByKey(targetKey, "info", `[instance] ${target.displayName} restarted successfully.`);
    }, 900);
  };

  const sendCommand = () => {
    const target = currentTarget.value;
    const targetKey = currentTargetKey.value;
    const command = commandInput.value.trim();
    if (!target || !targetKey || !command) return;

    commandInput.value = "";
    appendLogByKey(targetKey, "command", `$ ${command}`);

    if (!target.daemonAvailable) {
      appendLogByKey(targetKey, "error", "节点离线，命令发送失败。");
      return;
    }

    if (target.mode === "global") {
      if (target.status !== INSTANCE_STATUS_CODE.RUNNING) {
        appendLogByKey(targetKey, "error", "宿主机终端尚未打开，请先执行打开操作。");
        return;
      }
      appendLogByKey(targetKey, "info", `[global0001] command accepted: ${command}`);
      return;
    }

    if (target.status !== INSTANCE_STATUS_CODE.RUNNING) {
      appendLogByKey(targetKey, "error", "实例未运行，命令发送失败。");
      return;
    }

    appendLogByKey(targetKey, "info", `[${target.displayName}] command accepted: ${command}`);
  };

  watch(
    currentNode,
    (node) => {
      if (!node) return;
      const target = findTargetByKey(selectedTargetKey.value);
      if (!target || target.daemonId !== node.daemonId) {
        ensureSelectionForNode(node.daemonId);
      }
    },
    { immediate: true }
  );

  watch(
    [currentTargetKey, isPollingPaused],
    () => {
      commandInput.value = "";
      startPoller();
    },
    { immediate: true }
  );

  onUnmounted(() => {
    clearPollTimer();
    pendingTimers.forEach((timerId) => window.clearTimeout(timerId));
    pendingTimers.clear();
  });

  return {
    nodes,
    pollIntervalMs: CONTROL_PREVIEW_POLL_INTERVAL_MS,
    stateSource: "preview" as const,
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
  };
}
