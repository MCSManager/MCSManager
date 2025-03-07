<script setup lang="ts">
import { ref, computed, unref } from "vue";
import { t } from "@/lang/i18n";
import { useScreen } from "@/hooks/useScreen";
import type { InstanceDetail } from "@/types";
import type { FormInstance } from "ant-design-vue";
import type { Rule } from "ant-design-vue/es/form";
import { updateInstanceConfig } from "@/services/apis/instance";
import { message } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import { TERMINAL_CODE } from "@/types/const";
import { INSTANCE_TYPE_TRANSLATION } from "@/hooks/useInstance";
import { Dayjs } from "dayjs";
import _ from "lodash";
import { dayjsToTimestamp, timestampToDayjs } from "../../../tools/time";
import { useDockerEnvEditDialog } from "@/components/fc";

interface FormDetail extends InstanceDetail {
  dayjsEndTime?: Dayjs;
}

const props = defineProps<{
  instanceInfo?: InstanceDetail;
  instanceId?: string;
  daemonId?: string;
}>();

const emit = defineEmits(["update"]);

const options = ref<FormDetail>();
const screen = useScreen();
const isPhone = computed(() => screen.isPhone.value);
const open = ref(false);
const { execute, isLoading } = updateInstanceConfig();
const formRef = ref<FormInstance>();

const updateCommandDesc = t("TXT_CODE_fa487a47");
const UPDATE_CMD_TEMPLATE =
  t("TXT_CODE_61ca492b") +
  `"C:/SteamCMD/steamcmd.exe" +login anonymous +force_install_dir "{mcsm_workspace}" "+app_update 380870 validate" +quit`;

const initFormDetail = () => {
  if (props.instanceInfo) {
    options.value = {
      ...props.instanceInfo,
      dayjsEndTime: timestampToDayjs(props.instanceInfo?.config?.endTime)
    };
  }
};

const isDockerMode = computed(() => options.value?.config.processType === "docker");

const openDialog = async () => {
  open.value = true;
  initFormDetail();
};

const rules: Record<string, any> = {
  startCommand: [
    {
      required: true,
      validator: async (_rule: Rule, value: string) => {
        if (value.includes("\n")) throw new Error(t("TXT_CODE_bbbda29"));
      },
      trigger: "change"
    }
  ]
};

const submit = async () => {
  try {
    await formRef.value?.validateFields();
    if (!options.value?.config) throw new Error("");
    const postData = encodeFormData();
    await execute({
      params: {
        uuid: props.instanceId ?? "",
        daemonId: props.daemonId ?? ""
      },
      data: postData.config
    });
    emit("update");
    open.value = false;
    return message.success(t("TXT_CODE_d3de39b4"));
  } catch (error: any) {
    console.error(error);
    return reportErrorMsg(error.message ?? t("TXT_CODE_9911ac11"));
  }
};

const encodeFormData = () => {
  const postData = _.cloneDeep(unref(options));
  if (postData) {
    postData.config.endTime = dayjsToTimestamp(postData.dayjsEndTime);
    return postData;
  }
  throw new Error("Ref Options is null");
};

const handleEditDockerEnv = async () => {
  if (!options.value?.config) return;

  const envs = options.value.config.docker.env?.map((v) => {
    const tmp = v.split("=");
    return {
      label: tmp[0] || "",
      value: tmp[1] || ""
    };
  });
  const result = await useDockerEnvEditDialog(envs);
  const envsArray = result.map((v) => `${v.label}=${v.value}`);
  options.value.config.docker.env = envsArray;
};

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    :mask-closable="false"
    :width="isPhone ? '100%' : '1200px'"
    :title="t('TXT_CODE_aac98b2a')"
    :confirm-loading="isLoading"
    :ok-text="t('TXT_CODE_abfe9512')"
    @ok="submit"
  >
    <div class="dialog-overflow-container">
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_66f38b2e") }}
        </a-typography-text>
      </a-typography-paragraph>

      <a-form
        v-if="options"
        ref="formRef"
        :model="options.config"
        :rules="rules"
        layout="vertical"
        autocomplete="off"
      >
        <a-row :gutter="20">
          <a-col :xs="24" :lg="6" :offset="0">
            <a-form-item name="nickname">
              <a-typography-title :level="5">
                {{ t("TXT_CODE_f70badb9") }}
              </a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_818928ba") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-input v-model:value="options.config.nickname" disabled />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :lg="6" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">
                {{ t("TXT_CODE_2f291d8b") }}
              </a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_be608c82") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-input :value="INSTANCE_TYPE_TRANSLATION[options.config.type]" disabled />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :lg="6" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_fa920c0") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_b029a155") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-date-picker
                v-model:value="options.dayjsEndTime"
                size="large"
                show-time
                style="width: 100%"
                :placeholder="t('TXT_CODE_e3a77a77')"
                disabled
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :lg="6" :offset="0">
            <a-form-item>
              <a-typography-title :level="5" class="require-field">
                {{ t("TXT_CODE_f041de90") }}
              </a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_6e69b5a5") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-select
                v-model:value="options.config.fileCode"
                :placeholder="t('TXT_CODE_3bb646e4')"
              >
                <a-select-option v-for="item in TERMINAL_CODE" :key="item" :value="item">
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :offset="0">
            <a-form-item name="startCommand">
              <a-typography-title :level="5" :class="{ 'require-field': isDockerMode }">
                {{ t("TXT_CODE_d12fa808") }}
              </a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-html="t('TXT_CODE_A0000001')"></span>
                </a-typography-text>
              </a-typography-paragraph>
              <a-input-group compact style="display: flex">
                <a-textarea
                  v-model:value="options.config.startCommand"
                  :rows="5"
                  style="min-height: 40px"
                  :placeholder="isDockerMode ? t('TXT_CODE_98e7c829') : t('TXT_CODE_f50cfe2')"
                  :disabled="!isDockerMode"
                />
              </a-input-group>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :lg="18" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_bb0b9711") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  <span>{{ t("TXT_CODE_4f387c5a") }}</span>
                  <br />
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-html="updateCommandDesc"> </span>
                </a-typography-text>
              </a-typography-paragraph>
              <!-- eslint-disable-next-line vue/html-quotes -->
              <a-input
                v-model:value="options.config.updateCommand"
                :placeholder="UPDATE_CMD_TEMPLATE"
                :disabled="!isDockerMode"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :lg="6" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_b916a8dc") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary" :class="!isPhone && 'two-line-height'">
                  {{ t("TXT_CODE_33ce1c5c") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-input-group compact>
                <a-button type="default" @click="handleEditDockerEnv">
                  {{ t("TXT_CODE_ad207008") }}
                </a-button>
              </a-input-group>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </div>
  </a-modal>
</template>

<style scoped>
.two-line-height {
  display: block;
  height: 44px;
}
</style>
