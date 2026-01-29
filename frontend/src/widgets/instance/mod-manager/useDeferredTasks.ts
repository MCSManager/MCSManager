import { t } from "@/lang/i18n";
import { deleteModApi, downloadModApi, toggleModApi } from "@/services/apis/modManager";
import { useLocalStorage } from "@vueuse/core";
import { message } from "ant-design-vue";
import { ref } from "vue";

export interface DeferredTask {
  id: string;
  type: string;
  name: string;
  data: any;
  time: number;
}

export function useDeferredTasks(
  instanceId: string,
  daemonId: string,
  reloadFn?: () => Promise<void>
) {
  const deferredTasks = useLocalStorage<DeferredTask[]>(`mcs_mod_deferred_tasks_${instanceId}`, []);
  const autoExecute = useLocalStorage<boolean>(`mcs_mod_auto_execute_${instanceId}`, true);
  const isExecuting = ref(false);

  const addDeferredTask = async (type: string, name: string, data: any) => {
    const task = {
      id: Math.random().toString(36).substring(2),
      type,
      name,
      data,
      time: Date.now()
    };
    deferredTasks.value.push(task);
    message.success(t("TXT_CODE_MOD_DEFERRED_TASK_ADDED"));

    // Sync to backend immediately so that even if the browser is closed, the backend knows there are tasks to execute
    try {
      if (task.type === "download") {
        const { execute } = downloadModApi();
        await execute({ data: { ...task.data, deferred: true } });
      } else if (task.type === "delete") {
        const { execute } = deleteModApi();
        await execute({ data: { ...task.data, deferred: true } });
      } else if (task.type === "toggle") {
        const { execute } = toggleModApi();
        await execute({ data: { ...task.data, deferred: true } });
      }
    } catch (err: any) {
      console.error("Failed to sync deferred task to backend:", err);
    }
  };

  const removeDeferredTask = (id: string) => {
    deferredTasks.value = deferredTasks.value.filter((t) => t.id !== id);
  };

  const executeDeferredTask = async (task: DeferredTask, reload = true) => {
    try {
      if (task.type === "download") {
        const { execute } = downloadModApi();
        await execute({
          data: {
            ...task.data,
            deferred: true
          }
        });
      } else if (task.type === "delete") {
        const { execute } = deleteModApi();
        await execute({
          data: {
            ...task.data,
            deferred: true
          }
        });
      } else if (task.type === "toggle") {
        const { execute } = toggleModApi();
        await execute({
          data: {
            ...task.data,
            deferred: true
          }
        });
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
