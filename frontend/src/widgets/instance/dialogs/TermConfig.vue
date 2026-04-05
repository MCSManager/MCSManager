<script setup lang="ts">
import { ref, computed } from "vue";
import { t } from "@/lang/i18n";
import { useScreen } from "@/hooks/useScreen";
import type { InstanceDetail } from "@/types";
import { updateInstanceConfig } from "@/services/apis/instance";
import { message } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import { TERMINAL_CODE } from "@/types/const";

const props = defineProps<{
  instanceInfo?: InstanceDetail;
  instanceId?: string;
  daemonId?: string;
}>();
const emit = defineEmits(["update"]);
const options = ref<InstanceDetail>();

const screen = useScreen();
const isPhone = computed(() => screen.isPhone.value);
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
        terminalOption: options.value?.config.terminalOption,
        crlf: options.value?.config.crlf,
        ie: options.value?.config.ie,
        oe: options.value?.config.oe,
        stopCommand: options.value?.config.stopCommand
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
    width="auto"
    :title="t('TXT_CODE_d23631cb')"
    :confirm-loading="isLoading"
    :ok-text="t('TXT_CODE_abfe9512')"
    @ok="submit"
  >
    <a-form v-if="options" layout="vertical">
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :md="12" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("TXT_CODE_ef650d57") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_feeea328") }}
                <br />
                {{ t("TXT_CODE_d6e7f572") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-switch v-model:checked="options.config.terminalOption.pty" />
          </a-form-item>

          <a-form-item>
            <a-typography-title :level="5">{{ t("TXT_CODE_e1a3b150") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_6a515e35") }}
                <br />
                {{ t("TXT_CODE_1295831e") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-switch v-model:checked="options.config.terminalOption.haveColor" />
          </a-form-item>

          <a-form-item>
            <a-typography-title :level="5">{{ t("TXT_CODE_b91a94f9") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_5b2daea0") }}
                <br />
                {{ t("TXT_CODE_b94f13ce") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-select
              v-model:value="options.config.crlf"
              :placeholder="t('TXT_CODE_3bb646e4')"
              :style="'width: ' + (isPhone ? '100%' : '220px')"
            >
              <a-select-option :value="1"> {{ t("TXT_CODE_365aabd4") }}</a-select-option>
              <a-select-option :value="2">{{ t("TXT_CODE_20cec54") }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="12" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("TXT_CODE_11cfe3a1") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_7ec7ccb8") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input
              v-model:value="options.config.stopCommand"
              :style="'width: ' + (isPhone ? '100%' : '220px')"
            />
          </a-form-item>

          <a-form-item>
            <a-typography-title :level="5">{{ t("TXT_CODE_449d1581") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_d16d82ab") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-select
              v-model:value="options.config.ie"
              class="mr-10 mb-20"
              :placeholder="t('TXT_CODE_bd2559f3')"
              :style="'width: ' + (isPhone ? '100%' : '220px')"
            >
              <a-select-option v-for="item in TERMINAL_CODE" :key="item" :value="item">
              </a-select-option>
            </a-select>
            <a-select
              v-model:value="options.config.oe"
              :placeholder="t('TXT_CODE_6e96b2a9')"
              :style="'width: ' + (isPhone ? '100%' : '220px')"
            >
              <a-select-option v-for="item in TERMINAL_CODE" :key="item" :value="item">
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>
