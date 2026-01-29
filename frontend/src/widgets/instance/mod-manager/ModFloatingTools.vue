<script setup lang="ts">
import { t } from "@/lang/i18n";
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  LoadingOutlined,
  SwapOutlined
} from "@ant-design/icons-vue";
import { Button, FloatButton, Popover, Progress } from "ant-design-vue";
import { computed } from "vue";

import { stopTransferApi } from "@/services/apis/modManager";
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

const activeTasksCount = computed(() => {
  return props.fileStatus?.downloadTasks?.filter((t: any) => t.status === 0).length || 0;
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
    <!-- Download Manager Button (Bottom) -->
    <Popover
      placement="leftBottom"
      trigger="click"
      overlay-class-name="frosted-popover"
      :arrow="false"
    >
      <template #content>
        <div class="popover-content custom-scrollbar">
          <div class="popover-header">
            <div class="header-left">
              <div class="header-indicator"></div>
              <span class="header-title">{{ t("TXT_CODE_TRANSFER_MANAGER") }}</span>
              <span class="header-badge">{{ fileStatus?.downloadTasks?.length || 0 }}</span>
            </div>
          </div>

          <div
            v-if="!fileStatus?.downloadTasks?.length && !fileStatus?.downloadFileFromURLTask"
            class="empty-state"
          >
            <div class="empty-icon">
              <SwapOutlined style="font-size: 28px" class="empty-icon-inner" />
            </div>
            <div class="empty-text">
              {{ t("TXT_CODE_NO_TRANSFER_TASK") }}
            </div>
          </div>

          <div
            v-if="
              fileStatus?.downloadFileFromURLTask > 0 &&
              (!fileStatus.downloadTasks || fileStatus.downloadTasks.length === 0)
            "
            class="url-task-indicator"
          >
            <div class="url-task-icon">
              <loading-outlined class="url-task-icon-inner" />
            </div>
            <span class="url-task-text">{{
              t("TXT_CODE_8b7fe641", { count: fileStatus.downloadFileFromURLTask })
            }}</span>
          </div>

          <div class="task-list">
            <div v-for="task in fileStatus.downloadTasks" :key="task.path" class="task-item">
              <div class="task-header">
                <div class="task-info">
                  <div
                    :class="[
                      'task-icon',
                      task.type === 'download' ? 'task-icon-download' : 'task-icon-upload'
                    ]"
                  >
                    <CloudDownloadOutlined
                      v-if="task.type === 'download'"
                      style="font-size: 22px"
                    />
                    <CloudUploadOutlined v-else style="font-size: 22px" />
                  </div>
                  <div class="task-details">
                    <div class="task-filename" :title="task.path">
                      {{ task.path.split(/[\\/]/).pop() || task.path }}
                    </div>
                    <div class="task-status-text">
                      <span v-if="task.status === 2" class="task-status-error">{{
                        task.error || t("TXT_CODE_DOWNLOAD_FAILED")
                      }}</span>
                      <span v-else-if="task.status === 1" class="task-status-success">{{
                        t("TXT_CODE_FINISHED")
                      }}</span>
                      <template v-else>
                        <span class="task-status-progress"
                          >{{ (task.current / 1024 / 1024).toFixed(2) }}MB</span
                        >
                        <span v-if="task.total > 0" class="task-status-total"
                          >/ {{ (task.total / 1024 / 1024).toFixed(2) }}MB</span
                        >
                      </template>
                    </div>
                  </div>
                </div>
                <div class="task-actions">
                  <span
                    :class="[
                      'task-percent',
                      task.status === 2
                        ? 'task-percent-error'
                        : task.status === 1
                        ? 'task-percent-success'
                        : task.type === 'upload'
                        ? 'task-percent-upload'
                        : 'task-percent-download'
                    ]"
                  >
                    {{ task.total > 0 ? Math.floor((task.current / task.total) * 100) : 0 }}%
                  </span>
                  <Button
                    v-if="task.status === 0"
                    size="large"
                    type="text"
                    danger
                    class="task-stop-button"
                    @click="onStopTransfer(task)"
                  >
                    <template #icon><DeleteOutlined style="font-size: 18px" /></template>
                  </Button>
                </div>
              </div>
              <div class="task-progress-wrapper">
                <Progress
                  :percent="
                    task.status === 1
                      ? 100
                      : task.total > 0
                      ? Math.floor((task.current / task.total) * 100)
                      : 0
                  "
                  :show-info="false"
                  :status="
                    task.status === 2 ? 'exception' : task.status === 1 ? 'success' : 'active'
                  "
                  :stroke-width="6"
                  :stroke-color="
                    task.status === 2
                      ? '#ef4444'
                      : task.status === 1
                      ? '#22c55e'
                      : task.type === 'upload'
                      ? '#f97316'
                      : '#3b82f6'
                  "
                  class="task-progress"
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

