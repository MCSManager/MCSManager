<script setup lang="ts">
import { computed, ref, reactive } from "vue";
import { t } from "@/lang/i18n";
import type { InstanceDetail } from "@/types";
import { updateInstanceConfig } from "@/services/apis/instance";
import { message, type FormInstance, type FormProps } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import { useAppStateStore } from "@/stores/useAppStateStore";

const formRef = ref<FormInstance>();
const { isAdmin } = useAppStateStore();

const props = defineProps<{
  instanceInfo?: InstanceDetail;
  instanceId?: string;
  daemonId?: string;
}>();

const emit = defineEmits(["update"]);
const isReadOnly = computed(
  () => !isAdmin.value && props.instanceInfo?.config?.rconProtocol === "rust-web"
);
const formData = reactive({
  rconIp: "",
  rconPassword: "",
  rconPort: "",
  enableRcon: false,
  rconProtocol: "source" as "source" | "rust-web"
});
const rules = computed<FormProps["rules"]>(() =>
  formData.rconProtocol === "rust-web"
    ? {
        rconIp: [
          {
            async validator(_: unknown, value: string) {
              if (!value.trim()) throw new Error(t("TXT_CODE_RCON_WEB_invalidTarget"));
            }
          }
        ],
        rconPort: [
          {
            async validator(_: unknown, value: string) {
              const port = Number(value);
              if (!Number.isInteger(port) || port < 1 || port > 65535)
                throw new Error(t("TXT_CODE_RCON_WEB_invalidTarget"));
            }
          }
        ],
        rconPassword: [
          {
            async validator(_: unknown, value: string) {
              if (!value) throw new Error(t("TXT_CODE_RCON_WEB_missingPassword"));
            }
          }
        ]
      }
    : undefined
);

const changeProtocol = (value: unknown) => {
  if (isReadOnly.value || (value !== "source" && value !== "rust-web")) return;
  if (value === "rust-web" && !isAdmin.value) return;
  if (value === "rust-web" && formData.rconProtocol === "source") {
    // Source targets may be tenant-controlled; do not promote them by prefilling WebRCON.
    formData.rconIp = "";
    formData.rconPort = "";
    formData.rconPassword = "";
  }
  formData.rconProtocol = value;
  formRef.value?.clearValidate();
};

const open = ref(false);
const openDialog = () => {
  open.value = true;
  formData.rconIp = props.instanceInfo?.config?.rconIp ?? "";
  formData.rconPassword = props.instanceInfo?.config?.rconPassword ?? "";
  formData.rconPort = String(props.instanceInfo?.config?.rconPort || "");
  formData.enableRcon = props.instanceInfo?.config?.enableRcon ?? false;
  formData.rconProtocol = props.instanceInfo?.config?.rconProtocol ?? "source";
};

const { execute, isLoading } = updateInstanceConfig();

const submit = async () => {
  if (isReadOnly.value) return;
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
        enableRcon: formData.enableRcon,
        rconProtocol: formData.rconProtocol
      }
    });
    emit("update");
    open.value = false;
    return message.success(t("TXT_CODE_d3de39b4"));
  } catch (err: any) {
    if (err.errorFields) return;
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
    :footer="isReadOnly ? null : undefined"
    @ok="submit"
  >
    <div>
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_32d87bf1") }}
        </a-typography-text>
      </a-typography-paragraph>
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-form-item>
          <a-typography-title :level="5">{{ t("TXT_CODE_179d7be4") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_a8839b35") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-switch v-model:checked="formData.enableRcon" :disabled="isReadOnly" />
        </a-form-item>

        <a-form-item v-if="formData.enableRcon" name="rconProtocol">
          <a-typography-title :level="5">{{ t("TXT_CODE_RCON_PROTOCOL") }}</a-typography-title>
          <a-select :value="formData.rconProtocol" :disabled="isReadOnly" @change="changeProtocol">
            <a-select-option value="source">{{ t("TXT_CODE_RCON_SOURCE") }}</a-select-option>
            <a-select-option
              v-if="isAdmin || formData.rconProtocol === 'rust-web'"
              value="rust-web"
            >
              {{ t("TXT_CODE_RCON_RUST_WEB") }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-typography-paragraph v-if="formData.rconProtocol === 'rust-web'">
          <a-typography-text
            v-if="props.instanceInfo?.config?.rconProtocol !== 'rust-web'"
            type="warning"
          >
            {{ t("TXT_CODE_RCON_WEB_reenterTarget") }}
          </a-typography-text>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_RCON_WEB_directAccessWarning") }}
          </a-typography-text>
        </a-typography-paragraph>

        <a-form-item name="rconIp">
          <a-typography-title :level="5">{{ t("TXT_CODE_d629fa48") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_8e2be926") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input
            v-model:value="formData.rconIp"
            :placeholder="t('TXT_CODE_47129a5b')"
            :readonly="isReadOnly"
          />
        </a-form-item>
        <a-form-item name="rconPort">
          <a-typography-title :level="5">{{ t("TXT_CODE_890aa44c") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_a4748cb0") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input
            v-model:value="formData.rconPort"
            :placeholder="t('TXT_CODE_e2dc0156')"
            :readonly="isReadOnly"
          />
        </a-form-item>
        <a-form-item name="rconPassword">
          <a-typography-title :level="5">{{ t("TXT_CODE_2880eed4") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_3ae0276b") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input-password
            v-model:value="formData.rconPassword"
            :placeholder="t('TXT_CODE_25af3af3')"
            :readonly="isReadOnly"
          />
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>
