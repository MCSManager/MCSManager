<script setup lang="ts">
import { openNodeSelectDialog } from "@/components/fc/index";
import { router } from "@/config/router";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { QUICKSTART_METHOD } from "@/hooks/widgets/quickStartFlow";
import { t } from "@/lang/i18n";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { LayoutCard } from "@/types";
import InstallOptionButton from "@/widgets/market/InstallOptionButton.vue";
import { useMarketTour } from "@/widgets/market/useMarketTour";
import CreateInstanceForm from "@/widgets/setupApp/CreateInstanceForm.vue";
import McPreset from "@/widgets/setupApp/McPreset.vue";
import {
  AppstoreAddOutlined,
  BlockOutlined,
  DatabaseOutlined,
  FileZipOutlined,
  FolderOpenOutlined
} from "@ant-design/icons-vue";
import { Divider, Flex, Tour } from "ant-design-vue";
import Link from "ant-design-vue/es/typography/Link";
import { ref } from "vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { isAdmin } = useAppStateStore();

const { step3Ref, openTour, tourCurrent, tourSteps, setStepRef, markTourDone } =
  useMarketTour(isAdmin);

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const daemonId = getMetaOrRouteValue("daemonId", false) ?? "";

// Form data state
const formData = ref({
  createMethod: QUICKSTART_METHOD.DOCKER,
  daemonId: daemonId || ""
});

// Dialog visibility state
const showCreateForm = ref(false);

const handleNext = (instanceUuid: string) => {
  showCreateForm.value = false;
  // Navigate to instance terminal after create
  router.push({
    path: "/instances/terminal",
    query: {
      daemonId: formData.value.daemonId,
      instanceId: instanceUuid
    }
  });
};

const handleInstallAction = async (createMethod: QUICKSTART_METHOD) => {
  formData.value.createMethod = createMethod;

  try {
    const selectedNode = await openNodeSelectDialog();
    if (!selectedNode) return;
    formData.value.daemonId = selectedNode.uuid;
    showCreateForm.value = true;
  } catch (error) {
    console.error(error);
  }
};

const manualInstallOptions = [
  {
    label: t("TXT_CODE_a3efb1cc"),
    icon: FileZipOutlined,
    description: t("TXT_CODE_f09da050"),
    action: (e: Event) => {
      handleInstallAction(QUICKSTART_METHOD.IMPORT);
      e.preventDefault();
    }
  },
  {
    label: t("TXT_CODE_bae487e4"),
    icon: BlockOutlined,
    description: t("TXT_CODE_256e5825"),
    action: (e: Event) => {
      handleInstallAction(QUICKSTART_METHOD.DOCKER);
      e.preventDefault();
    }
  },
  {
    label: t("TXT_CODE_e0fca76"),
    icon: FolderOpenOutlined,
    description: t("TXT_CODE_b3844cf8"),
    action: (e: Event) => {
      handleInstallAction(QUICKSTART_METHOD.EXIST);
      e.preventDefault();
    }
  }
];

const openEditor = () => {
  router.push("/market/editor");
};
</script>

<template>
  <div style="height: 100%">
    <div v-if="isAdmin" style="margin-bottom: 30px">
      <a-typography-title :level="4" style="margin-bottom: 8px">
        <AppstoreAddOutlined />
        {{ t("TXT_CODE_5a74975b") }}
      </a-typography-title>
      <a-typography-paragraph>
        <p style="opacity: 0.6">
          {{ t("TXT_CODE_81ad9e80") }}
        </p>
      </a-typography-paragraph>
      <div class="manual-install-options">
        <a-row :gutter="[16, 16]">
          <a-col
            v-for="(option, index) in manualInstallOptions"
            :key="index"
            :ref="(el) => setStepRef(index, el)"
            :span="24"
            :md="12"
            :lg="8"
          >
            <InstallOptionButton :option="option" />
          </a-col>
        </a-row>
      </div>
    </div>
    <div>
      <div ref="step3Ref">
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
              <Link target="_blank" @click="openEditor">
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
      <McPreset :card="card" />
    </div>

    <Tour
      v-model:current="tourCurrent"
      :open="openTour"
      :steps="tourSteps"
      @close="markTourDone"
      @finish="markTourDone"
    />

    <a-modal
      v-model:open="showCreateForm"
      :title="t('TXT_CODE_645bc545')"
      :width="1000"
      :footer="null"
      :destroy-on-close="true"
    >
      <CreateInstanceForm
        :create-method="formData.createMethod"
        :daemon-id="formData.daemonId"
        @next-step="handleNext"
      />
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
.manual-install-options {
  margin: 24px auto;
}
</style>