.popover-content {
  width: 400px;
  max-height: 600px;
  overflow-y: auto;
  padding: 6px 0px;
}

.popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-indicator {
  width: 0.25rem;
  height: 1.25rem;
  background-color: #f97316;
  border-radius: 0.125rem;
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
}

.header-title {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: -0.025em;
}

.header-badge {
  font-size: 0.875rem;
  opacity: 0.3;
  font-family: monospace;
  background-color: rgba(107, 114, 128, 0.1);
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
  border-radius: 0.375rem;
}

.empty-state {
  padding-top: 4rem;
  padding-bottom: 4rem;
  text-align: center;
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  background-color: rgba(107, 114, 128, 0.05);
  margin-bottom: 1rem;
}

.empty-icon-inner {
  opacity: 0.1;
}

.empty-text {
  font-size: 0.75rem;
  opacity: 0.2;
  letter-spacing: 0.2em;
  font-weight: 300;
  text-transform: uppercase;
}

.url-task-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 0.75rem;
  background-color: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.1);
  margin-bottom: 1rem;
}

.url-task-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background-color: rgba(59, 130, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.url-task-icon-inner {
  color: #3b82f6;
  font-size: 1.125rem;
}

.app-dark-theme .url-task-icon-inner {
  color: #60a5fa;
}

.url-task-text {
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.8;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-item {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.03);
  border-radius: 0.75rem;
  background-color: rgba(0, 0, 0, 0.02);
  padding: 1rem;
  transition: all 0.3s;
}

.app-dark-theme .task-item {
  border-color: rgba(255, 255, 255, 0.05);
  background-color: rgba(255, 255, 255, 0.04);
}

.task-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.app-dark-theme .task-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.3),
    0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow: hidden;
  flex: 1;
}

.task-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.task-icon-download {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.app-dark-theme .task-icon-download {
  color: #60a5fa;
}

.task-icon-upload {
  background-color: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.app-dark-theme .task-icon-upload {
  color: #fb923c;
}

.task-details {
  min-width: 0;
  flex: 1;
  text-align: left;
}

.task-filename {
  font-weight: 600;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  opacity: 0.9;
  margin-bottom: 0.25rem;
}

.task-status-text {
  font-size: 0.75rem;
  opacity: 0.4;
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.task-status-error {
  color: #ef4444;
  font-weight: 700;
}

.app-dark-theme .task-status-error {
  color: #f87171;
}

.task-status-success {
  color: #22c55e;
  font-weight: 700;
}

.app-dark-theme .task-status-success {
  color: #4ade80;
}

.task-status-progress {
  font-weight: 700;
  color: #4b5563;
}

.app-dark-theme .task-status-progress {
  color: #d1d5db;
}

.task-status-total {
  opacity: 0.5;
}

.task-actions {
  text-align: right;
  margin-left: 1rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.task-percent {
  font-size: 0.875rem;
  font-weight: 900;
  font-family: monospace;
  letter-spacing: -0.05em;
}

.task-percent-error {
  color: #ef4444;
}

.task-percent-success {
  color: #22c55e;
}

.task-percent-upload {
  color: #f97316;
}

.task-percent-download {
  color: #3b82f6;
}

.task-stop-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  opacity: 0;
  transition: all 0.3s;
  transform: translateX(0.5rem);
}

.task-item:hover .task-stop-button {
  opacity: 1;
  transform: translateX(0);
}

.task-stop-button:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.task-progress-wrapper {
  margin-top: 0.75rem;
}

.task-progress {
  margin: 0;
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
