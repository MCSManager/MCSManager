<script setup lang="ts">
import { computed } from "vue";
import { t } from "@/lang/i18n";
import { useScreen } from "@/hooks/useScreen";
import { useDeferredTasks } from "./useDeferredTasks";
import {
  FloatButton,
  Popover,
  Button,
  Space,
  Progress,
  Switch
} from "ant-design-vue";
import {
  ClockCircleOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  LoadingOutlined,
  SwapOutlined
} from "@ant-design/icons-vue";

import {
  stopTransferApi
} from "@/services/apis/modManager";
import { message } from "ant-design-vue";

const props = defineProps<{
  instanceId: string;
  daemonId: string;
  deferredTasks: any[];
  autoExecute: boolean;
  fileStatus: any;
  isExecuting: boolean;
}>();

const emit = defineEmits<{
  (e: "update:deferredTasks", value: any[]): void;
  (e: "update:autoExecute", value: boolean): void;
  (e: "executeTask", task: any): void;
  (e: "executeAll"): void;
  (e: "clearAll"): void;
  (e: "removeTask", id: string): void;
  (e: "refresh"): void;
}>();

const { isPhone } = useScreen();

const activeTasksCount = computed(() => {
  return props.fileStatus?.downloadTasks?.filter((t: any) => t.status === 0).length || 0;
});

const localDeferredTasks = computed({
  get: () => props.deferredTasks,
  set: (val) => emit("update:deferredTasks", val)
});

const localAutoExecute = computed({
  get: () => props.autoExecute,
  set: (val) => emit("update:autoExecute", val)
});

const onStopTransfer = async (task: any) => {
  try {
    const { execute } = stopTransferApi();
    await execute({
      data: {
        daemonId: props.daemonId,
        uuid: props.instanceId,
        fileName: task.path,
        type: task.type,
        uploadId: task.id
      }
    });
    message.success(t("TXT_CODE_7f0c746d"));
    emit("refresh");
  } catch (err: any) {
    message.error(err.message);
  }
};
</script>

