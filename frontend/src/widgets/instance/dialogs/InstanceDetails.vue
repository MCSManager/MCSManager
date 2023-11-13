<script setup lang="ts">
import { ref, computed, toRaw, unref } from "vue";
import { t } from "@/lang/i18n";
import { useScreen } from "@/hooks/useScreen";
import type { InstanceDetail, DockerNetworkModes } from "@/types";
import type { FormInstance } from "ant-design-vue";
import type { Rule } from "ant-design-vue/es/form";
import { updateAnyInstanceConfig } from "@/services/apis/instance";
import { imageList, getNetworkModeList } from "@/services/apis/envImage";
import { message } from "ant-design-vue";
import { TERMINAL_CODE } from "@/types/const";
import { INSTANCE_TYPE_TRANSLATION } from "@/hooks/useInstance";
import { useAppRouters } from "@/hooks/useAppRouters";
import dayjs, { Dayjs } from "dayjs";
import _ from "lodash";
import { GLOBAL_INSTANCE_NAME } from "../../../config/const";

interface FormDetail extends InstanceDetail {
  dayjsEndTime: Dayjs;
}

const props = defineProps<{
  instanceInfo?: InstanceDetail;
  instanceId?: string;
  daemonId?: string;
}>();

const emit = defineEmits(["update"]);

const { toPage } = useAppRouters();
const options = ref<FormDetail>();
const screen = useScreen();
const isPhone = computed(() => screen.isPhone.value);
const open = ref(false);
const { execute: executeGetNetworkModeList } = getNetworkModeList();
const networkModes = ref<DockerNetworkModes[]>([]);
const { execute, isLoading } = updateAnyInstanceConfig();
const formRef = ref<FormInstance>();
const { execute: getImageList } = imageList();
const dockerImages = ref<string[]>([]);

const openDialog = () => {
  open.value = true;
  initFormDetail();
};

const initFormDetail = () => {
  if (props.instanceInfo) {
    options.value = {
      ...props.instanceInfo,
      dayjsEndTime: dayjs(props.instanceInfo?.config?.endTime)
    };
  }
};

const isGlobalTerminal = computed(() => {
  return props.instanceInfo?.config.nickname === GLOBAL_INSTANCE_NAME;
});

const loadImages = async () => {
  try {
    const images = await getImageList({
      params: {
        remote_uuid: props.daemonId ?? ""
      },
      method: "GET"
    });
    if (images.value) {
      dockerImages.value = [t("TXT_CODE_3362d4b7")];
      for (const iterator of images.value) {
        const repoTags = (iterator?.RepoTags ?? [])[0];
        if (repoTags) dockerImages.value.push(repoTags);
      }
    }
  } catch (err: any) {
    return message.error(err.message);
  }
};

const selectImage = (image: string) => {
  if (typeof image === "string" && image.startsWith("---", 0)) {
    // TODO: Docker image list page
    toPage({
      path: `/image/${props.daemonId}`
    });
  }
};

const loadNetworkModes = async () => {
  try {
    const modes = await executeGetNetworkModeList({
      params: {
        remote_uuid: props.daemonId ?? ""
      }
    });
    if (modes.value) networkModes.value = modes.value;
  } catch (err: any) {
    return message.error(err.message);
  }
};

const rules: Record<string, Rule[]> = {
  nickname: [{ required: true, message: t("TXT_CODE_68a504b3") }],
  startCommand: [
    {
      required: true,
      validator: async (_rule: Rule, value: string) => {
        if (value === "") throw new Error(t("TXT_CODE_4e810102"));
        if (value.includes("\n")) throw new Error(t("TXT_CODE_bbbda29"));
      },
      trigger: "change"
    }
  ],
  dockerImage: [
    {
      required: true,
      validator: async () => {
        if (
          options.value?.config.processType === "docker" &&
          options.value?.config.docker.image === ""
        )
          throw new Error(t("TXT_CODE_be6484f7"));
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
        remote_uuid: props.daemonId ?? ""
      },
      data: postData.config
    });
    emit("update");
    open.value = false;
    return message.success(t("TXT_CODE_d3de39b4"));
  } catch (error: any) {
    console.error(error);
    return message.error(error.message);
  }
};

