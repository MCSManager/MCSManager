<script setup lang="ts">
import { openNodeSelectDialog } from "@/components/fc";
import { router } from "@/config/router";
import { useDialog } from "@/hooks/useDialog";
import type { ComputedNodeInfo } from "@/hooks/useOverviewInfo";
import { QUICKSTART_METHOD } from "@/hooks/widgets/quickStartFlow";
import { t } from "@/lang/i18n";
import { overviewInfo } from "@/services/apis";
import { reportErrorMsg } from "@/tools/validator";
import type { LayoutCard, MountComponent, QuickStartPackages } from "@/types";
import MarketCreateMethodStep from "@/widgets/market/MarketCreateMethodStep.vue";
import AppPackages from "@/widgets/setupApp/AppPackages.vue";
import CreateInstanceForm from "@/widgets/setupApp/CreateInstanceForm.vue";
import McPreset from "@/widgets/setupApp/McPreset.vue";
import { AppstoreAddOutlined, DatabaseOutlined } from "@ant-design/icons-vue";
import { Divider, Flex } from "ant-design-vue";
import Link from "ant-design-vue/es/typography/Link";
import { computed, ref } from "vue";

const props = defineProps<{
  destroyComponent: MountComponent["destroyComponent"];
}>();

const { isVisible, openDialog, cancel } = useDialog<void>(props);
const daemonId = ref<string | undefined>(
  router.currentRoute.value.query.daemonId as string | undefined
);
const { execute: getOverviewInfo } = overviewInfo();

enum MarketStep {
  CATEGORY = 0,
  METHOD,
  PRESET,
  MANUAL
}
const marketStepWidths: Record<MarketStep, string> = {
  [MarketStep.CATEGORY]: "1600px",
  [MarketStep.METHOD]: "800px",
  [MarketStep.PRESET]: "1600px",
  [MarketStep.MANUAL]: "950px"
};
type MarketCreateMethod =
  | "preset"
  | QUICKSTART_METHOD.IMPORT
  | QUICKSTART_METHOD.DOCKER
  | QUICKSTART_METHOD.EXIST;

const currentStep = ref(MarketStep.CATEGORY);
const selectedCategory = ref<QuickStartPackages>();
const selectedMethod = ref<QUICKSTART_METHOD>();
const selectedNode = ref<ComputedNodeInfo>();
const selectedDaemonId = computed(() => selectedNode.value?.uuid ?? daemonId.value ?? "");

const marketCard = computed<LayoutCard>(() => ({
  id: "application-market-dialog",
  type: "Market",
  title: "",
  width: 12,
  height: "auto",
  meta: { daemonId: selectedDaemonId.value }
}));

const openEditor = () => {
  router.push("/market/editor");
  cancel();
};

const handleSelectCategory = (category: QuickStartPackages) => {
  selectedCategory.value = category;
  currentStep.value = MarketStep.METHOD;
};

const handleSelectMethod = async (method: MarketCreateMethod) => {
  try {
    let node: ComputedNodeInfo | undefined;
    if (!selectedDaemonId.value) {
      const overview = await getOverviewInfo({ forceRequest: true });
      const onlineNodes = overview?.value?.remote?.filter((item) => item.available) ?? [];
      if (onlineNodes.length === 0) {
        reportErrorMsg(t("TXT_CODE_e3d96a26"));
        return;
      }

      node = onlineNodes.length === 1 ? onlineNodes[0] : await openNodeSelectDialog();
      if (!node) {
        reportErrorMsg(t("TXT_CODE_2de92a5d"));
        return;
      }
      selectedNode.value = node;
    }

    if (method === "preset") {
      currentStep.value = MarketStep.PRESET;
      return;
    }

    selectedMethod.value = method;
    currentStep.value = MarketStep.MANUAL;
  } catch (err: any) {
    console.error(err);
    return;
  }
};

const backToCategory = () => {
  selectedCategory.value = undefined;
  selectedNode.value = undefined;
  currentStep.value = MarketStep.CATEGORY;
};

const backToMethod = () => {
  selectedMethod.value = undefined;
  currentStep.value = MarketStep.METHOD;
};

const handleManualCreated = (instanceId?: string) => {
  if (instanceId) {
    router.push({
      path: "/instances/terminal",
      query: {
        daemonId: selectedDaemonId.value,
        instanceId
      }
    });
  }
  cancel();
};

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="isVisible"
    centered
    :width="marketStepWidths[currentStep]"
    :footer="null"
    :destroy-on-close="true"
    @cancel="cancel"
  >
    <div style="height: 100%">
      <div>
        <div
          v-if="currentStep === MarketStep.CATEGORY || currentStep === MarketStep.PRESET"
          class="market-header"
        >
          <a-typography-title :level="4" style="margin-bottom: 8px">
            <DatabaseOutlined />
            {{ t("TXT_CODE_88249aee") }}
          </a-typography-title>
          <a-typography-paragraph>
            <Flex justify="space-between" align="flex-start">
              <p style="opacity: 0.6">
                <span>{{ t("TXT_CODE_c9ce7427") }}</span>
              </p>
              <p style="opacity: 0.6">
                <Link target="_blank" data-testid="market-editor-link" @click="openEditor">
                  {{ t("TXT_CODE_85c10fde") }}
                </Link>
                <Divider type="vertical" />
                <Link href="https://github.com/MCSManager/Script/issues/77" target="_blank">
                  {{ t("TXT_CODE_709c2db4") }}
                </Link>
              </p>
            </Flex>
          </a-typography-paragraph>
        </div>
        <AppPackages
          v-if="currentStep === MarketStep.CATEGORY"
          @handle-select-category="handleSelectCategory"
          @handle-select-template="() => {}"
          @handle-back-to-category="() => {}"
        />
        <MarketCreateMethodStep
          v-else-if="currentStep === MarketStep.METHOD"
          :category-title="selectedCategory?.title"
          @back="backToCategory"
          @select="handleSelectMethod"
        />
        <McPreset
          v-else-if="currentStep === MarketStep.PRESET && selectedCategory"
          :card="marketCard"
          :initial-category="selectedCategory"
          :initial-node="selectedNode"
          @back="backToMethod"
          @install-started="cancel"
        />
        <div v-else-if="currentStep === MarketStep.MANUAL && selectedMethod">
          <a-typography-title :level="4" style="margin-bottom: 8px">
            <AppstoreAddOutlined />
            {{ t("TXT_CODE_9b99b72e") }}
          </a-typography-title>

          <CreateInstanceForm
            :create-method="selectedMethod"
            :daemon-id="selectedDaemonId"
            :app-type="selectedCategory?.gameType"
            @back="backToMethod"
            @next-step="handleManualCreated"
          />
        </div>
      </div>
    </div>
  </a-modal>
</template>
