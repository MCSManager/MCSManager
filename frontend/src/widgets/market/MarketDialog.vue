<script setup lang="ts">
import { router } from "@/config/router";
import { useDialog } from "@/hooks/useDialog";
import { t } from "@/lang/i18n";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { LayoutCard, MountComponent } from "@/types";
import { useMarketTour } from "@/widgets/market/useMarketTour";
import McPreset from "@/widgets/setupApp/McPreset.vue";
import { DatabaseOutlined } from "@ant-design/icons-vue";
import { Divider, Flex, Tour } from "ant-design-vue";
import Link from "ant-design-vue/es/typography/Link";

const props = defineProps<{
  destroyComponent: MountComponent["destroyComponent"];
}>();

const { isVisible, openDialog, cancel } = useDialog<void>(props);

const marketCard: LayoutCard = {
  id: "application-market-dialog",
  type: "Market",
  title: "",
  width: 12,
  height: "auto",
  meta: {}
};

const { isAdmin } = useAppStateStore();

const { step3Ref, openTour, tourCurrent, tourSteps, markTourDone } = useMarketTour(isAdmin);

const openEditor = () => {
  router.push("/market/editor");
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
    width="1600px"
    :footer="null"
    :destroy-on-close="true"
    @cancel="cancel"
  >
    <div style="height: 100%">
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
        <McPreset :card="marketCard" @install-started="cancel" />
      </div>

      <Tour
        v-model:current="tourCurrent"
        :open="openTour"
        :steps="tourSteps"
        @close="markTourDone"
        @finish="markTourDone"
      />
    </div>
  </a-modal>
</template>
