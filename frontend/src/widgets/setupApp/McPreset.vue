<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { t } from "@/lang/i18n";
import type { LayoutCard, QuickStartPackages } from "@/types";
import { createAsyncTask, queryAsyncTask } from "@/services/apis/instance";
import { reportErrorMsg } from "@/tools/validator";
import AppPackages from "@/widgets/setupApp/AppPackages.vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { router } from "@/config/router";
import TemplateNameDialog from "@/widgets/instance/dialogs/TemplateNameDialog.vue";
import prettyBytes from "pretty-bytes";
import { openNodeSelectDialog } from "@/components/fc";

const props = defineProps<{
  card: LayoutCard;
}>();

const appPackages = ref<InstanceType<typeof AppPackages>>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
let daemonId = getMetaOrRouteValue("daemonId", false) ?? "";
const dialog = reactive({
  show: false,
  title: "Dialog"
});

const isMarketPage = router.currentRoute.value.path.includes("/market");
if (isMarketPage) {
  daemonId = "";
}

const installView = ref(false);
const intervalTask = ref<NodeJS.Timer>();
const percentage = ref(0);
const isInstalled = ref(false);

// Download progress information
const downloadInfo = ref({
  percentage: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  speed: 0,
  eta: 0
});

// TemplateNameDialog 状态
const showTemplateNameDialog = ref(false);
const selectedTemplate = ref<QuickStartPackages | null>(null);

const { state: newTaskInfo, execute: executeCreateAsyncTask } = createAsyncTask();

const handleSelectTemplate = async (item: QuickStartPackages) => {
  selectedTemplate.value = item;
  showTemplateNameDialog.value = true;
};

const handleTemplateConfirm = async (instanceName: string, template: QuickStartPackages) => {
  try {
    if (!daemonId) {
      const node = await openNodeSelectDialog();
      if (!node) {
        reportErrorMsg(t("请选择一个节点再安装！"));
        return;
      }
      daemonId = node.uuid;
    }
    await executeCreateAsyncTask({
      params: {
        daemonId,
        uuid: "-",
        task_name: "quick_install"
      },
      data: {
        time: Date.now(),
        newInstanceName: instanceName,
        targetLink: template.targetLink || "",
        setupInfo: template.setupInfo
      }
    });
    installView.value = true;
    isInstalled.value = false;
    percentage.value = 0;
    downloadInfo.value = {
      percentage: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      speed: 0,
      eta: 0
    };
    await startDownloadTask();
  } catch (err: any) {
    console.error(err);
    return reportErrorMsg(err.message);
  }
};

const startDownloadTask = async () => {
  if (intervalTask.value) clearInterval(intervalTask.value);
  dialog.title = t("TXT_CODE_f878fd4c");
  dialog.show = true;
  await queryStatus();
  intervalTask.value = setInterval(async () => {
    await queryStatus();
  }, 1000); // Update every second for real-time progress
};

const { state: taskInfo, execute: queryAsyncTaskStatus } = queryAsyncTask();

const queryStatus = async () => {
  try {
    if (!newTaskInfo.value) throw new Error("newTaskInfo is null");
    await queryAsyncTaskStatus({
      params: {
        daemonId: daemonId,
        uuid: "-",
        task_name: "quick_install"
      },
      data: {
        taskId: newTaskInfo.value.taskId
      }
    });

    // Update download progress from task info
    if (taskInfo.value?.detail?.downloadProgress) {
      downloadInfo.value = taskInfo.value.detail.downloadProgress;
      percentage.value = downloadInfo.value.percentage;
    }

    if (taskInfo.value?.status === -1) {
      percentage.value = 100;
      dialog.title = t("TXT_CODE_7078fd28");
      installView.value = true;
      isInstalled.value = false;
      clearInterval(intervalTask.value);
    }

    if (taskInfo.value?.status === 0) {
      percentage.value = 100;
      dialog.title = t("TXT_CODE_477ece61");
      installView.value = false;
      isInstalled.value = true;
      clearInterval(intervalTask.value);
    }
  } catch (err: any) {
    console.error(err);
    return reportErrorMsg(err.message);
  }
};

// Format time
const formatTime = (seconds: number) => {
  if (seconds < 60) return Math.round(seconds) + "s";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return minutes + "m " + remainingSeconds + "s";
};

const toAppDetailPage = () => {
  const instanceId = taskInfo.value?.detail.instanceUuid;
  router.push({
    path: "/instances/terminal",
    query: {
      daemonId,
      instanceId
    }
  });
};

const toCreateInstancePage = () => {
  router.push({
    path: "/quickstart"
  });
};
</script>

<template>
  <div style="height: 100%">
    <AppPackages ref="appPackages" @handle-select-template="handleSelectTemplate" />

    <!-- Loading model -->
    <a-modal
      v-model:open="dialog.show"
      :title="dialog.title"
      :mask-closable="false"
      :closable="false"
      :footer="null"
      centered
    >
      <div v-if="installView || isInstalled" style="text-align: center">
        <a-progress
          style="display: block; margin-bottom: 10px"
          type="circle"
          :percent="percentage"
          :status="taskInfo?.status === -1 ? 'exception' : 'normal'"
        />

        <!-- Download progress information -->
        <div v-if="installView && taskInfo?.status !== -1" style="margin-bottom: 15px">
          <div v-if="taskInfo?.status !== -1">
            <a-typography-paragraph>
              <a-typography-title :level="5">
                <span>{{ t("下载文件中...") }}</span>
                <span style="margin-left: 8px">
                  {{ prettyBytes(downloadInfo.downloadedBytes) }} /
                  {{ prettyBytes(downloadInfo.totalBytes) }}
                </span>
              </a-typography-title>
            </a-typography-paragraph>
          </div>

          <div v-if="downloadInfo.speed > 0" style="opacity: 0.7">
            <span style="margin-right: 15px">
              {{ t("TXT_CODE_Speed") }}: {{ prettyBytes(downloadInfo.speed) }}/s
            </span>
            <span v-if="downloadInfo.eta > 0">
              {{ t("TXT_CODE_ETA") }}: {{ formatTime(downloadInfo.eta) }}
            </span>
          </div>
        </div>

        <div v-if="installView">
          <div v-if="taskInfo?.status === -1">
            <a-typography-paragraph>
              <a-typography-title :level="5">{{ t("TXT_CODE_7078fd28") }}</a-typography-title>
              <a-typography-text>
                {{ t("TXT_CODE_57cd2d04") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-button size="large" class="mr-10" @click="toCreateInstancePage()">
              {{ t("TXT_CODE_bc883bbb") }}
            </a-button>
            <a-button type="primary" size="large" danger @click="dialog.show = false">
              {{ t("TXT_CODE_b1dedda3") }}
            </a-button>
          </div>
        </div>
        <div v-if="isInstalled">
          <a-typography-paragraph>
            <a-typography-title :level="5">{{ t("TXT_CODE_477ece61") }}</a-typography-title>
            <a-typography-text>
              {{ t("TXT_CODE_ce917b27") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-button @click="toAppDetailPage()">{{ t("TXT_CODE_36417656") }}</a-button>
        </div>
        <div v-if="!isInstalled">
          <a-button type="text" style="text-decoration: underline" @click="toAppDetailPage()">
            <span class="color-primary">{{ t("进入终端等待") }}</span>
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 模板名称输入对话框 -->
    <TemplateNameDialog
      v-model:open="showTemplateNameDialog"
      :template="selectedTemplate"
      @confirm="handleTemplateConfirm"
    />
  </div>
</template>
