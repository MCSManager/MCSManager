<script setup lang="ts">
import {
  useDockerEnvEditDialog,
  usePortEditDialog,
  useUploadFileDialog,
  useVolumeEditDialog
} from "@/components/fc";
import { useAppRouters } from "@/hooks/useAppRouters";
import { INSTANCE_TYPE_TRANSLATION } from "@/hooks/useInstance";
import { SEARCH_ALL_KEY, useMarketPackages, type FilterOption } from "@/hooks/useMarketPackages";
import { useScreen } from "@/hooks/useScreen";
import { isCN, t } from "@/lang/i18n";
import { getNetworkModeList, imageList } from "@/services/apis/envImage";
import { updateAnyInstanceConfig } from "@/services/apis/instance";
import { dockerPortsArray } from "@/tools/common";
import { reportErrorMsg } from "@/tools/validator";
import type { DockerNetworkModes, InstanceDetail, QuickStartPackages } from "@/types";
import { defaultQuickStartPackages, TERMINAL_CODE } from "@/types/const";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons-vue";
import type { FormInstance } from "ant-design-vue";
import { message } from "ant-design-vue";
import type { Rule } from "ant-design-vue/es/form";
import type { DefaultOptionType } from "ant-design-vue/es/select";
import { Dayjs } from "dayjs";
import _ from "lodash";
import { computed, defineComponent, ref, unref } from "vue";
import { GLOBAL_INSTANCE_NAME } from "../../../config/const";
import { dayjsToTimestamp, timestampToDayjs } from "../../../tools/time";

interface FormDetail extends InstanceDetail {
  dayjsEndTime?: Dayjs;
  networkAliasesText: string;
  imageSelectMethod: "SELECT" | "EDIT";
}

const props = defineProps<{
  instanceInfo?: InstanceDetail;
  instanceId?: string;
  daemonId?: string;
  gameTypeList?: FilterOption[];
  platformList?: FilterOption[];
  categoryList?: FilterOption[];
}>();

const emit = defineEmits(["update", "save-template"]);
const open = ref(false);

// eslint-disable-next-line no-unused-vars
enum TabSettings {
  // eslint-disable-next-line no-unused-vars
  Template,
  // eslint-disable-next-line no-unused-vars
  Basic,
  // eslint-disable-next-line no-unused-vars
  Docker,
  // eslint-disable-next-line no-unused-vars
  Advanced,
  // eslint-disable-next-line no-unused-vars
  ResLimit
}
const activeKey = ref<TabSettings>(TabSettings.Basic);

const IMAGE_DEFINE = {
  NEW: "__MCSM_NEW_IMAGE__",
  EDIT: "__MCSM_EDIT_IMAGE__"
};
const UPDATE_CMD_DESCRIPTION = t("TXT_CODE_fa487a47");
const UPDATE_CMD_TEMPLATE =
  t("TXT_CODE_61ca492b") +
  '"C:/SteamCMD/steamcmd.exe" +login anonymous +force_install_dir "{mcsm_workspace}" "+app_update 380870 validate" +quit';

const formType = ref<"template" | "normal">("normal");
const isEditMode = ref(false);
const isTemplateMode = computed(() => formType.value === "template");
const title = computed(() =>
  isTemplateMode.value
    ? isEditMode.value
      ? t("TXT_CODE_921206fc")
      : t("TXT_CODE_3d45d8d")
    : t("TXT_CODE_aac98b2a")
);
const { toPage } = useAppRouters();
const { isPhone } = useScreen();

// form
const instanceFormRef = ref<FormInstance>();
const instanceFormData = ref<Partial<FormDetail>>();
const instanceFormRules: Record<string, any> = {
  nickname: [{ required: true, message: t("TXT_CODE_68a504b3") }],
  startCommand: [
    {
      required: true,
      validator: async (_rule: Rule, value: string) => {
        if (value.includes("\n")) throw new Error(t("TXT_CODE_bbbda29"));
      },
      trigger: "change"
    }
  ],
  cwd: [{ required: true, message: t("TXT_CODE_71c948a9") }],
  basePort: [
    {
      validator: async (_rule: Rule, value: number) => {
        if (value !== undefined && value !== null && value !== 0) {
          if (value < 0 || value > 65535) {
            throw new Error(t("TXT_CODE_12040bf0"));
          }
        }
      },
      trigger: "change"
    }
  ],
  docker: {
    image: [
      {
        required: true,
        validator: async (_rule: Rule, value: string) => {
          if (!isDockerMode.value) return;
          const ErrMsg =
            instanceFormData.value?.imageSelectMethod === "EDIT"
              ? t("TXT_CODE_9fed23ab")
              : t("TXT_CODE_be6484f7");
          if (value === "") throw new Error(ErrMsg);
        },
        trigger: "change"
      }
    ],
    networkMode: [
      {
        validator: async (_rule: Rule, value: string) => {
          if (!isDockerMode.value) return;
          if (value === "") throw new Error(t("TXT_CODE_b52cb76c"));
        }
      }
    ]
  },
  dockerImage: []
};

