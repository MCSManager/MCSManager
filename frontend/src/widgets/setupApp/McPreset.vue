<script setup lang="ts">
import { openNodeSelectDialog } from "@/components/fc";
import { router } from "@/config/router";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { t } from "@/lang/i18n";
import { createAsyncTask } from "@/services/apis/instance";
import { reportErrorMsg } from "@/tools/validator";
import type { LayoutCard, QuickStartPackages } from "@/types";
import TemplateNameDialog from "@/widgets/instance/dialogs/TemplateNameDialog.vue";
import AppPackages from "@/widgets/setupApp/AppPackages.vue";
import { message } from "ant-design-vue";
import { ref } from "vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const appPackages = ref<InstanceType<typeof AppPackages>>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
let daemonId = getMetaOrRouteValue("daemonId", false) ?? "";

const isMarketPage = router.currentRoute.value.path.includes("/market");
if (isMarketPage) {
  daemonId = "";
}

const installView = ref(false);
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

const showTemplateNameDialog = ref(false);
const selectedTemplate = ref<QuickStartPackages | null>(null);

const { state: newTaskInfo, execute: executeCreateAsyncTask } = createAsyncTask();

const handleSelectTemplate = async (item: QuickStartPackages | null) => {
  if (!item) return;
  selectedTemplate.value = item;
  showTemplateNameDialog.value = true;
};

const handleTemplateConfirm = async (instanceName: string, template: QuickStartPackages) => {
  try {
    if (!daemonId) {
      const node = await openNodeSelectDialog();
      if (!node) {
        reportErrorMsg(t("TXT_CODE_2de92a5d"));
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

// jump to terminal page
const startDownloadTask = async () => {
  message.info(t("TXT_CODE_e718a226"));
  setTimeout(() => {
    router.push({
      path: "/instances/terminal",
      query: {
        daemonId,
        instanceId: newTaskInfo.value?.instanceUuid
      }
    });
  }, 1000);
};
</script>

<template>
  <div style="height: 100%">
    <AppPackages ref="appPackages" @handle-select-template="handleSelectTemplate" />
    <TemplateNameDialog
      v-model:open="showTemplateNameDialog"
      :template="selectedTemplate"
      @confirm="handleTemplateConfirm"
    />
  </div>
</template>
