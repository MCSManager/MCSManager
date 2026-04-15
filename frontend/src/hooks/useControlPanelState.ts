import { GLOBAL_INSTANCE_NAME, GLOBAL_INSTANCE_UUID } from "@/config/const";
import { TYPE_MINECRAFT_JAVA, verifyEULA } from "@/hooks/useInstance";
import { t } from "@/lang/i18n";
import { remoteInstances, remoteNodeList } from "@/services/apis";
import {
  getInstanceOutputLog,
  openInstance,
  restartInstance,
  sendInstanceCommand,
  stopInstance
} from "@/services/apis/instance";
import {
  CONTROL_MAX_LOG_LINES,
  CONTROL_OUTPUT_LOG_SIZE,
  CONTROL_POLL_INTERVAL_MS,
  createControlLogLine,
  createControlTargetKey,
  normalizeControlOutputLog,
  splitControlOutputLog,
  trimControlLogLines
} from "@/tools/control";
import { reportErrorMsg } from "@/tools/validator";
import type { InstanceDetail, NodeStatus } from "@/types";
import { INSTANCE_STATUS_CODE } from "@/types/const";
import type { ControlLogLine, ControlPreviewNode, ControlTarget } from "@/types/control";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

export const CONTROL_PANEL_POLL_INTERVAL_MS = CONTROL_POLL_INTERVAL_MS;

const CONTROL_INSTANCE_PAGE_SIZE = 50;

type RemoteNodeRecord = NodeStatus & {
  prefix?: string;
};

type RemoteInstanceRecord = InstanceDetail & {
  daemonId?: string;
  daemonIp?: string;
  daemonPort?: number;
  daemonPrefix?: string;
  daemonRemarks?: string;
  daemonAvailable?: boolean;
};

const buildNodeDisplayName = (node: RemoteNodeRecord) => node.remarks?.trim() || node.uuid;

const buildNodeEndpoint = (node: RemoteNodeRecord) => {
  const address = `${node.ip}:${node.port}`;
  return node.prefix ? `${address}${node.prefix}` : address;
};

const buildNodeDescription = (node: RemoteNodeRecord) =>
  node.remarks?.trim() ? `${node.ip}:${node.port}` : node.uuid;

const sortRemoteNodes = (a: RemoteNodeRecord, b: RemoteNodeRecord) => {
  if (a.available !== b.available) {
    return a.available ? -1 : 1;
  }
  return buildNodeDisplayName(a).localeCompare(buildNodeDisplayName(b));
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error ?? "");
};

const resolveControlErrorText = (error: unknown, fallbackText: string) => {
  const message = getErrorMessage(error).trim();
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("403")) return t("TXT_CODE_CONTROL_FORBIDDEN");
  if (lowerMessage.includes("500")) return t("TXT_CODE_CONTROL_SERVER_ERROR");
  if (
    lowerMessage.includes("network error") ||
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("econnrefused") ||
    lowerMessage.includes("timeout")
  ) {
    return t("TXT_CODE_CONTROL_NETWORK_ERROR");
  }

  return message || fallbackText;
};

const buildOutputLogLines = (rawOutput: string) => {
  const lines = splitControlOutputLog(rawOutput);
  if (lines.length === 0) return [];
  const now = new Date();
  return lines.map<ControlLogLine>((text) => createControlLogLine("info", text, now));
};

