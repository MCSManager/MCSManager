import { monitorOverview } from "@/services/apis";
import { onMounted, onUnmounted, ref } from "vue";

export function useMonitorOverview() {
  const result = monitorOverview();
  const state = ref<IMcsmMonitorOverviewResponse>();
  let timer: NodeJS.Timeout | undefined;

  const refresh = async (forceRequest = false) => {
    const nextState = await result.execute({ forceRequest });
    state.value = nextState.value;
    return state.value;
  };

  onMounted(async () => {
    await refresh();
    timer = setInterval(async () => {
      await refresh(true);
    }, 5000);
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
    timer = undefined;
  });

  return {
    ...result,
    state,
    refresh,
    execute: null
  };
}
