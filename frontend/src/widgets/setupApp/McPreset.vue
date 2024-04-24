<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { t } from "@/lang/i18n";
import type { LayoutCard, QuickStartPackages } from "@/types";
import { createAsyncTask, queryAsyncTask } from "@/services/apis/instance";
import { reportErrorMsg } from "@/tools/validator";
import AppPackages from "@/widgets/setupApp/AppPackages.vue";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { router } from "@/config/router";

const props = defineProps<{
  card: LayoutCard;
}>();

const appPackages = ref<InstanceType<typeof AppPackages>>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const { openInputDialog } = useAppToolsStore();
const daemonId = getMetaOrRouteValue("daemonId") ?? "";
const dialog = reactive({
  show: false,
  title: "Dialog"
});

const installView = ref(false);
const intervalTask = ref<NodeJS.Timer>();
const percentage = ref(0);
const isInstalled = ref(false);

const { state: newTaskInfo, execute: executeCreateAsyncTask } = createAsyncTask();

const handleSelectTemplate = async (item: QuickStartPackages) => {
  try {
    const instanceName = await openInputDialog(t("TXT_CODE_c237192c"));
    await executeCreateAsyncTask({
      params: {
        daemonId: daemonId,
        uuid: "-",
        task_name: "quick_install"
      },
      data: {
        time: Date.now(),
        newInstanceName: instanceName,
        targetLink: item.targetLink || "",
        setupInfo: item.setupInfo
      }
    });
    installView.value = true;
    isInstalled.value = false;
    percentage.value = 0;
    await startDownloadTask();
  } catch (err: any) {
    console.error(err);
    if (err.message === "Dialog closed by user") return;
    return reportErrorMsg(err.message);
  }
};

const startDownloadTask = async () => {
  if (intervalTask.value) clearInterval(intervalTask.value);
  dialog.title = t("TXT_CODE_f878fd4c");
  dialog.show = true;
  await queryStatus();
  intervalTask.value = setInterval(async () => {
    if (percentage.value <= 95) percentage.value += Math.floor(Math.random() * 6) + 1;
    await queryStatus();
  }, 3000);
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

onMounted(() => {
  if (!daemonId) throw new Error(t("TXT_CODE_e4878221"));
});
</script>

<template>
  <div style="height: 100%">
    <AppPackages v-if="daemonId" ref="appPackages" @handle-select-template="handleSelectTemplate" />

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
        <div v-if="installView">
          <div v-if="taskInfo?.status !== -1">
            <a-typography-paragraph>
              <a-typography-title :level="5">{{ t("TXT_CODE_32cd41d5") }}</a-typography-title>
              <a-typography-text>
                {{ t("TXT_CODE_147a2f87") }}
              </a-typography-text>
            </a-typography-paragraph>
          </div>
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
      </div>
    </a-modal>
  </div>
</template>
