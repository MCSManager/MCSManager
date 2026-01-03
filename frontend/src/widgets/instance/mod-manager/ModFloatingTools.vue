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
  Progress
} from "ant-design-vue";
import {
  ClockCircleOutlined,
  CloudDownloadOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  LoadingOutlined
} from "@ant-design/icons-vue";

const props = defineProps<{
  deferredTasks: any[];
  fileStatus: any;
  isExecuting: boolean;
}>();

const emit = defineEmits<{
  (e: "update:deferredTasks", value: any[]): void;
  (e: "executeTask", task: any): void;
  (e: "executeAll"): void;
  (e: "removeTask", id: string): void;
}>();

const { isPhone } = useScreen();

const activeTasksCount = computed(() => {
  return props.fileStatus?.downloadTasks?.filter((t: any) => t.status === 0).length || 0;
});

const localDeferredTasks = computed({
  get: () => props.deferredTasks,
  set: (val) => emit("update:deferredTasks", val)
});
</script>

<template>
  <teleport to="body">
    <div>
      <!-- Deferred Queue Button (Top) -->
      <Popover placement="leftBottom" trigger="click" overlay-class-name="frosted-popover">
        <template #content>
          <div class="w-80 max-h-96 overflow-y-auto p-1">
            <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-500/20">
              <span class="font-bold opacity-90">{{ t("TXT_CODE_MOD_DEFERRED_QUEUE") }} ({{ deferredTasks.length }})</span>
              <Space>
                <Button size="small" type="link" @click="emit('executeAll')" v-if="deferredTasks.length > 0" :loading="isExecuting">
                  {{ t("TXT_CODE_MOD_EXECUTE_ALL") }}
                </Button>
                <Button size="small" type="link" danger @click="localDeferredTasks = []" v-if="deferredTasks.length > 0">
                  {{ t("TXT_CODE_MOD_CLEAR_QUEUE") }}
                </Button>
              </Space>
            </div>

            <div v-if="deferredTasks.length === 0" class="py-8 text-center opacity-40">
              <ClockCircleOutlined style="font-size: 40px" class="mb-2" />
              <div>{{ t("TXT_CODE_NO_DATA") }}</div>
            </div>

            <div class="flex flex-col gap-3">
              <div
                v-for="task in deferredTasks"
                :key="task.id"
                class="relative overflow-hidden border border-gray-500/10 rounded-lg bg-gray-500/5 p-3 shadow-sm transition-all"
              >
                <div class="flex items-center justify-between">
                  <div class="flex flex-col overflow-hidden flex-1 mr-2">
                    <span class="text-[10px] opacity-50 uppercase font-bold">{{ task.type }}</span>
                    <span class="font-bold text-sm truncate" :title="task.name">{{ task.name }}</span>
                  </div>
                  <Space :size="4">
                    <Button size="small" type="text" @click="emit('executeTask', task)">
                      <template #icon><PlayCircleOutlined /></template>
                    </Button>
                    <Button size="small" type="text" danger @click="emit('removeTask', task.id)">
                      <template #icon><DeleteOutlined /></template>
                    </Button>
                  </Space>
                </div>
              </div>
            </div>
          </div>
        </template>
        <FloatButton
          class="frosted-float-button"
          :style="{ right: '24px', bottom: '100px', zIndex: 9999 }"
          :tooltip="t('TXT_CODE_MOD_DEFERRED_QUEUE')"
          :badge="{ count: deferredTasks.length, overflowCount: 99, showZero: false }"
        >
          <template #icon>
            <clock-circle-outlined />
          </template>
        </FloatButton>
      </Popover>

      <!-- Download Manager Button (Bottom) -->
      <Popover placement="leftBottom" trigger="click" overlay-class-name="frosted-popover">
        <template #content>
          <div class="w-80 max-h-96 overflow-y-auto p-1">
            <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-500/20">
              <span class="font-bold opacity-90">{{ t("TXT_CODE_DOWNLOAD_MANAGER") }} ({{ fileStatus?.downloadTasks?.length || 0 }})</span>
            </div>

            <div v-if="!fileStatus?.downloadTasks?.length && !fileStatus?.downloadFileFromURLTask" class="py-8 text-center opacity-40">
              <cloud-download-outlined style="font-size: 40px" class="mb-2" />
              <div>{{ t("TXT_CODE_NO_DOWNLOAD_TASK") }}</div>
            </div>
            
            <div v-if="fileStatus?.downloadFileFromURLTask > 0 && (!fileStatus.downloadTasks || fileStatus.downloadTasks.length === 0)" class="flex items-center opacity-80 p-2">
              <loading-outlined class="mr-3 text-blue-500" />
              <span>{{ t("TXT_CODE_8b7fe641", { count: fileStatus.downloadFileFromURLTask }) }}</span>
            </div>

            <div class="flex flex-col gap-3">
              <div
                v-for="task in fileStatus.downloadTasks"
                :key="task.path"
                class="relative overflow-hidden border border-gray-500/10 rounded-lg bg-gray-500/5 p-3 shadow-sm transition-all"
              >
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2 overflow-hidden flex-1">
                    <div class="min-w-0 flex-1 text-left">
                      <div class="font-bold text-sm truncate w-full opacity-90" :title="task.path">
                        {{ task.path.split(/[\\/]/).pop() || task.path }}
                      </div>
                      <div class="text-[10px] opacity-50 truncate w-full">
                        <span v-if="task.status === 2" class="text-red-500">{{ task.error || "Download Failed" }}</span>
                        <span v-else-if="task.status === 1" class="text-green-500">Finished</span>
                        <template v-else>
                          {{ (task.current / 1024 / 1024).toFixed(2) }}MB
                          <span v-if="task.total > 0"> / {{ (task.total / 1024 / 1024).toFixed(2) }}MB</span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <div class="text-right ml-2 flex-shrink-0">
                    <span
                      :class="[
                        'text-xs font-bold',
                        task.status === 2 ? 'text-red-500' : task.status === 1 ? 'text-green-500' : 'text-blue-500'
                      ]"
                    >
                      {{ task.total > 0 ? Math.floor((task.current / task.total) * 100) : 0 }}%
                    </span>
                  </div>
                </div>
                <Progress
                  :percent="task.total > 0 ? Math.floor((task.current / task.total) * 100) : 0"
                  :show-info="false"
                  :status="task.status === 2 ? 'exception' : task.status === 1 ? 'success' : 'active'"
                  :stroke-width="4"
                  :stroke-color="task.status === 2 ? '#ff4d4f' : task.status === 1 ? '#52c41a' : '#1890ff'"
                />
              </div>
            </div>
          </div>
        </template>
        <FloatButton
          class="frosted-float-button"
          :style="{ right: '24px', bottom: '24px', zIndex: 9999 }"
          :tooltip="t('TXT_CODE_DOWNLOAD_MANAGER')"
          :badge="{ count: activeTasksCount, overflowCount: 999, showZero: false }"
        >
          <template #icon>
            <cloud-download-outlined />
          </template>
        </FloatButton>
      </Popover>
    </div>
  </teleport>
</template>

<style scoped>
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
  background-color: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  color: #333 !important;
}

.app-dark-theme .frosted-popover .ant-popover-inner {
  background-color: rgba(31, 41, 55, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  color: #eee !important;
}

.frosted-popover .ant-popover-arrow::before {
  background: rgba(255, 255, 255, 0.7) !important;
}

.app-dark-theme .frosted-popover .ant-popover-arrow::before {
  background: rgba(31, 41, 55, 0.7) !important;
}

.frosted-float-button .ant-float-button-body {
  background-color: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.05);
  color: #333 !important;
}

.app-dark-theme .frosted-float-button .ant-float-button-body {
  background-color: rgba(31, 41, 55, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff !important;
}

.frosted-float-button .ant-float-button-body:hover {
  background-color: rgba(255, 255, 255, 0.9) !important;
}

.app-dark-theme .frosted-float-button .ant-float-button-body:hover {
  background-color: rgba(55, 65, 81, 0.8) !important;
}
</style>
