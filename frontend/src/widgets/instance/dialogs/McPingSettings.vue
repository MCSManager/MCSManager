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
  ip: "",
  port: "",
  type: 1
});

const open = ref(false);
const openDialog = () => {
  open.value = true;
  formData.ip = props.instanceInfo?.config?.pingConfig.ip || "";
  formData.port = String(props.instanceInfo?.config?.pingConfig.port || "");
  formData.type = props.instanceInfo?.config?.pingConfig.type ?? 1;
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
        pingConfig: {
          ip: formData.ip,
          port: Number(formData.port),
          type: formData.type
        }
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
    :title="t('Minecraft 状态获取')"
    :confirm-loading="isLoading"
    :ok-text="t('TXT_CODE_abfe9512')"
    @ok="submit"
  >
    <div>
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{ t("MCSManager 将使用 Minecraft Ping 协议尝试获取服务器在线人数，版本，延迟等信息。") }}
          <br />
          {{ t("完成配置后，实例运行时，每分钟刷新一次服务器状态。") }}
        </a-typography-text>
      </a-typography-paragraph>
      <a-form ref="formRef" :model="formData" layout="vertical">
        <a-form-item name="port">
          <a-typography-title :level="5">{{ t("TXT_CODE_890aa44c") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_a4748cb0") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input v-model:value="formData.port" :placeholder="t('TXT_CODE_e2dc0156')" />
        </a-form-item>
        <a-form-item name="ip">
          <a-typography-title :level="5">{{ t("服务器地址") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_8e2be926") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input v-model:value="formData.ip" :placeholder="t('默认值：localhost')" />
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>
