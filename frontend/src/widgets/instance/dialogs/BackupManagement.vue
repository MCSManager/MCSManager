<script setup lang="ts">
import { useScreen } from "@/hooks/useScreen";
import { t } from "@/lang/i18n";
import { reportErrorMsg } from "@/tools/validator";
import type { InstanceDetail } from "@/types";
import {
  CloudDownloadOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
  RollbackOutlined
} from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import { computed, ref } from "vue";
import { parseTimestamp } from "@/tools/time";
import { formatFileSize } from "@/tools/common";
import {
  createBackup as createBackupApi,
  listBackups as listBackupsApi,
  deleteBackup as deleteBackupApi,
  restoreBackup as restoreBackupApi,
  getBackupDownloadAddress,
  type BackupInfo
} from "@/services/apis/backup";
import { parseForwardAddress } from "@/tools/protocol";
import { getFileConfigAddr } from "@/hooks/useFileManager";

const props = defineProps<{
  instanceInfo?: InstanceDetail;
  instanceId?: string;
  daemonId?: string;
}>();

const emit = defineEmits(["update"]);

const screen = useScreen();
const isPhone = computed(() => screen.isPhone.value);
const open = ref(false);
const backupList = ref<BackupInfo[]>([]);
const loading = ref(false);
const operationLoading = ref<Record<string, boolean>>({});

const columns = computed(() => [
  {
    title: t("TXT_CODE_94234052"),
    dataIndex: "fileName",
    key: "fileName",
    ellipsis: true
  },
  {
    title: t("TXT_CODE_34579982"),
    dataIndex: "timestamp",
    key: "timestamp",
    customRender: ({ text }: { text: number }) => parseTimestamp(text)
  },
  {
    title: t("TXT_CODE_20289768"),
    dataIndex: "size",
    key: "size",
    customRender: ({ text }: { text: number }) => formatFileSize(text)
  },
  {
    title: t("TXT_CODE_fe731dfc"),
    key: "action",
    width: isPhone.value ? 100 : 180
  }
]);

const openDialog = () => {
  open.value = true;
  loadBackupList();
};

const closeDialog = () => {
  open.value = false;
};

const { execute: executeListBackups } = listBackupsApi();

const loadBackupList = async () => {
  try {
    loading.value = true;
    const result = await executeListBackups({
      params: {
        uuid: props.instanceId!,
        daemonId: props.daemonId!
      }
    });
    backupList.value = (result?.value?.backups ?? result?.value ?? result) as BackupInfo[];
  } catch (error: any) {
    reportErrorMsg(error);
  } finally {
    loading.value = false;
  }
};

const { execute: executeCreateBackup } = createBackupApi();

const createBackup = async () => {
  try {
    operationLoading.value["create"] = true;
    await executeCreateBackup({
      params: {
        uuid: props.instanceId!,
        daemonId: props.daemonId!
      }
    });
    message.success(t("TXT_CODE_03563103"));
    await loadBackupList();
  } catch (error: any) {
    reportErrorMsg(error);
  } finally {
    operationLoading.value["create"] = false;
  }
};

const { execute: executeDeleteBackup } = deleteBackupApi();

const deleteBackup = async (backup: BackupInfo) => {
  Modal.confirm({
    title: t("TXT_CODE_893567ac"),
    content: t("TXT_CODE_93524074", { name: backup.fileName }),
    onOk: async () => {
      try {
        operationLoading.value[backup.fileName] = true;
        await executeDeleteBackup({
          params: {
            uuid: props.instanceId!,
            daemonId: props.daemonId!,
            fileName: backup.fileName
          }
        });
        message.success(t("TXT_CODE_11743750"));
        await loadBackupList();
      } catch (error: any) {
        reportErrorMsg(error);
      } finally {
        operationLoading.value[backup.fileName] = false;
      }
    }
  });
};

const { execute: executeRestoreBackup } = restoreBackupApi();