const encodeFormData = () => {
  const postData = _.cloneDeep(unref(options));
  if (postData) {
    postData.config.endTime = postData.dayjsEndTime.format("YYYY/MM/DD");
    return postData;
  }
  throw new Error("Ref Options is null");
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
    :width="isPhone ? '100%' : 'calc(100% - 30vw)'"
    :title="t('TXT_CODE_aac98b2a')"
    :confirm-loading="isLoading"
    :ok-text="t('TXT_CODE_abfe9512')"
    @ok="submit"
  >
    <div class="dialog-overflow-container">
      <a-form
        v-if="options"
        ref="formRef"
        :model="options.config"
        :rules="rules"
        layout="vertical"
        autocomplete="off"
      >
        <a-row :gutter="20">
          <a-col :xs="24" :md="12" :offset="0">
            <a-form-item name="nickname">
              <a-typography-title :level="5" class="require-field">
                {{ t("TXT_CODE_f70badb9") }}
              </a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary" :class="!isPhone && 'two-line-height'">
                  {{ t("TXT_CODE_818928ba") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-input v-model:value="options.config.nickname" :disabled="isGlobalTerminal" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12" :offset="0">
            <a-form-item>
              <a-typography-title :level="5" class="require-field">
                {{ t("TXT_CODE_2f291d8b") }}
              </a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary" :class="!isPhone && 'two-line-height'">
                  {{ t("TXT_CODE_1e1dfbbe") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-select
                v-model:value="options.config.type"
                :placeholder="t('TXT_CODE_3bb646e4')"
                :disabled="isGlobalTerminal"
              >
                <a-select-option
                  v-for="(item, key) in INSTANCE_TYPE_TRANSLATION"
                  :key="key"
                  :value="key"
                >
                  {{ item }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :offset="0">
            <a-form-item name="startCommand">
              <a-typography-title :level="5" class="require-field">
                {{ t("TXT_CODE_d12fa808") }}
              </a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_A0000001") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-input-group compact style="display: flex">
                <a-textarea
                  v-model:value="options.config.startCommand"
                  :rows="3"
                  style="min-height: 40px"
                />
                <a-button type="default" style="height: auto">命令助手</a-button>
              </a-input-group>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :offset="0">
            <a-form-item name="cwd">
              <a-typography-title :level="5" class="require-field">
                {{ t("TXT_CODE_ee67e1a3") }}
              </a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_962d9320") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-input v-model:value="options.config.cwd" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_bb0b9711") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_41763172") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-input v-model:value="options.config.updateCommand" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="20">
          <a-col :xs="24" :lg="6" :offset="0">
            <a-form-item>
              <a-typography-title :level="5" class="require-field">
                {{ t("TXT_CODE_f041de90") }}
              </a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary" :class="!isPhone && 'two-line-height'">
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
          <a-col :xs="24" :lg="6" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_fa920c0") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary" :class="!isPhone && 'two-line-height'">
                  {{ t("TXT_CODE_b029a155") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-date-picker
                v-model:value="options.dayjsEndTime"
                size="large"
                style="width: 100%"
                :placeholder="t('TXT_CODE_e3a77a77')"
                :disabled="isGlobalTerminal"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :lg="12" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_9eacb622") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary" :class="!isPhone && 'two-line-height'">
                  {{ t("TXT_CODE_9278b7b0") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-select v-model:value="options.config.processType" :disabled="isGlobalTerminal">
                <a-select-option value="general">
                  {{ t("TXT_CODE_5be6c38e") }}
                </a-select-option>
                <a-select-option value="docker">
                  {{ t("TXT_CODE_6c87dd18") }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row v-if="options.config.processType === 'docker'" :gutter="20">
          <a-col :xs="24" :lg="6" :offset="0">
            <a-form-item name="dockerImage">
              <a-typography-title :level="5" class="require-field">
                {{ t("TXT_CODE_6904cb3") }}
              </a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_a584cb71") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-select
                v-model:value="options.config.docker.image"
                size="large"
                style="width: 100%"
                :placeholder="t('TXT_CODE_3bb646e4')"
                @focus="loadImages"
                @change="selectImage"
              >
                <a-select-option
                  v-for="item in dockerImages"
                  :key="item"
                  :value="item"
                ></a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :lg="18" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_cf88c936") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_c7b95258") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-input-group compact>
                <a-input
                  v-model:value="options.config.docker.ports"
                  style="width: calc(100% - 88px)"
                />
                <a-button type="default">{{ t("快速编辑") }}</a-button>
              </a-input-group>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_3e68ca00") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_29c2884") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-input-group compact>
                <a-input
                  v-model:value="options.config.docker.extraVolumes"
                  style="width: calc(100% - 88px)"
                />
                <a-button type="default">{{ t("快速编辑") }}</a-button>
              </a-input-group>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :lg="8" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_c3a3b6b1") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_d1c78fbf") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-tooltip placement="bottom">
                <template #title>{{ t("TXT_CODE_8d4882b0") }}</template>
                <a-input
                  v-model:value="options.config.docker.containerName"
                  :placeholder="t('TXT_CODE_f6047384')"
                />
              </a-tooltip>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :lg="8" :offset="0">
            <a-form-item>
              <a-typography-title :level="5" class="require-field">
                {{ t("TXT_CODE_efcef926") }}
              </a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_38a430d8") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-select
                v-model:value="options.config.docker.networkMode"
                size="large"
                style="width: 100%"
                :placeholder="t('TXT_CODE_3bb646e4')"
                @focus="loadNetworkModes"
              >
                <a-select-option
                  v-for="item in networkModes"
                  :key="item"
                  :value="item.Name"
                ></a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :lg="8" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_10194e6a") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_97655c5d") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-input
                v-model:value="options.config.docker.networkAliases"
                :placeholder="t('TXT_CODE_8d4882b0')"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :lg="8" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_53046822") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_750ab5c6") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-tooltip placement="bottom">
                <template #title>
                  {{ t("TXT_CODE_dce87e42") }}
                </template>
                <a-input
                  v-model:value="options.config.docker.cpuUsage"
                  :placeholder="t('TXT_CODE_91d857f5')"
                />
              </a-tooltip>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :lg="8" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_b0c4e4ae") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_2b9e9b5") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-tooltip placement="bottom">
                <template #title>
                  {{ t("TXT_CODE_67c765be") }}
                </template>
                <a-input
                  v-model:value="options.config.docker.cpusetCpus"
                  :placeholder="t('TXT_CODE_30fe1717')"
                />
              </a-tooltip>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :lg="8" :offset="0">
            <a-form-item>
              <a-typography-title :level="5">{{ t("TXT_CODE_6fe24924") }}</a-typography-title>
              <a-typography-paragraph>
                <a-typography-text type="secondary">
                  {{ t("TXT_CODE_a0d214ac") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-input
                v-model:value="options.config.docker.memory"
                :placeholder="t('TXT_CODE_80790069')"
              />
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
