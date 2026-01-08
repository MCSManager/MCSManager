import { ref, watch, onMounted } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { message } from "ant-design-vue";
import { t } from "@/lang/i18n";
import {
  toggleModApi,
  deleteModApi,
  downloadModApi,
  getDeferredTasksApi,
  setAutoExecuteApi,
  clearDeferredTasksApi
} from "@/services/apis/modManager";

export interface DeferredTask {
  id: string;
  type: string;
  name: string;
  data: any;
  time: number;
}

export function useDeferredTasks(instanceId: string, daemonId: string, reloadFn?: () => Promise<void>) {
  const deferredTasks = useLocalStorage<DeferredTask[]>(`mcs_mod_deferred_tasks_${instanceId}`, []);
  const autoExecute = useLocalStorage<boolean>(`mcs_mod_auto_execute_${instanceId}`, true);
  const isExecuting = ref(false);

  const syncWithBackend = async () => {
    try {
      const { execute } = getDeferredTasksApi();
      const backendTasks = await execute({
        params: {
          daemonId,
          uuid: instanceId
        }
      });

      // As long as the backend returns a result (even an empty array), sync the frontend based on the backend
      if (Array.isArray(backendTasks)) {
        if (backendTasks.length === 0) {
          if (deferredTasks.value.length > 0) {
            console.log("[ModManager] Backend queue is empty, clearing frontend queue.");
            deferredTasks.value = [];
            if (reloadFn) await reloadFn();
          }
        } else {
          console.log(`[ModManager] Syncing ${backendTasks.length} tasks from backend.`);
          deferredTasks.value = backendTasks.map((t: any) => ({
            id: t.id || Math.random().toString(36).substring(2),
            type: t.type,
            name: t.fileName || t.url || "Task",
            data: t,
            time: Date.now()
          }));
        }
      }
    } catch (err) {
      console.error("Failed to sync with backend:", err);
    }
  };

  const clearAllTasks = async () => {
    try {
      const { execute } = clearDeferredTasksApi();
      await execute({
        data: {
          daemonId,
          uuid: instanceId
        }
      });
      deferredTasks.value = [];
      message.success(t("TXT_CODE_7f0c746d"));
    } catch (err: any) {
      message.error(err.message);
    }
  };

  watch(autoExecute, async (val) => {
    try {
      const { execute } = setAutoExecuteApi();
      await execute({
        data: {
          daemonId,
          uuid: instanceId,
          enabled: val
        }
      });
    } catch (err) {
      console.error("Failed to update auto-execute status:", err);
    }
  });

  onMounted(async () => {
    await syncWithBackend();
    // Initial sync of the auto-execute toggle state
    try {
      const { execute: setAuto } = setAutoExecuteApi();
      await setAuto({
        data: {
          daemonId,
          uuid: instanceId,
          enabled: autoExecute.value
        }
      });
    } catch (err) {
      // ignore
    }
  });

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
    syncWithBackend,
    clearAllTasks,
    addDeferredTask,
    removeDeferredTask,
    executeDeferredTask,
    executeAllDeferredTasks
  };
}
