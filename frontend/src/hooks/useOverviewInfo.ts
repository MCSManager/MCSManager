import { overviewInfo } from "@/services/apis";
import { computed, onMounted, onUnmounted, type Ref } from "vue";
import type { IPanelOverviewResponse } from "../../../common/global";

interface ComputedOverviewResponse extends IPanelOverviewResponse {
  totalInstance: number;
  runningInstance: number;
  cpu: number;
  mem: number;
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
}

export function useOverviewInfo() {
  const result = overviewInfo();
  let task: NodeJS.Timer | undefined;

  onMounted(async () => {
    computeResponseData(await result.execute());
    task = setInterval(async () => {
      computeResponseData(await result.execute());
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
    state: result.state as Ref<ComputedOverviewResponse | undefined>,
    execute: null
  };
}