export function useControlPanelState() {
  const nodes = ref<ControlPreviewNode[]>([]);
  const logsByTarget = ref<Record<string, ControlLogLine[]>>({});
  const rawOutputByTarget = ref<Record<string, string>>({});
  const pollErrorByTarget = ref<Record<string, string>>({});
  const globalStatusByDaemon = ref<Record<string, INSTANCE_STATUS_CODE>>({});
  const loadedDaemons = ref<Record<string, boolean>>({});

  const commandInput = ref("");
  const isPollingPaused = ref(false);
  const isRefreshing = ref(false);
  const selectedDaemonId = ref("");
  const selectedTargetKey = ref("");

  const targetLoaders = new Map<string, Promise<void>>();
  let pollTimer: number | undefined;

  const getGlobalTargetStatus = (daemonId: string, daemonAvailable: boolean) => {
    if (!daemonAvailable) return INSTANCE_STATUS_CODE.STOPPED;
    return globalStatusByDaemon.value[daemonId] ?? INSTANCE_STATUS_CODE.STOPPED;
  };

  const createGlobalTarget = (node: Pick<
    ControlPreviewNode,
    "daemonId" | "daemonDisplayName" | "daemonAvailable"
  >): ControlTarget => ({
    daemonId: node.daemonId,
    daemonDisplayName: node.daemonDisplayName,
    daemonAvailable: node.daemonAvailable,
    mode: "global",
    instanceId: GLOBAL_INSTANCE_UUID,
    displayName: t("TXT_CODE_CONTROL_HOST_SHELL"),
    description: GLOBAL_INSTANCE_UUID,
    status: getGlobalTargetStatus(node.daemonId, node.daemonAvailable),
    instanceType: "universal/web_shell"
  });

  const syncTargetWithNode = (
    node: Pick<ControlPreviewNode, "daemonId" | "daemonDisplayName" | "daemonAvailable">,
    target: ControlTarget
  ): ControlTarget => ({
    ...target,
    daemonId: node.daemonId,
    daemonDisplayName: node.daemonDisplayName,
    daemonAvailable: node.daemonAvailable,
    status:
      target.mode === "global"
        ? getGlobalTargetStatus(node.daemonId, node.daemonAvailable)
        : target.status
  });

  const ensureTargetLogs = (target: ControlTarget) => {
    const targetKey = createControlTargetKey(target);
    if (logsByTarget.value[targetKey]) return;

    const initialLogs = [
      createControlLogLine("info", `[panel] ${target.daemonDisplayName} (${target.daemonId})`),
      createControlLogLine("info", `[target] ${target.displayName} (${target.instanceId})`)
    ];

    logsByTarget.value[targetKey] = trimControlLogLines(initialLogs, CONTROL_MAX_LOG_LINES);
    rawOutputByTarget.value[targetKey] = rawOutputByTarget.value[targetKey] || "";
  };

  const appendLogByKey = (
    targetKey: string,
    level: ControlLogLine["level"],
    text: string,
    date = new Date()
  ) => {
    const nextLogs = [...(logsByTarget.value[targetKey] || []), createControlLogLine(level, text, date)];
    logsByTarget.value[targetKey] = trimControlLogLines(nextLogs, CONTROL_MAX_LOG_LINES);
  };

  const appendLog = (target: ControlTarget, level: ControlLogLine["level"], text: string) => {
    appendLogByKey(createControlTargetKey(target), level, text);
  };

  const findNode = (daemonId: string) => nodes.value.find((node) => node.daemonId === daemonId);

  const findTargetByKey = (targetKey: string) => {
    for (const node of nodes.value) {
      const matched = node.targets.find((target) => createControlTargetKey(target) === targetKey);
      if (matched) return matched;
    }
    return undefined;
  };

  const currentNode = computed(
    () => nodes.value.find((node) => node.daemonId === selectedDaemonId.value) || nodes.value[0]
  );

  const currentTargets = computed(() => currentNode.value?.targets || []);

  const currentTarget = computed(
    () =>
      currentTargets.value.find((target) => createControlTargetKey(target) === selectedTargetKey.value) ||
      currentTargets.value[0]
  );

  const currentTargetKey = computed(() =>
    currentTarget.value ? createControlTargetKey(currentTarget.value) : ""
  );

  const currentLogs = computed(() => {
    const targetKey = currentTargetKey.value;
    if (!targetKey) return [];
    return logsByTarget.value[targetKey] || [];
  });

  const clearPollTimer = () => {
    if (pollTimer) {
      window.clearInterval(pollTimer);
      pollTimer = undefined;
    }
  };

  const reportControlError = (
    error: unknown,
    options: {
      fallbackText: string;
      target?: ControlTarget;
      showToast?: boolean;
      appendErrorLog?: boolean;
    }
  ) => {
    const text = resolveControlErrorText(error, options.fallbackText);
    if (options.appendErrorLog !== false && options.target) {
      appendLog(options.target, "error", text);
    }
    if (options.showToast) {
      reportErrorMsg(new Error(text));
    }
    return text;
  };

  const syncSelectionForDaemon = (daemonId: string) => {
    const node = findNode(daemonId);
    const targets = node?.targets || [];
    if (!targets.length) {
      selectedTargetKey.value = "";
      return;
    }

    const hasSelection = targets.some((target) => createControlTargetKey(target) === selectedTargetKey.value);
    if (!hasSelection) {
      selectedTargetKey.value = createControlTargetKey(targets[0]);
    }
  };

  const applyRemoteNodes = (remoteNodes: RemoteNodeRecord[]) => {
    const previousNodes = new Map(nodes.value.map((node) => [node.daemonId, node]));

    nodes.value = [...remoteNodes]
      .sort(sortRemoteNodes)
      .map<ControlPreviewNode>((remoteNode) => {
        const nextNode: ControlPreviewNode = {
          daemonId: remoteNode.uuid,
          daemonDisplayName: buildNodeDisplayName(remoteNode),
          daemonAvailable: remoteNode.available,
          endpoint: buildNodeEndpoint(remoteNode),
          description: buildNodeDescription(remoteNode),
          targets: []
        };

        const previousTargets = previousNodes.get(nextNode.daemonId)?.targets || [];
        nextNode.targets = previousTargets.length
          ? previousTargets.map((target) => syncTargetWithNode(nextNode, target))
          : [createGlobalTarget(nextNode)];

        nextNode.targets.forEach(ensureTargetLogs);
        return nextNode;
      });

    if (!nodes.value.length) {
      selectedDaemonId.value = "";
      selectedTargetKey.value = "";
      return;
    }

    if (!nodes.value.some((node) => node.daemonId === selectedDaemonId.value)) {
      selectedDaemonId.value = nodes.value[0].daemonId;
      selectedTargetKey.value = createControlTargetKey(createGlobalTarget(nodes.value[0]));
    } else {
      syncSelectionForDaemon(selectedDaemonId.value);
    }
  };

  const updateNodeTargets = (daemonId: string, targets: ControlTarget[]) => {
    const nodeIndex = nodes.value.findIndex((node) => node.daemonId === daemonId);
    if (nodeIndex < 0) return;

    const node = nodes.value[nodeIndex];
    const nextTargets = targets.map((target) => syncTargetWithNode(node, target));
    nextTargets.forEach(ensureTargetLogs);

    nodes.value[nodeIndex] = {
      ...node,
      targets: nextTargets
    };

    syncSelectionForDaemon(daemonId);
  };

  const fetchAllInstancesForDaemon = async (daemonId: string, forceRequest = false) => {
    const list: RemoteInstanceRecord[] = [];
    let page = 1;
    let maxPage = 1;

    do {
      const result = await remoteInstances().execute({
        forceRequest,
        params: {
          daemonId,
          page,
          page_size: CONTROL_INSTANCE_PAGE_SIZE
        }
      });

      const pageData = result.value;
      if (!pageData) break;

      list.push(...((pageData.data || []) as RemoteInstanceRecord[]));
      maxPage = Math.max(1, Number(pageData.maxPage) || 1);
      page += 1;
    } while (page <= maxPage);

    return list;
  };

  const buildTargetsForNode = (node: ControlPreviewNode, instances: RemoteInstanceRecord[]) => {
    const globalTarget = createGlobalTarget(node);
    const instanceTargets = new Map<string, ControlTarget>();

    for (const instance of instances) {
      const instanceId = String(instance.instanceUuid || "");
      if (!instanceId || instanceId === GLOBAL_INSTANCE_UUID) continue;
      if (instance.config?.nickname === GLOBAL_INSTANCE_NAME) continue;

      const description =
        String(instance.config?.type || "").trim() ||
        String(instance.config?.cwd || "").trim() ||
        instanceId;

      instanceTargets.set(instanceId, {
        daemonId: node.daemonId,
        daemonDisplayName: node.daemonDisplayName,
        daemonAvailable: Boolean(instance.daemonAvailable ?? node.daemonAvailable),
        mode: "instance",
        instanceId,
        displayName: String(instance.config?.nickname || instanceId),
        description,
        status: instance.status,
        instanceType: String(instance.config?.type || "")
      });
    }

    return [globalTarget, ...instanceTargets.values()];
  };

  const loadTargetsForDaemon = async (
    daemonId: string,
    options: { forceRequest?: boolean; showToastOnError?: boolean } = {}
  ) => {
    const existingTask = targetLoaders.get(daemonId);
    if (existingTask) return existingTask;
    if (loadedDaemons.value[daemonId] && !options.forceRequest) return;

    const task = (async () => {
      const node = findNode(daemonId);
      if (!node) return;

      if (!node.daemonAvailable) {
        globalStatusByDaemon.value[daemonId] = INSTANCE_STATUS_CODE.STOPPED;
        updateNodeTargets(daemonId, [createGlobalTarget(node)]);
        loadedDaemons.value[daemonId] = true;
        return;
      }

      try {
        const instances = await fetchAllInstancesForDaemon(daemonId, Boolean(options.forceRequest));
        updateNodeTargets(daemonId, buildTargetsForNode(node, instances));
        loadedDaemons.value[daemonId] = true;
      } catch (error) {
        loadedDaemons.value[daemonId] = false;
        reportControlError(error, {
          fallbackText: t("TXT_CODE_CONTROL_LOAD_TARGETS_FAILED"),
          target: currentTarget.value?.daemonId === daemonId ? currentTarget.value : undefined,
          showToast: Boolean(options.showToastOnError)
        });
      }
    })().finally(() => {
      targetLoaders.delete(daemonId);
    });

    targetLoaders.set(daemonId, task);
    return task;
  };

  const loadNodes = async (forceRequest = false, showToastOnError = true) => {
    try {
      const response = await remoteNodeList().execute({ forceRequest });
      applyRemoteNodes((response.value || []) as RemoteNodeRecord[]);
      if (!nodes.value.length && showToastOnError) {
        reportErrorMsg(new Error(t("TXT_CODE_CONTROL_NO_NODES")));
      }
      return true;
    } catch (error) {
      reportControlError(error, {
        fallbackText: t("TXT_CODE_CONTROL_LOAD_NODES_FAILED"),
        showToast: showToastOnError,
        appendErrorLog: false
      });
      return false;
    }
  };

  const applyOutputSnapshot = (targetKey: string, rawOutput: string) => {
    const normalizedOutput = normalizeControlOutputLog(rawOutput);
    const previousOutput = rawOutputByTarget.value[targetKey] || "";

    if (normalizedOutput === previousOutput) return;

    const currentLines = logsByTarget.value[targetKey] || [];
    let nextLines = currentLines;

    if (!previousOutput) {
      nextLines = trimControlLogLines(
        [...currentLines, ...buildOutputLogLines(normalizedOutput)],
        CONTROL_MAX_LOG_LINES
      );
    } else if (normalizedOutput.startsWith(previousOutput)) {
      const appendedOutput = normalizedOutput.slice(previousOutput.length);
      if (appendedOutput) {
        nextLines = trimControlLogLines(
          [...currentLines, ...buildOutputLogLines(appendedOutput)],
          CONTROL_MAX_LOG_LINES
        );
      }
    } else {
      nextLines = trimControlLogLines(buildOutputLogLines(normalizedOutput), CONTROL_MAX_LOG_LINES);
    }

    rawOutputByTarget.value[targetKey] = normalizedOutput;
    logsByTarget.value[targetKey] = nextLines;
  };

  const fetchTargetOutput = async (
    target: ControlTarget,
    options: {
      forceRequest?: boolean;
      showToastOnError?: boolean;
    } = {}
  ) => {
    const targetKey = createControlTargetKey(target);
    ensureTargetLogs(target);

    if (!target.daemonAvailable) {
      const offlineText = t("TXT_CODE_CONTROL_NODE_OFFLINE_ACTION");
      if (pollErrorByTarget.value[targetKey] !== offlineText) {
        appendLogByKey(targetKey, "error", offlineText);
      }
      pollErrorByTarget.value[targetKey] = offlineText;
      if (options.showToastOnError) {
        reportErrorMsg(new Error(offlineText));
      }
      return;
    }

    if (target.mode === "global" && target.status !== INSTANCE_STATUS_CODE.RUNNING) {
      return;
    }

    try {
      const result = await getInstanceOutputLog().execute({
        forceRequest: options.forceRequest,
        params: {
          daemonId: target.daemonId,
          uuid: target.instanceId,
          size: CONTROL_OUTPUT_LOG_SIZE
        }
      });

      applyOutputSnapshot(targetKey, result.value || "");
      delete pollErrorByTarget.value[targetKey];
    } catch (error) {
      const text = reportControlError(error, {
        fallbackText: t("TXT_CODE_CONTROL_OUTPUT_REFRESH_FAILED"),
        showToast: Boolean(options.showToastOnError),
        appendErrorLog: Boolean(options.showToastOnError),
        target
      });

      if (!options.showToastOnError && pollErrorByTarget.value[targetKey] !== text) {
        appendLogByKey(targetKey, "error", text);
      }
      pollErrorByTarget.value[targetKey] = text;
    }
  };

  const startPoller = () => {
    clearPollTimer();
    const target = currentTarget.value;
    if (!target || isPollingPaused.value) return;
    if (!target.daemonAvailable) return;
    if (target.mode === "global" && target.status !== INSTANCE_STATUS_CODE.RUNNING) return;

    void fetchTargetOutput(target, { forceRequest: true });

    pollTimer = window.setInterval(() => {
      const activeTarget = currentTarget.value;
      if (!activeTarget) return;
      void fetchTargetOutput(activeTarget, { forceRequest: true });
    }, CONTROL_PANEL_POLL_INTERVAL_MS);
  };

  const updateTargetStatus = (targetKey: string, status: INSTANCE_STATUS_CODE) => {
    const target = findTargetByKey(targetKey);
    if (!target) return;

    target.status = status;
    if (target.mode === "global") {
      globalStatusByDaemon.value[target.daemonId] = status;
    }
  };

  const selectNode = async (daemonId: string) => {
    if (!daemonId) return;

    const hasNodeChanged = daemonId !== selectedDaemonId.value;
    selectedDaemonId.value = daemonId;

    if (hasNodeChanged) {
      selectedTargetKey.value = createControlTargetKey({
        daemonId,
        mode: "global",
        instanceId: GLOBAL_INSTANCE_UUID
      });
    }

    await loadTargetsForDaemon(daemonId, {
      showToastOnError: hasNodeChanged
    });
  };

  const selectTarget = (target: ControlTarget) => {
    selectedDaemonId.value = target.daemonId;
    selectedTargetKey.value = createControlTargetKey(target);
  };

  const refreshCurrentTarget = async () => {
    const daemonId = currentNode.value?.daemonId;
    const target = currentTarget.value;
    if (!daemonId || isRefreshing.value) return;

    isRefreshing.value = true;
    try {
      const nodeLoaded = await loadNodes(true, false);
      if (!nodeLoaded) {
        reportErrorMsg(new Error(t("TXT_CODE_CONTROL_LOAD_NODES_FAILED")));
        return;
      }

      await loadTargetsForDaemon(daemonId, {
        forceRequest: true,
        showToastOnError: true
      });

      const nextTarget = findTargetByKey(target ? createControlTargetKey(target) : currentTargetKey.value);
      if (nextTarget?.mode === "global" && nextTarget.status !== INSTANCE_STATUS_CODE.RUNNING) {
        appendLog(nextTarget, "warn", t("TXT_CODE_CONTROL_GLOBAL_NOT_OPEN"));
        return;
      }

      if (nextTarget) {
        await fetchTargetOutput(nextTarget, {
          forceRequest: true,
          showToastOnError: true
        });
      }
    } finally {
      isRefreshing.value = false;
    }
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

  const startCurrentTarget = async () => {
    const target = currentTarget.value;
    const targetKey = currentTargetKey.value;
    if (!target || !targetKey) return;

    if (!target.daemonAvailable) {
      const text = t("TXT_CODE_CONTROL_NODE_OFFLINE_ACTION");
      appendLog(target, "error", text);
      reportErrorMsg(new Error(text));
      return;
    }

    if (target.mode === "global") {
      if (target.status === INSTANCE_STATUS_CODE.RUNNING) {
        appendLog(target, "warn", "宿主机终端已经处于打开状态");
        return;
      }

      updateTargetStatus(targetKey, INSTANCE_STATUS_CODE.RUNNING);
      appendLog(target, "info", "[global0001] opening host shell...");

      try {
        await openInstance().execute({
          params: {
            daemonId: target.daemonId,
            uuid: target.instanceId
          }
        });
        appendLog(target, "info", "[global0001] host shell opened.");
        await loadTargetsForDaemon(target.daemonId, {
          forceRequest: true,
          showToastOnError: false
        });
        startPoller();
      } catch (error) {
        updateTargetStatus(targetKey, INSTANCE_STATUS_CODE.STOPPED);
        reportControlError(error, {
          fallbackText: t("TXT_CODE_CONTROL_SERVER_ERROR"),
          target,
          showToast: true
        });
      }

      return;
    }

    if (
      target.status === INSTANCE_STATUS_CODE.RUNNING ||
      target.status === INSTANCE_STATUS_CODE.STARTING
    ) {
      appendLog(target, "warn", "实例已经处于运行中或启动中");
      return;
    }

    if (target.instanceType?.startsWith(TYPE_MINECRAFT_JAVA)) {
      const accepted = await verifyEULA(target.instanceId, target.daemonId);
      if (!accepted) return;
    }

    updateTargetStatus(targetKey, INSTANCE_STATUS_CODE.STARTING);
    appendLog(target, "info", `[instance] start ${target.displayName}`);

    try {
      await openInstance().execute({
        params: {
          daemonId: target.daemonId,
          uuid: target.instanceId
        }
      });
      appendLog(target, "info", `[instance] ${target.displayName} start request sent.`);
      await loadTargetsForDaemon(target.daemonId, {
        forceRequest: true,
        showToastOnError: false
      });
    } catch (error) {
      await loadTargetsForDaemon(target.daemonId, {
        forceRequest: true,
        showToastOnError: false
      });
      reportControlError(error, {
        fallbackText: t("TXT_CODE_CONTROL_SERVER_ERROR"),
        target,
        showToast: true
      });
    }
  };

  const stopCurrentTarget = async () => {
    const target = currentTarget.value;
    const targetKey = currentTargetKey.value;
    if (!target || !targetKey) return;

    if (!target.daemonAvailable) {
      const text = t("TXT_CODE_CONTROL_NODE_OFFLINE_ACTION");
      appendLog(target, "error", text);
      reportErrorMsg(new Error(text));
      return;
    }

    if (target.status === INSTANCE_STATUS_CODE.STOPPED) {
      appendLog(target, "warn", target.mode === "global" ? "宿主机终端已经关闭" : "实例已经停止");
      return;
    }

    const nextStatus =
      target.mode === "global" ? INSTANCE_STATUS_CODE.STOPPED : INSTANCE_STATUS_CODE.STOPPING;
    updateTargetStatus(targetKey, nextStatus);
    appendLog(
      target,
      target.mode === "global" ? "info" : "warn",
      target.mode === "global"
        ? "[global0001] closing host shell..."
        : `[instance] stop ${target.displayName}`
    );

    try {
      await stopInstance().execute({
        params: {
          daemonId: target.daemonId,
          uuid: target.instanceId
        }
      });

      if (target.mode === "global") {
        appendLog(target, "info", "[global0001] host shell closed.");
        clearPollTimer();
      } else {
        appendLog(target, "info", `[instance] ${target.displayName} stop request sent.`);
      }

      await loadTargetsForDaemon(target.daemonId, {
        forceRequest: true,
        showToastOnError: false
      });
    } catch (error) {
      await loadTargetsForDaemon(target.daemonId, {
        forceRequest: true,
        showToastOnError: false
      });
      reportControlError(error, {
        fallbackText: t("TXT_CODE_CONTROL_SERVER_ERROR"),
        target,
        showToast: true
      });
    }
  };

  const restartCurrentTarget = async () => {
    const target = currentTarget.value;
    const targetKey = currentTargetKey.value;
    if (!target || !targetKey || target.mode !== "instance") return;

    if (!target.daemonAvailable) {
      const text = t("TXT_CODE_CONTROL_NODE_OFFLINE_ACTION");
      appendLog(target, "error", text);
      reportErrorMsg(new Error(text));
      return;
    }

    updateTargetStatus(targetKey, INSTANCE_STATUS_CODE.BUSY);
    appendLog(target, "warn", `[instance] restart ${target.displayName}`);

    try {
      await restartInstance().execute({
        params: {
          daemonId: target.daemonId,
          uuid: target.instanceId
        }
      });
      appendLog(target, "info", `[instance] ${target.displayName} restart request sent.`);
      await loadTargetsForDaemon(target.daemonId, {
        forceRequest: true,
        showToastOnError: false
      });
    } catch (error) {
      await loadTargetsForDaemon(target.daemonId, {
        forceRequest: true,
        showToastOnError: false
      });
      reportControlError(error, {
        fallbackText: t("TXT_CODE_CONTROL_SERVER_ERROR"),
        target,
        showToast: true
      });
    }
  };

  const sendCommand = async () => {
    const target = currentTarget.value;
    const command = commandInput.value.trim();
    if (!target || !command) return;

    commandInput.value = "";
    appendLog(target, "command", `$ ${command}`);

    if (!target.daemonAvailable) {
      const text = t("TXT_CODE_CONTROL_NODE_OFFLINE_ACTION");
      appendLog(target, "error", text);
      reportErrorMsg(new Error(text));
      return;
    }

    if (target.mode === "global" && target.status !== INSTANCE_STATUS_CODE.RUNNING) {
      const text = t("TXT_CODE_CONTROL_GLOBAL_NOT_OPEN");
      appendLog(target, "error", text);
      reportErrorMsg(new Error(text));
      return;
    }

    if (target.mode === "instance" && target.status !== INSTANCE_STATUS_CODE.RUNNING) {
      const text = t("TXT_CODE_CONTROL_INSTANCE_NOT_RUNNING");
      appendLog(target, "error", text);
      reportErrorMsg(new Error(text));
      return;
    }

    try {
      await sendInstanceCommand().execute({
        params: {
          daemonId: target.daemonId,
          uuid: target.instanceId,
          command
        }
      });
      appendLog(
        target,
        "info",
        target.mode === "global"
          ? `[global0001] command accepted: ${command}`
          : `[${target.displayName}] command accepted: ${command}`
      );
    } catch (error) {
      reportControlError(error, {
        fallbackText: t("TXT_CODE_CONTROL_COMMAND_FAILED"),
        target,
        showToast: true
      });
    }
  };

  watch(
    [currentTargetKey, isPollingPaused],
    () => {
      commandInput.value = "";
      startPoller();
    },
    { immediate: true }
  );

  onMounted(async () => {
    const loaded = await loadNodes(false, true);
    if (!loaded || !nodes.value.length) return;

    if (!selectedDaemonId.value) {
      selectedDaemonId.value = nodes.value[0].daemonId;
      selectedTargetKey.value = createControlTargetKey(createGlobalTarget(nodes.value[0]));
    }

    await loadTargetsForDaemon(selectedDaemonId.value, {
      showToastOnError: true
    });
  });

  onUnmounted(() => {
    clearPollTimer();
    targetLoaders.clear();
  });

  return {
    nodes,
    pollIntervalMs: CONTROL_PANEL_POLL_INTERVAL_MS,
    stateSource: "panel" as const,
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
