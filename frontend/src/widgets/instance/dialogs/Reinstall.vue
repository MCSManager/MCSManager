<script setup lang="ts">
import { ref } from "vue";
import { t } from "@/lang/i18n";
import { Modal } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import { reinstallInstance } from "@/services/apis/instance";
import type { QuickStartPackages } from "@/types";
import AppPackages from "@/widgets/setupApp/AppPackages.vue";

const props = defineProps<{
  daemonId: string;
  instanceId: string;
}>();

const appPackages = ref<InstanceType<typeof AppPackages>>();

const open = ref(false);
const openDialog = async () => {
  try {
    open.value = true;
    await appPackages.value?.init();
  } catch (err: any) {
    console.error(err.message);
    return reportErrorMsg(err.message);
  }
};

const handleSelectTemplate = (item: QuickStartPackages) => {
  Modal.confirm({
    title: t("TXT_CODE_617ce69c"),
    content: t("TXT_CODE_94f1ba3"),
    okText: t("TXT_CODE_ed3fc23"),
    async onOk() {
      try {
        await reinstallInstance().execute({
          params: {
            daemonId: props.daemonId,
            uuid: props.instanceId
          },
          data: {
            targetUrl: item.targetLink,
            title: item.title,
            description: item.description
          }
        });
        cancel();
      } catch (err: any) {
        console.error(err);
        return reportErrorMsg(err.message);
      }
    }
  });
};

const cancel = async () => {
  open.value = false;
};

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    width="95%"
    :cancel-text="t('TXT_CODE_3b1cc020')"
    :mask-closable="false"
    :confirm-loading="false"
    :footer="null"
    @cancel="cancel"
  >
    <template #title> {{ t("TXT_CODE_5e10537a") }} </template>
    <div class="mt-20">
      <AppPackages ref="appPackages" @handle-select-template="handleSelectTemplate" />
    </div>
  </a-modal>
</template>