const templateFormRef = ref<FormInstance>();
const templateFormData = ref<QuickStartPackages>();
const templateFormRules = computed<Partial<Record<keyof QuickStartPackages, any>>>(() => ({
  title: [{ required: true, message: t("TXT_CODE_6b5509c7") }],
  language: [{ required: true, message: t("TXT_CODE_60752a40") }],
  platform: [{ required: true, message: t("TXT_CODE_46039f9b") }],
  description: [{ required: true, message: t("TXT_CODE_8d6c8ae7") }],
  image: [{ required: true, message: t("TXT_CODE_c11ac499") }],
  author: [{ required: true, message: t("TXT_CODE_f6d73056") }],
  gameType: [{ required: true, message: t("TXT_CODE_f0694685") }],
  category: [{ required: true, message: t("TXT_CODE_b2391fca") }],
  runtime: [{ required: true, message: t("TXT_CODE_8717ed9d") }],
  hardware: [{ required: true, message: t("TXT_CODE_f7909939") }],
  setupInfo: {
    type: [{ required: true, message: t("TXT_CODE_9f4eaa41") }]
  }
}));
const templateIndex = ref<number>(-1);
const { languageOptions } = useMarketPackages();

const initFormDetail = () => {
  if (props.instanceInfo) {
    instanceFormData.value = {
      ...props.instanceInfo,
      dayjsEndTime: timestampToDayjs(props.instanceInfo?.config?.endTime),
      networkAliasesText: props.instanceInfo?.config?.docker.networkAliases?.join(",") || "",
      imageSelectMethod: "SELECT"
    };
  } else {
    selectOptions.value.appGameTypeList = props.gameTypeList;
    selectOptions.value.appPlatformList = props.platformList;
    selectOptions.value.appCategoryList = props.categoryList;

    instanceFormData.value = {
      config: templateFormData.value!.setupInfo!,
      dayjsEndTime: timestampToDayjs(templateFormData.value!.setupInfo!.endTime),
      networkAliasesText: templateFormData.value!.setupInfo!.docker.networkAliases?.join(",") || "",
      imageSelectMethod: "SELECT"
    };
  }
};

const VNodes = defineComponent({
  props: {
    vnodes: {
      type: Object,
      required: true
    }
  },
  render() {
    return this.vnodes;
  }
});
const selectOptions = ref({
  appGameTypeList: props.gameTypeList,
  appPlatformList: props.platformList,
  appCategoryList: props.categoryList
});
const searchFormData = ref<{
  appGameTypeList: string;
  appPlatformList: string;
  appCategoryList: string;
}>({
  appGameTypeList: "",
  appPlatformList: "",
  appCategoryList: ""
});
const addOption = (item: string, category: keyof typeof selectOptions.value) => {
  selectOptions.value![category]!.push({
    label: item,
    value: item
  });
  searchFormData.value[category] = "";
};

const networkModes = ref<DockerNetworkModes[]>([]);
const dockerImages = ref<{ label: string; value: string }[]>([]);
const { execute: executeGetNetworkModeList } = getNetworkModeList();
const { execute, isLoading } = updateAnyInstanceConfig();
const { execute: getImageList } = imageList();

const isGlobalTerminal = computed(() => {
  return props.instanceInfo?.config.nickname === GLOBAL_INSTANCE_NAME;
});

const isDockerMode = computed(() => instanceFormData?.value?.config?.processType === "docker");

const loadImages = async () => {
  dockerImages.value = [
    {
      label: t("TXT_CODE_435f4975"),
      value: IMAGE_DEFINE.EDIT
    }
  ];

  try {
    const images = await getImageList({
      params: {
        daemonId: props.daemonId ?? ""
      },
      method: "GET"
    });

    if (images.value) {
      for (const iterator of images.value) {
        const repoTags = iterator?.RepoTags?.[0];
        if (repoTags)
          dockerImages.value.push({
            label: repoTags,
            value: repoTags
          });
      }
    }
  } catch (err: any) {
    // ignore
  }
};

const selectImage = (row: DefaultOptionType) => {
  const image = row.value;
  if (typeof image === "string" && image === IMAGE_DEFINE.NEW) {
    toPage({
      path: `/node/image?daemonId=${props.daemonId}`
    });
    return;
  }
  if (image === IMAGE_DEFINE.EDIT && instanceFormData.value?.config) {
    instanceFormData.value.config.docker.image = "";
    instanceFormData.value.imageSelectMethod = "EDIT";
    return;
  }
};

const loadNetworkModes = async () => {
  try {
    const modes = await executeGetNetworkModeList({
      params: {
        daemonId: props.daemonId ?? ""
      }
    });
    if (modes.value) networkModes.value = modes.value;
  } catch (err: any) {
    // ignore
  }
};

const openDialog = async ({ item, i }: { item?: QuickStartPackages; i?: number } = {}) => {
  if (item) {
    templateFormData.value = _.cloneDeep(item);
    if (!templateFormData.value.setupInfo?.docker)
      templateFormData.value.setupInfo!.docker = _.cloneDeep(
        defaultQuickStartPackages.setupInfo!.docker
      );
    isEditMode.value = true;
    templateIndex.value = Number(i);

    formType.value = "template";
    activeKey.value = TabSettings.Template;
  } else if (Number(i) < 0) {
    templateFormData.value = _.cloneDeep(defaultQuickStartPackages);
    templateFormData.value.language = isCN() ? "zh_cn" : "en_us";
    isEditMode.value = false;

    formType.value = "template";
    activeKey.value = TabSettings.Template;
  } else {
    await Promise.all([loadImages(), loadNetworkModes()]);
  }
  initFormDetail();
  open.value = true;
};