const restoreBackup = async (backup: BackupInfo) => {
  if (props.instanceInfo?.status !== 0) {
    message.error(t("TXT_CODE_94868735"));
    return;
  }

  Modal.confirm({
    title: t("TXT_CODE_893567ac"),
    content: t("TXT_CODE_84261372", { name: backup.fileName }),
    onOk: async () => {
      try {
        operationLoading.value[`restore_${backup.fileName}`] = true;
        await executeRestoreBackup({
          params: {
            uuid: props.instanceId!,
            daemonId: props.daemonId!,
            fileName: backup.fileName
          }
        });
        message.success(t("TXT_CODE_46237672"));
        emit("update");
      } catch (error: any) {
        reportErrorMsg(error);
      } finally {
        operationLoading.value[`restore_${backup.fileName}`] = false;
      }
    }
  });
};

const { execute: executeGetDownloadAddress } = getBackupDownloadAddress();

const downloadBackup = async (backup: BackupInfo) => {
  if (!props.instanceInfo?.config.backupConfig?.enableDownload) {
    message.error(t("TXT_CODE_83996031"));
    return;
  }

  try {
    operationLoading.value[`download_${backup.fileName}`] = true;
    
    // 获取下载信息（与文件管理下载方式完全一致）
    const result = await executeGetDownloadAddress({
      params: {
        uuid: props.instanceId!,
        daemonId: props.daemonId!,
        fileName: backup.fileName
      }
    });
    
    if (!result?.value) {
      throw new Error(t("TXT_CODE_6d772765"));
    }
    
    // 构建下载链接（与文件管理下载完全一致）
    const addr = parseForwardAddress(getFileConfigAddr(result.value), "http");
    const downloadUrl = `${addr}/download/${result.value.password}/${backup.fileName}`;
    
    window.open(downloadUrl);
  } catch (error: any) {
    reportErrorMsg(error);
  } finally {
    operationLoading.value[`download_${backup.fileName}`] = false;
  }
};

defineExpose({
  openDialog,
  closeDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    :title="t('TXT_CODE_24597781')"
    :width="isPhone ? '100%' : '900px'"
    :footer="null"
    :destroy-on-close="true"
  >
    <div class="backup-management">
      <a-space class="mb-16">
        <a-button type="primary" :loading="operationLoading['create']" @click="createBackup">
          <template #icon>
            <FolderOpenOutlined />
          </template>
          {{ t("TXT_CODE_14293889") }}
        </a-button>
        <a-button :loading="loading" @click="loadBackupList">
          <template #icon>
            <ReloadOutlined />
          </template>
          {{ t("TXT_CODE_a53573af") }}
        </a-button>
      </a-space>

      <a-alert
        v-if="props.instanceInfo?.status !== 0"
        class="mb-16"
        :message="t('TXT_CODE_44726241')"
        type="warning"
        show-icon
      />

      <a-table
        :columns="columns"
        :data-source="backupList"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :scroll="{ x: 600 }"
        row-key="fileName"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space :size="8">
              <a-tooltip :title="t('TXT_CODE_88853923')">
                <a-button
                  size="small"
                  :loading="operationLoading[`restore_${record.fileName}`]"
                  :disabled="props.instanceInfo?.status !== 0"
                  @click="restoreBackup(record as BackupInfo)"
                >
                  <template #icon>
                    <RollbackOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip
                v-if="props.instanceInfo?.config.backupConfig?.enableDownload !== false"
                :title="t('TXT_CODE_28735002')"
              >
                <a-button
                  size="small"
                  :loading="operationLoading[`download_${record.fileName}`]"
                  @click="downloadBackup(record as BackupInfo)"
                >
                  <template #icon>
                    <CloudDownloadOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="t('TXT_CODE_a0e19f38')">
                <a-button
                  size="small"
                  danger
                  :loading="operationLoading[record.fileName]"
                  @click="deleteBackup(record as BackupInfo)"
                >
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.backup-management {
  min-height: 200px;
}
</style>