<template>
  <teleport to="body">
    <div>
      <!-- Deferred Queue Button (Top) -->
      <Popover placement="leftBottom" trigger="click" overlay-class-name="frosted-popover" :arrow="false">
        <template #content>
          <div class="w-[400px] max-h-[600px] overflow-y-auto p-4 custom-scrollbar">
            <div class="flex items-center justify-between mb-6 px-1">
              <div class="flex items-center gap-3">
                <div class="w-1 h-5 bg-blue-500 rounded-sm shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                <span class="font-bold text-lg tracking-tight">{{ t("TXT_CODE_MOD_DEFERRED_QUEUE") }}</span>
                <span class="text-sm opacity-30 font-mono bg-gray-500/10 px-2 py-0.5 rounded-md">{{ props.deferredTasks.length }}</span>
              </div>
              <Space :size="12">
                <Button size="small" type="link" class="px-0 text-sm font-medium text-red-500 hover:text-red-400" @click="emit('clearAll')" v-if="props.deferredTasks.length > 0">
                  {{ t("TXT_CODE_MOD_CLEAR_QUEUE") }}
                </Button>
                <Button size="small" type="link" class="px-0 text-sm font-medium" @click="emit('executeAll')" v-if="props.deferredTasks.length > 0" :loading="isExecuting">
                  {{ t("TXT_CODE_MOD_EXECUTE_ALL") }}
                </Button>
              </Space>
            </div>

            <!-- Auto Execute Switch (Always at top) -->
            <div class="flex items-center justify-between px-4 py-2.5 mb-6 bg-blue-500/10 dark:bg-blue-400/10 rounded-xl border border-blue-500/20 dark:border-blue-400/20 transition-all hover:bg-blue-500/15 dark:hover:bg-blue-400/15">
              <span class="text-sm font-semibold text-blue-600 dark:text-blue-400 opacity-90">关服自动运行</span>
              <Switch v-model:checked="localAutoExecute" size="small" />
            </div>

            <div v-if="props.deferredTasks.length === 0" class="py-16 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-500/5 mb-4">
                <ClockCircleOutlined style="font-size: 28px" class="opacity-10" />
              </div>
              <div class="text-xs opacity-20 tracking-[0.2em] font-light uppercase">{{ t("TXT_CODE_NO_DATA") }}</div>
            </div>

            <div class="flex flex-col gap-3">
              <div
                v-for="task in props.deferredTasks"
                :key="task.id"
                class="group relative overflow-hidden border border-black/[0.03] dark:border-white/[0.05] rounded-xl bg-black/[0.02] dark:bg-white/[0.04] p-4 transition-all hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:shadow-lg hover:shadow-black/5"
              >
                <div class="flex items-center justify-between">
                  <div class="flex flex-col overflow-hidden flex-1 mr-4">
                    <div class="flex items-center gap-2 mb-1.5">
                      <span class="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider border border-blue-500/20">
                        {{ task.type }}
                      </span>
                    </div>
                    <span class="font-semibold text-base truncate opacity-90" :title="task.name">{{ task.name }}</span>
                  </div>
                  <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <Button size="large" type="text" class="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-blue-500/10 text-blue-500 dark:text-blue-400" @click="emit('executeTask', task)">
                      <template #icon><PlayCircleOutlined style="font-size: 18px" /></template>
                    </Button>
                    <Button size="large" type="text" danger class="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-red-500/10" @click="emit('removeTask', task.id)">
                      <template #icon><DeleteOutlined style="font-size: 18px" /></template>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <FloatButton
          class="frosted-float-button"
          :style="{ right: '24px', bottom: '100px', zIndex: 9999 }"
          :tooltip="t('TXT_CODE_MOD_DEFERRED_QUEUE')"
          :badge="{ count: props.deferredTasks.length, overflowCount: 99, showZero: false }"
        >
          <template #icon>
            <clock-circle-outlined />
          </template>
        </FloatButton>
      </Popover>

      <!-- Download Manager Button (Bottom) -->
      <Popover placement="leftBottom" trigger="click" overlay-class-name="frosted-popover" :arrow="false">
        <template #content>
          <div class="w-[400px] max-h-[600px] overflow-y-auto p-4 custom-scrollbar">
            <div class="flex items-center justify-between mb-6 px-1">
              <div class="flex items-center gap-3">
                <div class="w-1 h-5 bg-orange-500 rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.3)]"></div>
                <span class="font-bold text-lg tracking-tight">{{ t("TXT_CODE_TRANSFER_MANAGER") }}</span>
                <span class="text-sm opacity-30 font-mono bg-gray-500/10 px-2 py-0.5 rounded-md">{{ fileStatus?.downloadTasks?.length || 0 }}</span>
              </div>
            </div>

            <div v-if="!fileStatus?.downloadTasks?.length && !fileStatus?.downloadFileFromURLTask" class="py-16 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-500/5 mb-4">
                <SwapOutlined style="font-size: 28px" class="opacity-10" />
              </div>
              <div class="text-xs opacity-20 tracking-[0.2em] font-light uppercase">{{ t("TXT_CODE_NO_TRANSFER_TASK") }}</div>
            </div>
            
            <div v-if="fileStatus?.downloadFileFromURLTask > 0 && (!fileStatus.downloadTasks || fileStatus.downloadTasks.length === 0)" 
              class="flex items-center gap-4 p-5 rounded-xl bg-blue-500/5 border border-blue-500/10 mb-4">
              <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shadow-inner">
                <loading-outlined class="text-blue-500 dark:text-blue-400 text-lg" />
              </div>
              <span class="text-base font-semibold opacity-80">{{ t("TXT_CODE_8b7fe641", { count: fileStatus.downloadFileFromURLTask }) }}</span>
            </div>

            <div class="flex flex-col gap-3">
              <div
                v-for="task in fileStatus.downloadTasks"
                :key="task.path"
                class="group relative overflow-hidden border border-black/[0.03] dark:border-white/[0.05] rounded-xl bg-black/[0.02] dark:bg-white/[0.04] p-4 transition-all hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:shadow-lg hover:shadow-black/5"
              >
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-4 overflow-hidden flex-1">
                    <div :class="[
                      'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm',
                      task.type === 'download' ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400' : 'bg-orange-500/10 text-orange-500 dark:text-orange-400'
                    ]">
                      <CloudDownloadOutlined v-if="task.type === 'download'" style="font-size: 22px" />
                      <CloudUploadOutlined v-else style="font-size: 22px" />
                    </div>
                    <div class="min-w-0 flex-1 text-left">
                      <div class="font-semibold text-base truncate w-full opacity-90 mb-1" :title="task.path">
                        {{ task.path.split(/[\\/]/).pop() || task.path }}
                      </div>
                      <div class="text-xs opacity-40 font-mono flex items-center gap-2">
                        <span v-if="task.status === 2" class="text-red-500 dark:text-red-400 font-bold">{{ task.error || t("TXT_CODE_DOWNLOAD_FAILED") }}</span>
                        <span v-else-if="task.status === 1" class="text-green-500 dark:text-green-400 font-bold">{{ t("TXT_CODE_FINISHED") }}</span>
                        <template v-else>
                          <span class="font-bold text-gray-600 dark:text-gray-300">{{ (task.current / 1024 / 1024).toFixed(2) }}MB</span>
                          <span v-if="task.total > 0" class="opacity-50">/ {{ (task.total / 1024 / 1024).toFixed(2) }}MB</span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <div class="text-right ml-4 flex-shrink-0 flex items-center gap-3">
                    <span
                      :class="[
                        'text-sm font-black font-mono tracking-tighter',
                        task.status === 2 ? 'text-red-500' : task.status === 1 ? 'text-green-500' : task.type === 'upload' ? 'text-orange-500' : 'text-blue-500'
                      ]"
                    >
                      {{ task.total > 0 ? Math.floor((task.current / task.total) * 100) : 0 }}%
                    </span>
                    <Button
                      v-if="task.status === 0"
                      size="large"
                      type="text"
                      danger
                      class="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                      @click="onStopTransfer(task)"
                    >
                      <template #icon><DeleteOutlined style="font-size: 18px" /></template>
                    </Button>
                  </div>
                </div>
                <div class="mt-3">
                  <Progress
                    :percent="task.status === 1 ? 100 : (task.total > 0 ? Math.floor((task.current / task.total) * 100) : 0)"
                    :show-info="false"
                    :status="task.status === 2 ? 'exception' : task.status === 1 ? 'success' : 'active'"
                    :stroke-width="6"
                    :stroke-color="task.status === 2 ? '#ef4444' : task.status === 1 ? '#22c55e' : task.type === 'upload' ? '#f97316' : '#3b82f6'"
                    class="m-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
        <FloatButton
          class="frosted-float-button"
          :style="{ right: '24px', bottom: '24px', zIndex: 9999 }"
          :tooltip="t('TXT_CODE_TRANSFER_MANAGER')"
          :badge="{ count: activeTasksCount, overflowCount: 999, showZero: false }"
        >
          <template #icon>
            <SwapOutlined />
          </template>
        </FloatButton>
      </Popover>
    </div>
  </teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.4);
}

