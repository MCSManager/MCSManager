import { ref } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { message } from "ant-design-vue";
import { t } from "@/lang/i18n";
import {
  toggleModApi,
  deleteModApi,
  downloadModApi
} from "@/services/apis/modManager";

export function useDeferredTasks(instanceId: string, daemonId: string, reloadFn?: () => Promise<void>) {
  const deferredTasks = useLocalStorage<any[]>(`mcs_mod_deferred_tasks_${instanceId}`, []);
  const autoExecute = useLocalStorage<boolean>(`mcs_mod_auto_execute_${instanceId}`, true);
  const isExecuting = ref(false);

  const addDeferredTask = (type: string, name: string, data: any) => {
    deferredTasks.value.push({
      id: Math.random().toString(36).substring(2),
      type,
      name,
      data,
      time: Date.now()
    });
    message.success(t("TXT_CODE_MOD_DEFERRED_TASK_ADDED"));
  };

  const removeDeferredTask = (id: string) => {
    deferredTasks.value = deferredTasks.value.filter((t) => t.id !== id);
  };

  const executeDeferredTask = async (task: any, reload = true) => {
    try {
      if (task.type === "download") {
        const { execute } = downloadModApi();
        await execute({ data: task.data });
      } else if (task.type === "delete") {
        const { execute } = deleteModApi();
        await execute({ data: task.data });
      } else if (task.type === "toggle") {
        const { execute } = toggleModApi();
        await execute({ data: task.data });
      }
      removeDeferredTask(task.id);
      message.success(`${t("TXT_CODE_7f0c746d")}: ${task.name}`);
      if (reload && reloadFn) await reloadFn();
    } catch (err: any) {
      message.error(`${task.name}: ${err.message}`);
    }
  };

  const executeAllDeferredTasks = async () => {
    if (isExecuting.value || deferredTasks.value.length === 0) return;
    isExecuting.value = true;
    try {
      const tasks = [...deferredTasks.value];
      message.info(
        t("TXT_CODE_MOD_DEFERRED_REMIND_DESC", {
          count: tasks.length
        })
      );
      for (const task of tasks) {
        await executeDeferredTask(task, false);
      }
      if (reloadFn) await reloadFn();
    } finally {
      isExecuting.value = false;
    }
  };

  return {
    deferredTasks,
    autoExecute,
    isExecuting,
    addDeferredTask,
    removeDeferredTask,
    executeDeferredTask,
    executeAllDeferredTasks
  };
}
