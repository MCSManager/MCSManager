<script setup lang="ts">
import { ref, reactive } from "vue";
import { t } from "@/lang/i18n";
import type { InstanceDetail } from "@/types";
import { updateInstanceConfig } from "@/services/apis/instance";
import { message, type FormInstance } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";

const formRef = ref<FormInstance>();

const props = defineProps<{
  instanceInfo?: InstanceDetail;
  instanceId?: string;
  daemonId?: string;
}>();

const emit = defineEmits(["update"]);
const formData = reactive({
  rconIp: "",
  rconPassword: "",
  rconPort: "",
  enableRcon: false
});

const open = ref(false);
const openDialog = () => {
  open.value = true;
  formData.rconIp = props.instanceInfo?.config?.rconIp ?? "";
  formData.rconPassword = props.instanceInfo?.config?.rconPassword ?? "";
  formData.rconPort = String(props.instanceInfo?.config?.rconPort || "");
  formData.enableRcon = props.instanceInfo?.config?.enableRcon ?? false;
};

const { execute, isLoading } = updateInstanceConfig();

const submit = async () => {
  try {
    await formRef.value?.validateFields();
    await execute({
      params: {
        uuid: props.instanceId ?? "",
        daemonId: props.daemonId ?? ""
      },
      data: {
        rconIp: formData.rconIp,
        rconPassword: formData.rconPassword,
        rconPort: Number(formData.rconPort || 0),
        enableRcon: formData.enableRcon
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
    :title="t('TXT_CODE_282b0721')"
    :confirm-loading="isLoading"
    :ok-text="t('TXT_CODE_abfe9512')"
    @ok="submit"
  >
    <div>
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_32d87bf1") }}
        </a-typography-text>
      </a-typography-paragraph>
      <a-form ref="formRef" :model="formData" layout="vertical">
        <a-form-item>
          <a-typography-title :level="5">{{ t("TXT_CODE_179d7be4") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_a8839b35") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-switch v-model:checked="formData.enableRcon" />
        </a-form-item>

        <a-form-item name="rconIp">
          <a-typography-title :level="5">{{ t("TXT_CODE_d629fa48") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_8e2be926") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input v-model:value="formData.rconIp" :placeholder="t('TXT_CODE_47129a5b')" />
        </a-form-item>
        <a-form-item name="rconPort">
          <a-typography-title :level="5">{{ t("TXT_CODE_890aa44c") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_a4748cb0") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input v-model:value="formData.rconPort" :placeholder="t('TXT_CODE_e2dc0156')" />
        </a-form-item>
        <a-form-item name="rconPassword">
          <a-typography-title :level="5">{{ t("TXT_CODE_2880eed4") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_3ae0276b") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input v-model:value="formData.rconPassword" :placeholder="t('TXT_CODE_25af3af3')" />
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>
