<script setup lang="ts">
import { openNodeSelectDialog } from "@/components/fc";
import { router } from "@/config/router";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import type { ComputedNodeInfo } from "@/hooks/useOverviewInfo";
import { t } from "@/lang/i18n";
import { overviewInfo } from "@/services/apis";
import { getDockerHubImagePlatforms } from "@/services/apis/envImage";
import { createAsyncTask } from "@/services/apis/instance";
import { reportErrorMsg } from "@/tools/validator";
import type { LayoutCard, QuickStartPackages } from "@/types";
import TemplateNameDialog from "@/widgets/instance/dialogs/TemplateNameDialog.vue";
import AppPackages from "@/widgets/setupApp/AppPackages.vue";
import { message } from "ant-design-vue";
import { onMounted, ref } from "vue";

const props = defineProps<{
  card: LayoutCard;
  initialCategory?: QuickStartPackages;
  initialNode?: ComputedNodeInfo;
}>();

const emit = defineEmits<{
  back: [];
  "install-started": [];
}>();

const appPackages = ref<InstanceType<typeof AppPackages>>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
let daemonId = props.initialNode?.uuid ?? getMetaOrRouteValue("daemonId", false) ?? "";
const currentNode = ref<ComputedNodeInfo | undefined>(props.initialNode);

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
const selectedTemplateType = ref<"normal" | "docker">("normal");

const { state: newTaskInfo, execute: executeCreateAsyncTask } = createAsyncTask();
const { execute: getOverviewInfo } = overviewInfo();

/**
 * Get Docker image platforms from Docker Hub via backend proxy
 * Uses backend endpoint to avoid CORS restrictions
 * @param imageName Image name in format "image:tag" or "namespace/image:tag"
 * @returns Array of supported platform strings (e.g., ["linux/amd64", "linux/arm64"])
 */
const getImagePlatformsFromDockerHub = async (imageName: string): Promise<string[]> => {
  try {
    const { execute } = getDockerHubImagePlatforms();
    const state = await execute({
      data: {
        imageName
      }
    });

    // execute() returns state (a ref), so we need to access .value
    const platforms = state.value;

    // Ensure we return an array
    if (Array.isArray(platforms)) {
      return platforms;
    }

    return [];
  } catch (error: any) {
    // If we can't get platforms, return empty array (no filtering)
    console.warn("Failed to get image platforms from Docker Hub:", error);
    return [];
  }
};

/**
 * Called when user clicks a Category 1 card.
 * If no daemon node is pre-configured, prompt for node selection first,
 * then navigate into the Category 2 detail view.
 */
const handleSelectCategory = async (item: QuickStartPackages) => {
  try {
    let node = currentNode.value;
    if (!daemonId) {
      const overview = await getOverviewInfo({ forceRequest: true });
      const onlineNodes = overview.value?.remote?.filter((item) => item.available) ?? [];
      if (onlineNodes.length === 0) {
        reportErrorMsg(t("TXT_CODE_e3d96a26"));
        return false;
      }

      node =
        onlineNodes.length === 1
          ? (onlineNodes[0] as ComputedNodeInfo)
          : await openNodeSelectDialog();
      if (!node) {
        reportErrorMsg(t("TXT_CODE_2de92a5d"));
        return false;
      }
      daemonId = node.uuid;
      currentNode.value = node;
    }
    appPackages.value?.handleSelectTopCategory(item, node);
    return true;
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

const handleSelectTemplate = async (item: QuickStartPackages | null, type: "normal" | "docker") => {
  if (!item) return;
  selectedTemplate.value = item;
  selectedTemplateType.value = type;
  showTemplateNameDialog.value = true;
};

const handleTemplateConfirm = async (instanceName: string, template: QuickStartPackages) => {
  try {
    const setupInfo: IGlobalInstanceConfig = {
      ...template.setupInfo,
      docker: {
        ...template.setupInfo.docker
      }
    };

    if (selectedTemplateType.value === "docker") {
      setupInfo.docker = {
        ...setupInfo.docker,
        ...template.dockerOptional
      };
      setupInfo.processType = "docker";
    }

    if (!daemonId) {
      // get image platforms if this is a Docker template
      let targetPlatforms: string[] | undefined;
      if (setupInfo?.docker?.image) {
        targetPlatforms = await getImagePlatformsFromDockerHub(setupInfo.docker.image);

        // only use platforms if we successfully got them
        if (!targetPlatforms || targetPlatforms.length === 0) {
          targetPlatforms = undefined;
        }
      }

      const node = await openNodeSelectDialog(targetPlatforms);
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
        setupInfo
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
    emit("install-started");
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

const handleBackToCategory = () => {
  if (props.initialCategory) {
    emit("back");
    return;
  }
  daemonId = "";
  currentNode.value = undefined;
};

onMounted(async () => {
  if (props.initialCategory && !(await handleSelectCategory(props.initialCategory))) {
    emit("back");
  }
});
</script>

<template>
  <div style="height: 100%">
    <AppPackages
      ref="appPackages"
      @handle-select-category="handleSelectCategory"
      @handle-select-template="handleSelectTemplate"
      @handle-back-to-category="handleBackToCategory"
    />
    <TemplateNameDialog
      v-model:open="showTemplateNameDialog"
      :template="selectedTemplate"
      @confirm="handleTemplateConfirm"
    />
  </div>
</template>