const submit = async () => {
  try {
    if (isTemplateMode.value) {
      await templateFormRef.value?.validate();
      await instanceFormRef.value?.validateFields();
      emit("save-template", _.cloneDeep(templateFormData.value), templateIndex.value);
      open.value = false;
      message.success(isEditMode.value ? t("TXT_CODE_a7907771") : t("TXT_CODE_d28c05df"));
      templateFormRef.value?.resetFields();
      templateFormData.value = _.cloneDeep(defaultQuickStartPackages);
      return;
    } else {
      await instanceFormRef.value?.validateFields();
      const postData = encodeFormData();
      await execute({
        params: {
          uuid: props.instanceId ?? "",
          daemonId: props.daemonId ?? ""
        },
        data: postData?.config!
      });
      emit("update");
      open.value = false;
      return message.success(t("TXT_CODE_d3de39b4"));
    }
  } catch (error: any) {
    console.error(error);
    return reportErrorMsg(error.message ?? t("TXT_CODE_9911ac11"));
  }
};

const encodeFormData = () => {
  const postData = _.cloneDeep(unref(instanceFormData));
  if (postData?.config) {
    postData.config.endTime = dayjsToTimestamp(postData.dayjsEndTime);
    postData.config.docker.networkAliases = postData?.networkAliasesText
      ?.split(",")
      ?.map((v) => v.trim())
      ?.filter((v) => v !== "");
    return postData;
  }
  throw new Error("Ref Options is null");
};

const handleEditDockerConfig = async (type: "port" | "volume" | "env") => {
  if (type === "port" && instanceFormData.value?.config) {
    // "25565:25565/tcp 8080:8080/tcp" -> Array
    const portArray = dockerPortsArray(instanceFormData.value?.config.docker.ports || []);
    const result = await usePortEditDialog(portArray);
    const portsArray = result.map((v) => `${v.host}:${v.container}/${v.protocol}`);
    instanceFormData.value.config.docker.ports = portsArray;
  }

  if (type === "volume" && instanceFormData.value?.config) {
    const volumes = instanceFormData.value.config.docker.extraVolumes?.map((v) => {
      const tmp = v.split("|");
      return {
        host: tmp[0] || "",
        container: tmp[1] || ""
      };
    });
    const result = await useVolumeEditDialog(volumes);
    const volumesArray = result.map((v) => `${v.host}|${v.container}`);
    instanceFormData.value.config.docker.extraVolumes = volumesArray;
  }

  if (type === "env" && instanceFormData.value?.config) {
    const envs = instanceFormData.value.config.docker.env?.map((v) => {
      const tmp = v.split("=");
      return {
        label: tmp[0] || "",
        value: tmp[1] || ""
      };
    });
    const result = await useDockerEnvEditDialog(envs);
    const envsArray = result.map((v) => `${v.label}=${v.value}`);
    instanceFormData.value.config.docker.env = envsArray;
  }
};