@media (max-width: 585px) {
  .frosted-float-button {
    right: 24px !important;
    transform: translateX(34px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    opacity: 0.6;
  }
  .frosted-float-button::after {
    content: "";
    position: absolute;
    top: -10px;
    bottom: -10px;
    left: -20px;
    right: -40px;
    background: transparent;
    cursor: pointer;
  }
  .frosted-float-button:hover,
  .frosted-float-button:active {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>

<style>
.frosted-popover .ant-popover-inner {
  background-color: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(30px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(30px) saturate(200%) !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 20px 50px 0 rgba(0, 0, 0, 0.1) !important;
  border-radius: 16px !important;
  padding: 12px !important;
  color: #111827 !important;
}

.app-dark-theme .frosted-popover .ant-popover-inner {
  background-color: rgba(10, 10, 10, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 20px 50px 0 rgba(0, 0, 0, 0.6) !important;
  color: #f9fafb !important;
}

.frosted-popover .ant-popover-arrow {
  display: none !important;
}

.frosted-float-button .ant-float-button-body {
  background-color: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08) !important;
  border-radius: 12px !important;
  color: #111827 !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
}

.app-dark-theme .frosted-float-button .ant-float-button-body {
  background-color: rgba(10, 10, 10, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: #f9fafb !important;
}

.frosted-float-button .ant-float-button-body:hover {
  background-color: rgba(255, 255, 255, 0.8) !important;
  transform: translateY(-2px);
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.2) !important;
}

.app-dark-theme .frosted-float-button .ant-float-button-body:hover {
  background-color: rgba(31, 41, 55, 0.8) !important;
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5) !important;
}
</style>
