import { overviewInfo } from "@/services/apis";
import { onMounted, onUnmounted } from "vue";

export function useOverviewInfo() {
  const result = overviewInfo();
  let task: NodeJS.Timer | undefined;

  onMounted(async () => {
    await result.execute();
    task = setInterval(async () => {
      await result.execute();
    }, 3000);
  });

  onUnmounted(() => {
    if (task) {
      clearInterval(task);
      task = undefined;
    }
  });

  return result;
}