const handleUploadImg = async () => {
  const url = await useUploadFileDialog();
  if (url && templateFormData.value) templateFormData.value.image = url;
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
    :title="title"
    :confirm-loading="isLoading"
    :ok-text="t('TXT_CODE_abfe9512')"
    @ok="submit"
  >
    <div class="dialog-overflow-container">
      <a-tooltip v-if="!isTemplateMode" :title="t('TXT_CODE_cdf7c16a')" placement="top">
        <a-typography-text type="secondary" class="typography-text-ellipsis">
          {{ t("TXT_CODE_cdf7c16a") }}
        </a-typography-text>
      </a-tooltip>
      <div v-if="!instanceFormData?.config">
        <a-typography-title :level="5">
          {{ t("此实例配置存在问题，请刷新页面重试，或重新创建实例！") }}.
        </a-typography-title>
      </div>
      <a-form
        v-if="instanceFormData?.config"
        ref="instanceFormRef"
        :model="instanceFormData.config"
        :rules="instanceFormRules"
        layout="vertical"
        autocomplete="off"
      >
        <a-tabs v-model:activeKey="activeKey">
          <a-tab-pane
            v-if="isTemplateMode && templateFormData"
            :key="TabSettings.Template"
            :tab="t('TXT_CODE_d9c63fdd')"
          >
            <a-form
              ref="templateFormRef"
              :model="templateFormData"
              :rules="templateFormRules"
              layout="vertical"
            >
              <a-row :gutter="20">
                <a-col :span="24" :sm="24" :md="12">
                  <a-form-item name="image">
                    <a-typography-title :level="5" class="require-field">
                      {{ t("TXT_CODE_80c5409f") }}
                    </a-typography-title>
                    <a-image
                      fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1700' height='800' viewBox='0 0 170 80'%3E%3Crect width='1700' height='800' fill='%230044ff' fill-opacity='0.1'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23ffffff80'%3EEmpty%3C/text%3E%3C/svg%3E"
                      class="cursor-pointer"
                      style="border-radius: 8px"
                      width="100%"
                      :src="templateFormData.image"
                      :placeholder="false"
                      :preview="false"
                      @click="handleUploadImg"
                    />
                    <a-input
                      v-model:value="templateFormData.image"
                      class="mt-10"
                      :placeholder="t('TXT_CODE_99a42341')"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="24" :sm="24" :md="12">
                  <a-form-item name="title">
                    <a-typography-title :level="5" class="require-field">
                      {{ t("TXT_CODE_f4fba0cd") }}
                    </a-typography-title>
                    <a-input
                      v-model:value="templateFormData.title"
                      :placeholder="t('TXT_CODE_6b5509c7')"
                    />
                  </a-form-item>

                  <a-form-item name="description">
                    <a-typography-title :level="5" class="require-field">
                      {{ t("TXT_CODE_59cdbec3") }}
                    </a-typography-title>
                    <a-textarea
                      v-model:value="templateFormData.description"
                      :placeholder="t('TXT_CODE_98dbd049')"
                      allow-clear
                      size="large"
                      :auto-size="{ minRows: 1 }"
                    />
                  </a-form-item>

                  <a-row :gutter="20">
                    <a-col :span="24" :lg="12">
                      <a-form-item name="language">
                        <a-typography-title :level="5" class="require-field">
                          {{ t("TXT_CODE_2a34c50a") }}
                        </a-typography-title>
                        <a-select
                          v-model:value="templateFormData.language"
                          :placeholder="t('TXT_CODE_60752a40')"
                          :options="languageOptions"
                        />
                      </a-form-item>
                    </a-col>
                    <a-col :span="24" :lg="12">
                      <a-form-item name="author">
                        <a-typography-title :level="5" class="require-field">
                          {{ t("TXT_CODE_3d56da34") }}
                        </a-typography-title>
                        <a-input
                          v-model:value="templateFormData.author"
                          :placeholder="t('TXT_CODE_e6adf32d')"
                        />
                      </a-form-item>
                    </a-col>
                  </a-row>
                </a-col>
              </a-row>

              <a-row :gutter="20">
                <a-col :span="24" :sm="12" :lg="6">
                  <a-form-item name="type">
                    <a-typography-title :level="5" class="require-field">
                      {{ t("TXT_CODE_c5ace40b") }}
                    </a-typography-title>
                    <a-select
                      v-if="templateFormData.setupInfo"
                      v-model:value="templateFormData.setupInfo.type"
                      :placeholder="t('TXT_CODE_3bb646e4')"
                      show-search
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
                <a-col :span="24" :sm="12" :lg="6">
                  <a-form-item name="gameType">
                    <a-typography-title :level="5" class="require-field">
                      {{ t("TXT_CODE_ebfb4831") }}
                    </a-typography-title>
                    <a-select
                      v-model:value="templateFormData.gameType"
                      show-search
                      :placeholder="t('TXT_CODE_3bb646e4')"
                      :options="
                        selectOptions.appGameTypeList?.filter(
                          (item) => item.value !== SEARCH_ALL_KEY
                        )
                      "
                    >
                      <template #dropdownRender="{ menuNode: menu }">
                        <v-nodes :vnodes="menu" />
                        <a-divider style="margin: 4px 0" />
                        <a-space style="padding: 4px 8px">
                          <a-input
                            ref="inputRef"
                            v-model:value="searchFormData.appGameTypeList"
                            size="middle"
                          />
                          <a-button
                            type="text"
                            @click="addOption(searchFormData.appGameTypeList, 'appGameTypeList')"
                          >
                            <template #icon>
                              <PlusOutlined />
                            </template>
                            {{ t("TXT_CODE_a1d885c1") }}
                          </a-button>
                        </a-space>
                      </template>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="24" :sm="12" :lg="6">
                  <a-form-item name="platform">
                    <a-typography-title :level="5" class="require-field">
                      {{ t("TXT_CODE_1ce1d1d1") }}
                    </a-typography-title>
                    <a-select
                      v-model:value="templateFormData.platform"
                      show-search
                      :placeholder="t('TXT_CODE_3bb646e4')"
                      :options="
                        selectOptions.appPlatformList?.filter(
                          (item) => item.value !== SEARCH_ALL_KEY
                        )
                      "
                    >
                      <template #dropdownRender="{ menuNode: menu }">
                        <v-nodes :vnodes="menu" />
                        <a-divider style="margin: 4px 0" />
                        <a-space style="padding: 4px 8px">
                          <a-input
                            ref="inputRef"
                            v-model:value="searchFormData.appPlatformList"
                            size="middle"
                          />
                          <a-button
                            type="text"
                            @click="addOption(searchFormData.appPlatformList, 'appPlatformList')"
                          >
                            <template #icon>
                              <PlusOutlined />
                            </template>
                            {{ t("TXT_CODE_a1d885c1") }}
                          </a-button>
                        </a-space>
                      </template>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="24" :sm="12" :lg="6">
                  <a-form-item name="category">
                    <a-typography-title :level="5" class="require-field">
                      {{ t("TXT_CODE_2d8a400") }}
                    </a-typography-title>
                    <a-select
                      v-model:value="templateFormData.category"
                      show-search
                      :placeholder="t('TXT_CODE_3bb646e4')"
                      :options="
                        selectOptions.appCategoryList?.filter(
                          (item) => item.value !== SEARCH_ALL_KEY
                        )
                      "
                    >
                      <template #dropdownRender="{ menuNode: menu }">
                        <v-nodes :vnodes="menu" />
                        <a-divider style="margin: 4px 0" />
                        <a-space style="padding: 4px 8px">
                          <a-input
                            ref="inputRef"
                            v-model:value="searchFormData.appCategoryList"
                            size="middle"
                          />
                          <a-button
                            type="text"
                            @click="addOption(searchFormData.appCategoryList, 'appCategoryList')"
                          >
                            <template #icon>
                              <PlusOutlined />
                            </template>
                            {{ t("TXT_CODE_a1d885c1") }}
                          </a-button>
                        </a-space>
                      </template>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-row :gutter="20">
                <a-col :span="24" :sm="12" :lg="8">
                  <a-form-item name="runtime">
                    <a-typography-title :level="5" class="require-field">
                      {{ t("TXT_CODE_80c85070") }}
                    </a-typography-title>
                    <a-input
                      v-model:value="templateFormData.runtime"
                      :placeholder="t('TXT_CODE_772bb48a')"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="24" :sm="12" :lg="8">
                  <a-form-item name="hardware">
                    <a-typography-title :level="5" class="require-field">
                      {{ t("TXT_CODE_683e3033") }}
                    </a-typography-title>
                    <a-input
                      v-model:value="templateFormData.hardware"
                      :placeholder="t('TXT_CODE_d79ff710')"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="24" :sm="12" :lg="8">
                  <a-form-item name="size">
                    <a-typography-title :level="5" class="require-field">
                      {{ t("TXT_CODE_8dbcf565") }}
                    </a-typography-title>
                    <a-input
                      v-model:value="templateFormData.size"
                      :placeholder="t('TXT_CODE_d0d08d6')"
                    />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-form-item name="targetLink">
                <a-typography-title :level="5" class="require-field">
                  {{ t("TXT_CODE_13eac7e1") }}
                </a-typography-title>
                <a-input
                  v-model:value="templateFormData.targetLink"
                  :placeholder="t('TXT_CODE_8d83752')"
                />
              </a-form-item>

              <a-form-item name="tags">
                <a-typography-title :level="5" class="require-field">
                  {{ t("TXT_CODE_9901af98") }}
                </a-typography-title>
                <a-select
                  v-model:value="templateFormData.tags"
                  mode="tags"
                  :placeholder="t('TXT_CODE_7d839745')"
                  :token-separators="[',']"
                ></a-select>
              </a-form-item>
            </a-form>
          </a-tab-pane>
          <a-tab-pane :key="TabSettings.Basic" :tab="t('TXT_CODE_cc7b54b9')">
            <a-row :gutter="20">
              <a-col v-if="!isTemplateMode" :xs="24" :lg="8" :offset="0">
                <a-form-item name="nickname">
                  <a-typography-title :level="5" class="require-field">
                    {{ t("TXT_CODE_f70badb9") }}
                  </a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="t('TXT_CODE_818928ba')" placement="top">
                      <a-typography-text type="secondary" class="typography-text-ellipsis">
                        {{ t("TXT_CODE_818928ba") }}
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <a-input
                    v-model:value="instanceFormData.config.nickname"
                    :disabled="isGlobalTerminal"
                  />
                </a-form-item>
              </a-col>
              <a-col v-if="!isTemplateMode" :xs="24" :lg="8" :offset="0">
                <a-form-item>
                  <a-typography-title :level="5" class="require-field">
                    {{ t("TXT_CODE_2f291d8b") }}
                  </a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="t('TXT_CODE_be608c82')" placement="top">
                      <a-typography-text type="secondary" class="typography-text-ellipsis">
                        {{ t("TXT_CODE_be608c82") }}
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <a-select
                    v-model:value="instanceFormData.config.type"
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

              <a-col :xs="24" :lg="8" :offset="0">
                <a-form-item>
                  <a-typography-title :level="5">{{ t("TXT_CODE_fa920c0") }}</a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="t('TXT_CODE_b029a155')" placement="top">
                      <a-typography-text type="secondary" class="typography-text-ellipsis">
                        {{ t("TXT_CODE_b029a155") }}
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <a-date-picker
                    v-model:value="instanceFormData.dayjsEndTime"
                    size="large"
                    show-time
                    style="width: 100%"
                    :placeholder="t('TXT_CODE_e3a77a77')"
                    :disabled="isGlobalTerminal"
                  />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :offset="0">
                <a-form-item name="startCommand">
                  <a-typography-title :level="5">
                    {{ t("TXT_CODE_d12fa808") }}
                  </a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="t('TXT_CODE_A0000001')" placement="top">
                      <a-typography-text type="secondary" class="typography-text-ellipsis">
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <span v-html="t('TXT_CODE_A0000001')"></span>
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <a-input-group compact style="display: flex">
                    <a-textarea
                      v-model:value="instanceFormData.config.startCommand"
                      :rows="5"
                      style="min-height: 40px"
                      :placeholder="isDockerMode ? t('TXT_CODE_98e7c829') : t('TXT_CODE_f50cfe2')"
                    />
                  </a-input-group>
                </a-form-item>
              </a-col>
            </a-row>
          </a-tab-pane>
          <a-tab-pane :key="TabSettings.Advanced" :tab="t('TXT_CODE_31a1d824')">
            <a-row :gutter="20">
              <a-col :xs="24" :offset="0">
                <a-form-item name="cwd">
                  <a-typography-title :level="5" class="require-field">
                    {{ t("TXT_CODE_ee67e1a3") }}
                  </a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="t('TXT_CODE_962d9320')" placement="top">
                      <a-typography-text type="secondary" class="typography-text-ellipsis">
                        {{ t("TXT_CODE_962d9320") }}
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <a-input v-model:value="instanceFormData.config.cwd" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :offset="0">
                <a-form-item>
                  <a-typography-title :level="5">{{ t("TXT_CODE_bb0b9711") }}</a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="UPDATE_CMD_DESCRIPTION" placement="top">
                      <a-typography-text type="secondary" class="typography-text-ellipsis">
                        <span>{{ t("TXT_CODE_4f387c5a") }}</span>
                        <br />
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <span v-html="UPDATE_CMD_DESCRIPTION"> </span>
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <!-- eslint-disable-next-line vue/html-quotes -->
                  <a-input
                    v-model:value="instanceFormData.config.updateCommand"
                    :placeholder="UPDATE_CMD_TEMPLATE"
                    :disabled="isGlobalTerminal"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :lg="6" :offset="0">
                <a-form-item>
                  <a-typography-title :level="5" class="require-field">
                    {{ t("TXT_CODE_f041de90") }}
                  </a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="t('TXT_CODE_6e69b5a5')" placement="top">
                      <a-typography-text
                        type="secondary"
                        :class="[!isPhone && 'two-line-height', 'typography-text-ellipsis']"
                      >
                        {{ t("TXT_CODE_6e69b5a5") }}
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <a-select
                    v-model:value="instanceFormData.config.fileCode"
                    :placeholder="t('TXT_CODE_3bb646e4')"
                  >
                    <a-select-option v-for="item in TERMINAL_CODE" :key="item" :value="item">
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :lg="16" :offset="0">
                <a-form-item>
                  <a-typography-title :level="5">{{ t("TXT_CODE_fffaeb17") }}</a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip
                      :title="t('TXT_CODE_fffaeb18') + '\n' + t('TXT_CODE_50a2b2d9')"
                      placement="top"
                    >
                      <a-typography-text
                        type="secondary"
                        :class="[!isPhone && 'two-line-height', 'typography-text-ellipsis']"
                      >
                        <span>{{ t("TXT_CODE_fffaeb18") }}</span>
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <a-input
                    v-model:value="instanceFormData.config.runAs"
                    :placeholder="t('TXT_CODE_9aa83c05')"
                    :disabled="isGlobalTerminal"
                    style="width: 400px"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-tab-pane>
          <a-tab-pane
            v-if="!isGlobalTerminal"
            :key="TabSettings.Docker"
            :tab="t('TXT_CODE_afb12200')"
          >
            <a-row :gutter="20">
              <a-col :xs="24" :lg="8" :offset="0">
                <a-form-item>
                  <a-typography-title :level="5">
                    {{ t("TXT_CODE_61a8296e") }}
                  </a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="t('TXT_CODE_2b221e02')" placement="top">
                      <a-typography-text
                        type="secondary"
                        :class="[!isPhone && 'two-line-height', 'typography-text-ellipsis']"
                      >
                        {{ t("TXT_CODE_2b221e02") }}
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <div class="ml-4">
                    <a-switch
                      v-model:checked="instanceFormData.config.processType"
                      :disabled="isGlobalTerminal"
                      checked-value="docker"
                      un-checked-value="general"
                    >
                      <template #checkedChildren><check-outlined /></template>
                      <template #unCheckedChildren><close-outlined /></template>
                    </a-switch>
                  </div>
                </a-form-item>
              </a-col>
              <template v-if="isDockerMode">
                <a-col
                  v-if="instanceFormData.imageSelectMethod === 'SELECT'"
                  :xs="24"
                  :lg="16"
                  :offset="0"
                >
                  <a-form-item :name="['docker', 'image']">
                    <a-typography-title :level="5" :class="{ 'require-field': isDockerMode }">
                      {{ t("TXT_CODE_6904cb3") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-tooltip :title="t('TXT_CODE_ec734b5c')" placement="top">
                        <a-typography-text
                          type="secondary"
                          :class="[!isPhone && 'two-line-height', 'typography-text-ellipsis']"
                        >
                          {{ t("TXT_CODE_ec734b5c") }}
                        </a-typography-text>
                      </a-tooltip>
                    </a-typography-paragraph>
                    <a-select
                      v-model:value="instanceFormData.config.docker.image"
                      size="large"
                      style="width: 100%"
                      :placeholder="t('TXT_CODE_3bb646e4')"
                      @focus="loadImages"
                      @change="(e, option: DefaultOptionType) => selectImage(option)"
                    >
                      <a-select-option
                        v-for="item in dockerImages"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>

                <a-col
                  v-if="instanceFormData.imageSelectMethod === 'EDIT'"
                  :xs="24"
                  :lg="16"
                  :offset="0"
                >
                  <a-form-item :name="['docker', 'image']">
                    <a-typography-title :level="5" :class="{ 'require-field': isDockerMode }">
                      {{ t("TXT_CODE_4e4d9680") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-tooltip :title="t('TXT_CODE_4a570d32')" placement="top">
                        <a-typography-text
                          type="secondary"
                          :class="[!isPhone && 'two-line-height', 'typography-text-ellipsis']"
                        >
                          {{ t("TXT_CODE_4a570d32") }}
                        </a-typography-text>
                      </a-tooltip>
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="instanceFormData.config.docker.image"
                      :placeholder="t('TXT_CODE_d7638d7b')"
                    />
                  </a-form-item>
                </a-col>

                <a-col :xs="24" :lg="8" :offset="0">
                  <a-form-item name="changeWorkdir">
                    <a-typography-title :level="5" :class="{ 'require-field': isDockerMode }">
                      {{ t("TXT_CODE_5484094a") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-tooltip :title="t('TXT_CODE_60dd05d5')" placement="top">
                        <a-typography-text
                          type="secondary"
                          :class="[!isPhone && 'two-line-height', 'typography-text-ellipsis']"
                        >
                          {{ t("TXT_CODE_60dd05d5") }}
                        </a-typography-text>
                      </a-tooltip>
                    </a-typography-paragraph>
                    <a-switch
                      v-model:checked="instanceFormData.config.docker.changeWorkdir"
                      :disabled="isGlobalTerminal"
                      :checked-value="true"
                      :un-checked-value="false"
                    >
                      <template #checkedChildren><check-outlined /></template>
                      <template #unCheckedChildren><close-outlined /></template>
                    </a-switch>
                  </a-form-item>
                </a-col>

                <a-col :xs="24" :lg="16" :offset="0">
                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_81979d0f") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-tooltip :title="t('TXT_CODE_c800cb31')" placement="top">
                        <a-typography-text
                          type="secondary"
                          :class="[!isPhone && 'two-line-height', 'typography-text-ellipsis']"
                        >
                          {{ t("TXT_CODE_c800cb31") }}
                        </a-typography-text>
                      </a-tooltip>
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="instanceFormData.config.docker.workingDir"
                      :placeholder="t('TXT_CODE_2082f659')"
                    />
                  </a-form-item>
                </a-col>

                <a-col :xs="24" :lg="8" :offset="0">
                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_d9c73520") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-tooltip :title="t('TXT_CODE_828ea87f')" placement="top">
                        <a-typography-text type="secondary" class="typography-text-ellipsis">
                          {{ t("TXT_CODE_828ea87f") }}
                        </a-typography-text>
                      </a-tooltip>
                    </a-typography-paragraph>
                    <a-input-group compact>
                      <a-button type="default" @click="() => handleEditDockerConfig('volume')">
                        {{ t("TXT_CODE_ad207008") }}
                      </a-button>
                    </a-input-group>
                  </a-form-item>
                </a-col>

                <a-col :xs="24" :lg="8" :offset="0">
                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_cf88c936") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-tooltip :title="t('TXT_CODE_1a37f514')" placement="top">
                        <a-typography-text type="secondary" class="typography-text-ellipsis">
                          {{ t("TXT_CODE_1a37f514") }}
                        </a-typography-text>
                      </a-tooltip>
                    </a-typography-paragraph>
                    <a-input-group compact>
                      <a-button type="default" @click="() => handleEditDockerConfig('port')">
                        {{ t("TXT_CODE_ad207008") }}
                      </a-button>
                    </a-input-group>
                  </a-form-item>
                </a-col>

                <a-col :xs="24" :lg="8" :offset="0">
                  <a-form-item name="basePort">
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_15f5fb07") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-tooltip :title="t('TXT_CODE_dfd06954')" placement="top">
                        <a-typography-text type="secondary" class="typography-text-ellipsis">
                          {{ t("TXT_CODE_dfd06954") }}
                        </a-typography-text>
                      </a-tooltip>
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="instanceFormData.config.basePort"
                      :min="0"
                      :max="65535"
                      :placeholder="t('TXT_CODE_3bb646e4')"
                      :disabled="isGlobalTerminal"
                      style="width: 100%"
                    />
                  </a-form-item>
                </a-col>

                <a-col :xs="24" :lg="8" :offset="0">
                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_b916a8dc") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-tooltip :title="t('TXT_CODE_33ce1c5c')" placement="top">
                        <a-typography-text type="secondary" class="typography-text-ellipsis">
                          {{ t("TXT_CODE_33ce1c5c") }}
                        </a-typography-text>
                      </a-tooltip>
                    </a-typography-paragraph>
                    <a-input-group compact>
                      <a-button type="default" @click="() => handleEditDockerConfig('env')">
                        {{ t("TXT_CODE_ad207008") }}
                      </a-button>
                    </a-input-group>
                  </a-form-item>
                </a-col>

                <a-col :xs="24" :lg="8" :offset="0">
                  <a-form-item :name="['docker', 'networkMode']">
                    <a-typography-title :level="5" :class="{ 'require-field': isDockerMode }">
                      {{ t("TXT_CODE_efcef926") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-tooltip :title="t('TXT_CODE_38a430d8')" placement="top">
                        <a-typography-text type="secondary" class="typography-text-ellipsis">
                          {{ t("TXT_CODE_38a430d8") }}
                        </a-typography-text>
                      </a-tooltip>
                    </a-typography-paragraph>
                    <a-select
                      v-model:value="instanceFormData.config.docker.networkMode"
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
                      <a-tooltip :title="t('TXT_CODE_97655c5d')" placement="top">
                        <a-typography-text type="secondary" class="typography-text-ellipsis">
                          {{ t("TXT_CODE_97655c5d") }}
                        </a-typography-text>
                      </a-tooltip>
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="instanceFormData.networkAliasesText"
                      :placeholder="t('TXT_CODE_8d4882b0')"
                    />
                  </a-form-item>
                </a-col>

                <a-col :xs="24" :lg="8" :offset="0">
                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_c3a3b6b1") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-tooltip :title="t('TXT_CODE_d1c78fbf')" placement="top">
                        <a-typography-text type="secondary" class="typography-text-ellipsis">
                          {{ t("TXT_CODE_d1c78fbf") }}
                        </a-typography-text>
                      </a-tooltip>
                    </a-typography-paragraph>
                    <a-tooltip placement="bottom">
                      <template #title>{{ t("TXT_CODE_8d4882b0") }}</template>
                      <a-input
                        v-model:value="instanceFormData.config.docker.containerName"
                        :placeholder="t('TXT_CODE_f6047384')"
                      />
                    </a-tooltip>
                  </a-form-item>
                </a-col>
              </template>
            </a-row>
          </a-tab-pane>
          <a-tab-pane
            v-if="!isGlobalTerminal"
            :key="TabSettings.ResLimit"
            :tab="t('TXT_CODE_604d8d63')"
          >
            <a-row :gutter="20">
              <a-col :xs="24" :lg="8" :offset="0">
                <a-form-item>
                  <a-typography-title :level="5">{{ t("TXT_CODE_53046822") }}</a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="t('TXT_CODE_750ab5c6')" placement="top">
                      <a-typography-text type="secondary" class="typography-text-ellipsis">
                        {{ t("TXT_CODE_750ab5c6") }}
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <a-tooltip placement="bottom">
                    <template #title>
                      {{ t("TXT_CODE_dce87e42") }}
                    </template>
                    <a-input
                      v-model:value="instanceFormData.config.docker.cpuUsage"
                      :allow-clear="true"
                      :placeholder="t('TXT_CODE_91d857f5')"
                    />
                  </a-tooltip>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :lg="8" :offset="0">
                <a-form-item>
                  <a-typography-title :level="5">{{ t("TXT_CODE_b0c4e4ae") }}</a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="t('TXT_CODE_2b9e9b5')" placement="top">
                      <a-typography-text type="secondary" class="typography-text-ellipsis">
                        {{ t("TXT_CODE_2b9e9b5") }}
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <a-tooltip placement="bottom">
                    <template #title>
                      {{ t("TXT_CODE_67c765be") }}
                    </template>
                    <a-input
                      v-model:value="instanceFormData.config.docker.cpusetCpus"
                      :allow-clear="true"
                      :placeholder="t('TXT_CODE_30fe1717')"
                    />
                  </a-tooltip>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :lg="8" :offset="0">
                <a-form-item>
                  <a-typography-title :level="5">{{ t("TXT_CODE_6fe24924") }}</a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="t('TXT_CODE_a0d214ac')" placement="top">
                      <a-typography-text type="secondary" class="typography-text-ellipsis">
                        {{ t("TXT_CODE_a0d214ac") }}
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <a-input
                    v-model:value="instanceFormData.config.docker.memory"
                    :allow-clear="true"
                    :placeholder="t('TXT_CODE_80790069')"
                  />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :lg="8" :offset="0">
                <a-form-item>
                  <a-typography-title :level="5">{{ t("TXT_CODE_a68b3a9c") }}</a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="t('TXT_CODE_b946a322')" placement="top">
                      <a-typography-text type="secondary" class="typography-text-ellipsis">
                        {{ t("TXT_CODE_b946a322") }}
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <a-input
                    v-model:value="instanceFormData.config.docker.memorySwap"
                    :allow-clear="true"
                    :placeholder="t('TXT_CODE_6f1129fb')"
                  />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :lg="8" :offset="0">
                <a-form-item>
                  <a-typography-title :level="5">{{ t("TXT_CODE_5c43374f") }}</a-typography-title>
                  <a-typography-paragraph>
                    <a-tooltip :title="t('TXT_CODE_a7885cbc')" placement="top">
                      <a-typography-text type="secondary" class="typography-text-ellipsis">
                        {{ t("TXT_CODE_a7885cbc") }}
                      </a-typography-text>
                    </a-tooltip>
                  </a-typography-paragraph>
                  <a-input
                    v-model:value="instanceFormData.config.docker.memorySwappiness"
                    :allow-clear="true"
                    :placeholder="t('TXT_CODE_6f1129fb')"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-tab-pane>
        </a-tabs>
      </a-form>
    </div>
  </a-modal>
</template>

<style scoped>
.typography-text-ellipsis {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
