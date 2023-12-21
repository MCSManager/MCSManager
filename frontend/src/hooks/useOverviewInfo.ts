import { overviewInfo } from "@/services/apis";
import { onMounted, onUnmounted, ref, type Ref } from "vue";
import type { IPanelOverviewRemoteResponse, IPanelOverviewResponse } from "../../../common/global";

export interface ComputedOverviewResponse extends IPanelOverviewResponse {
  totalInstance: number;
  runningInstance: number;
  cpu: number;
  mem: number;
  remote: ComputedNodeInfo[];
}

export interface ComputedNodeInfo extends IPanelOverviewRemoteResponse {
  platformText?: string;
  cpuInfo?: string;
  instanceStatus?: string;
  memText?: string;
  cpuChartData?: number[];
  memChartData?: number[];
}

function computeResponseData(v: Ref<IPanelOverviewResponse | undefined>) {
  const currentState = v.value as ComputedOverviewResponse;

  let totalInstance = 0;
  let runningInstance = 0;
  for (const iterator of currentState.remote || []) {
    if (iterator.instance) {
      totalInstance += iterator.instance.total;
      runningInstance += iterator.instance.running;
    }
  }

  currentState.totalInstance = totalInstance;
  currentState.runningInstance = runningInstance;

  let cpu = Number(currentState.system.cpu * 100).toFixed(0);
  let mem = Number((currentState.system.freemem / currentState.system.totalmem) * 100).toFixed(0);

  currentState.cpu = Number(cpu);
  currentState.mem = Number(mem);

  const newNodes = v.value?.remote as ComputedNodeInfo[] | undefined;
  if (newNodes) {
    for (let node of newNodes) {
      if (!node.system || !node.instance || !node.cpuMemChart) continue;
      const free = Number(node.system.freemem / 1024 / 1024 / 1024).toFixed(1);
      const total = Number(node.system.totalmem / 1024 / 1024 / 1024).toFixed(1);
      const used = Number(Number(total) - Number(free)).toFixed(1);
      node.platformText =
        node?.system?.platform == "win32" ? "windows" : node?.system?.platform || "--";
      node.instanceStatus = `${node.instance.running}/${node.instance.total}`;
      node.cpuInfo = `${Number(node.system.cpuUsage * 100).toFixed(1)}%`;
      node.memText = `${used}G/${total}G`;
      node.cpuChartData = node?.cpuMemChart.map((v) => v.cpu);
      node.memChartData = node?.cpuMemChart.map((v) => v.mem);
    }
  }
  return currentState;
}

export function useOverviewInfo() {
  const result = overviewInfo();
  let task: NodeJS.Timer | undefined;

  const newState = ref<ComputedOverviewResponse>();

  const refresh = async (forceRequest = false) => {
    newState.value = computeResponseData(
      await result.execute({
        forceRequest
      })
    );
  };

  onMounted(async () => {
    refresh();
    task = setInterval(async () => {
      await refresh();
    }, 3000);
  });

  onUnmounted(() => {
    if (task) {
      clearInterval(task);
      task = undefined;
    }
  });

  return {
    ...result,
    state: newState,
    refresh,
    execute: null
  };
}
