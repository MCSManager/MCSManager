<script setup lang="ts">
import type { OpenMarketDialogProps } from "@/components/fc";
import { useDialog } from "@/hooks/useDialog";
import { t } from "@/lang/i18n";
import { reinstallInstance } from "@/services/apis/instance";
import { reportErrorMsg } from "@/tools/validator";
import type { MountComponent, QuickStartPackages } from "@/types";
import AppPackages from "@/widgets/setupApp/AppPackages.vue";
import { Modal } from "ant-design-vue";
import { ref } from "vue";

interface Props extends OpenMarketDialogProps, MountComponent<QuickStartPackages> {}

const props = defineProps<Props>();

const { isVisible, openDialog: open, cancel, submit } = useDialog<QuickStartPackages>(props);

const openDialog = async () => {
  appPackages.value?.fetchTemplate();
  return await open();
};

const appPackages = ref<InstanceType<typeof AppPackages>>();

const handleSelectCategory = (item: QuickStartPackages) => {
  appPackages.value?.handleSelectTopCategory(item);
};

const handleSelectTemplate = async (
  item: QuickStartPackages | null,
  _type: "normal" | "docker"
) => {
  if (!item) {
    return submit(undefined);
  }
  if (!props.autoInstall || !props.instanceId || !props.daemonId) {
    await submit(item);
    return;
  } else {
    Modal.confirm({
      title: t("TXT_CODE_617ce69c"),
      content: t("TXT_CODE_94f1ba3"),
      okText: t("TXT_CODE_ed3fc23"),
      async onOk() {
        try {
          await reinstallInstance().execute({
            params: {
              daemonId: props.daemonId || "",
              uuid: props.instanceId || ""
            },
            data: {
              targetUrl: item.targetLink,
              title: item.title,
              description: item.description
            }
          });
          await submit(item);
        } catch (err: any) {
          console.error(err);
          return reportErrorMsg(err.message);
        }
      }
    });
  }
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
    :cancel-text="t('TXT_CODE_3b1cc020')"
    :mask-closable="false"
    :confirm-loading="false"
    :footer="null"
    @cancel="cancel"
  >
    <AppPackages
      ref="appPackages"
      :btn-text="btnText"
      :title="dialogTitle"
      :show-custom-btn="showCustomBtn"
      :only-docker-template="onlyDockerTemplate"
      @handle-select-category="handleSelectCategory"
      @handle-select-template="handleSelectTemplate"
      @handle-back-to-category="() => {}"
    />
  </a-modal>
</template>
