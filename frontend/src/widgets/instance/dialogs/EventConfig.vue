<script setup lang="ts">
import { ref } from "vue";
import { t } from "@/lang/i18n";
import type { InstanceDetail } from "@/types";
import { updateInstanceConfig } from "@/services/apis/instance";
import { message } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";

const props = defineProps<{
  instanceInfo?: InstanceDetail;
  instanceId?: string;
  daemonId?: string;
}>();
const emit = defineEmits(["update"]);
const options = ref<InstanceDetail>();
const open = ref(false);
const openDialog = () => {
  open.value = true;
  options.value = props.instanceInfo;
};

const { execute, isLoading } = updateInstanceConfig();

const submit = async () => {
  try {
    await execute({
      params: {
        uuid: props.instanceId ?? "",
        daemonId: props.daemonId ?? ""
      },
      data: {
        eventTask: options.value?.config.eventTask
      }
    });
    emit("update");
    open.value = false;
    return message.success(t("TXT_CODE_d3de39b4"));
  } catch (err: any) {
    return reportErrorMsg(err.message);
  }
};

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    :title="t('TXT_CODE_10150756')"
    :confirm-loading="isLoading"
    :ok-text="t('TXT_CODE_abfe9512')"
    @ok="submit"
  >
    <a-form v-if="options" layout="vertical">
      <a-form-item>
        <a-typography-title :level="5">{{ t("TXT_CODE_a64da7c4") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_619faab6") }}
            <br />
            {{ t("TXT_CODE_3eb58633") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-switch v-model:checked="options.config.eventTask.autoRestart" />
      </a-form-item>

      <a-form-item>
        <a-typography-title :level="5">{{ t("TXT_CODE_273d24e0") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_8d9f5a4e") }}
            <br />
            {{ t("TXT_CODE_64bf4386") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-switch v-model:checked="options.config.eventTask.autoStart" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
