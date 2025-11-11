<script setup lang="ts">
import {
  useDockerEnvEditDialog,
  usePortEditDialog,
  useUploadFileDialog,
  useVolumeEditDialog
} from "@/components/fc";
import { INSTANCE_TYPE_TRANSLATION } from "@/hooks/useInstance";
import { SEARCH_ALL_KEY, useMarketPackages } from "@/hooks/useMarketPackages";
import { isCN, t } from "@/lang/i18n";
import { dockerPortsArray } from "@/tools/common";
import { reportErrorMsg } from "@/tools/validator";
import type { QuickStartPackages } from "@/types";
import { TERMINAL_CODE } from "@/types/const";
import { PlusOutlined } from "@ant-design/icons-vue";
import { message, type FormInstance } from "ant-design-vue";
import type { Rule } from "ant-design-vue/es/form";
import _ from "lodash";
import { computed, defineComponent, ref } from "vue";

interface FilterOption {
  label: string;
  value: string;
}

const props = defineProps<{
    gL: FilterOption[];
    pL: FilterOption[];
    cL: FilterOption[];
  }>(),
  status = ref(false),
  title = ref(""),
  loading = ref(false),
  editMode = ref<boolean>(true),
  activeKey = ref("1"),
  { languageOptions } = useMarketPackages(),
  defaultFormData: QuickStartPackages = {
    language: "",
    description: "",
    title: "",
    category: "",
    runtime: "",
    size: "",
    hardware: "",
    remark: "",
    targetLink: "",
    author: "",
    setupInfo: {
      startCommand: "",
      stopCommand: "",
      ie: "UTF-8",
      oe: "UTF-8",
      type: undefined,
      tag: [],
      fileCode: "UTF-8",
      processType: "",
      updateCommand: "",
      docker: {
        image: "",
        ports: [],
        extraVolumes: [],
        workingDir: "",
        env: [],
        changeWorkdir: false
      }
    },
    gameType: "",
    image: "",
    platform: "",
    tags: [],
    isSummary: false
  },
  formRef = ref<FormInstance>(),
  formData = ref<QuickStartPackages>(),
  isDockerMode = computed(() => formData.value?.setupInfo?.processType === "docker"),
  formRules = computed<Partial<Record<keyof QuickStartPackages, any>>>(() => ({
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
      startCommand: [
        {
          required: false,
          validator: async (_rule: Rule, value: string) => {
            if (value.includes("\n")) throw new Error(t("TXT_CODE_bbbda29"));
          },
          trigger: "change"
        }
      ],
      stopCommand: [
        {
          required: true,
          validator: async (_rule: Rule, value: string) => {
            if (value === "") throw new Error(t("TXT_CODE_cc732bf6"));
            if (value.includes("\n")) throw new Error(t("TXT_CODE_ffeacc21"));
          },
          trigger: "change"
        }
      ],
      updateCommand: [
        {
          required: false,
          validator: async (_rule: Rule, value: string) => {
            if (value.includes("\n")) throw new Error(t("TXT_CODE_e9ac4f57"));
          },
          trigger: "change"
        }
      ],
      ie: [{ required: true, message: t("TXT_CODE_e86e91a2") }],
      oe: [{ required: true, message: t("TXT_CODE_3bdd7af8") }],
      fileCode: [{ required: true, message: t("TXT_CODE_c24fdee3") }],
      type: [{ required: true, message: t("TXT_CODE_9f4eaa41") }],

      docker: {
        image: [{ required: isDockerMode.value, message: t("TXT_CODE_9fed23ab") }],
        ports: [{ required: isDockerMode.value, message: t("TXT_CODE_cd5df11b") }]
      }
    }
  })),
  index = ref(-1),
  VNodes = defineComponent({
    props: {
      vnodes: {
        type: Object,
        required: true
      }
    },
    render() {
      return this.vnodes;
    }
  }),
  selectOptions = ref({
    appGameTypeList: props.gL,
    appPlatformList: props.pL,
    appCategoryList: props.cL
  }),
  searchFormData = ref<{
    appGameTypeList: string;
    appPlatformList: string;
    appCategoryList: string;
  }>({
    appGameTypeList: "",
    appPlatformList: "",
    appCategoryList: ""
  }),
  // TODO：删除无用的项
  addOption = (item: string, category: keyof typeof selectOptions.value) => {
    selectOptions.value[category].push({
      label: item,
      value: item
    });
    searchFormData.value[category] = "";
  },
  emits = defineEmits(["ok"]),
  open = (item?: QuickStartPackages, i?: number) => {
    selectOptions.value.appGameTypeList = props.gL;
    selectOptions.value.appPlatformList = props.pL;
    selectOptions.value.appCategoryList = props.cL;
    if (item) {
      formData.value = _.cloneDeep(item);
      if (!formData.value.setupInfo?.docker)
        formData.value.setupInfo!.docker = _.cloneDeep(defaultFormData.setupInfo!.docker);
      editMode.value = true;
    } else {
      formData.value = _.cloneDeep(defaultFormData);
      formData.value.language = isCN() ? "zh_cn" : "en_us";
      editMode.value = false;
    }
    title.value = editMode.value ? t("TXT_CODE_921206fc") : t("TXT_CODE_3d45d8d");
    index.value = i ?? -1;
    status.value = true;
  },
  cancel = () => {
    status.value = false;
    formRef.value?.resetFields();
    formData.value = {} as QuickStartPackages;
  },
  ok = async () => {
    try {
      loading.value = true;
      await formRef.value?.validate();

      message.success(editMode.value ? t("TXT_CODE_a7907771") : t("TXT_CODE_d28c05df"));
      emits("ok", _.cloneDeep(formData.value), index.value);
      cancel();
    } catch (err) {
      reportErrorMsg(err);
    } finally {
      loading.value = false;
    }
  },
  handleEditDockerConfig = async (type: "port" | "volume" | "env") => {
    if (type === "port" && formData.value?.setupInfo) {
      const portArray = dockerPortsArray(formData.value?.setupInfo?.docker?.ports || []);
      const result = await usePortEditDialog(portArray);
      const portsArray = result.map((v) => `${v.host}:${v.container}/${v.protocol}`);
      formData.value.setupInfo.docker!.ports = portsArray;
    }

    if (type === "volume" && formData.value?.setupInfo) {
      const volumes = formData.value.setupInfo.docker?.extraVolumes?.map((v: any) => {
        const tmp = v.split("|");
        return {
          host: tmp[0] || "",
          container: tmp[1] || ""
        };
      });
      const result = await useVolumeEditDialog(volumes);
      const volumesArray = result.map((v) => `${v.host}|${v.container}`);
      formData.value.setupInfo.docker!.extraVolumes = volumesArray;
    }

    if (type === "env" && formData.value?.setupInfo) {
      const envs = formData.value.setupInfo.docker?.env?.map((v: any) => {
        const tmp = v.split("=");
        return {
          label: tmp[0] || "",
          value: tmp[1] || ""
        };
      });
      const result = await useDockerEnvEditDialog(envs);
      const envsArray = result.map((v) => `${v.label}=${v.value}`);
      formData.value.setupInfo.docker!.env = envsArray;
    }
  },
  uploadImg = async () => {
    const url = await useUploadFileDialog();
    if (url && formData.value) {
      formData.value.image = url;
    }
  };

defineExpose({
  open
});
</script>

<template>
  <a-modal
    v-model:open="status"
    centered
    style="min-width: 50svw"
    :title="title"
    :mask-closable="false"
    @ok="ok"
    @cancel="cancel"
  >
    <a-form v-if="formData" ref="formRef" :model="formData" :rules="formRules" layout="vertical">
      <a-tabs v-model:activeKey="activeKey">
        <a-tab-pane key="1" :tab="t('TXT_CODE_d9c63fdd')">
          <a-row :gutter="20">
            <a-col :span="24" :sm="24" :md="12">
              <a-form-item :label="t('TXT_CODE_80c5409f')" name="image">
                <a-image
                  fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1700' height='800' viewBox='0 0 170 80'%3E%3Crect width='1700' height='800' fill='%230044ff' fill-opacity='0.1'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23ffffff80'%3EEmpty%3C/text%3E%3C/svg%3E"
                  class="cursor-pointer"
                  style="border-radius: 8px"
                  :src="formData.image"
                  :placeholder="false"
                  :preview="false"
                  @click="uploadImg"
                />
                <a-input
                  v-model:value="formData.image"
                  class="mt-10"
                  :placeholder="t('TXT_CODE_99a42341')"
                />
              </a-form-item>
            </a-col>
            <a-col :span="24" :sm="24" :md="12">
              <a-form-item :label="t('TXT_CODE_f4fba0cd')" name="title">
                <a-input v-model:value="formData.title" :placeholder="t('TXT_CODE_6b5509c7')" />
              </a-form-item>

              <a-form-item :label="t('TXT_CODE_59cdbec3')" name="description">
                <a-textarea
                  v-model:value="formData.description"
                  :placeholder="t('TXT_CODE_98dbd049')"
                  allow-clear
                  size="large"
                  :auto-size="{ minRows: 1 }"
                />
              </a-form-item>

              <a-row :gutter="20">
                <a-col :span="24" :lg="12">
                  <a-form-item :label="t('TXT_CODE_2a34c50a')" name="language">
                    <a-select
                      v-model:value="formData.language"
                      :placeholder="t('TXT_CODE_60752a40')"
                      :options="languageOptions"
                    >
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="24" :lg="12">
                  <a-form-item :label="t('TXT_CODE_3d56da34')" name="author">
                    <a-input
                      v-model:value="formData.author"
                      :placeholder="t('TXT_CODE_e6adf32d')"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-col>
          </a-row>

          <a-row :gutter="20">
            <a-col :span="12" :lg="6">
              <a-form-item :label="t('TXT_CODE_c5ace40b')" :name="['setupInfo', 'type']">
                <a-select
                  v-if="formData.setupInfo"
                  v-model:value="formData.setupInfo.type"
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
            <a-col :span="12" :lg="6">
              <a-form-item :label="t('TXT_CODE_ebfb4831')" name="gameType">
                <a-select
                  v-model:value="formData.gameType"
                  show-search
                  :placeholder="t('TXT_CODE_3bb646e4')"
                  :options="
                    selectOptions.appGameTypeList.filter((item) => item.value !== SEARCH_ALL_KEY)
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
            <a-col :span="12" :lg="6">
              <a-form-item :label="t('TXT_CODE_1ce1d1d1')" name="platform">
                <a-select
                  v-model:value="formData.platform"
                  show-search
                  :placeholder="t('TXT_CODE_3bb646e4')"
                  :options="
                    selectOptions.appPlatformList.filter((item) => item.value !== SEARCH_ALL_KEY)
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
            <a-col :span="12" :lg="6">
              <a-form-item :label="t('TXT_CODE_2d8a400')" name="category">
                <a-select
                  v-model:value="formData.category"
                  show-search
                  :placeholder="t('TXT_CODE_3bb646e4')"
                  :options="
                    selectOptions.appCategoryList.filter((item) => item.value !== SEARCH_ALL_KEY)
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
            <a-col :span="8">
              <a-form-item :label="t('TXT_CODE_80c85070')" name="runtime">
                <a-input v-model:value="formData.runtime" :placeholder="t('TXT_CODE_772bb48a')" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item :label="t('TXT_CODE_683e3033')" name="hardware">
                <a-input v-model:value="formData.hardware" :placeholder="t('TXT_CODE_d79ff710')" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item :label="t('TXT_CODE_8dbcf565')" name="size">
                <a-input v-model:value="formData.size" :placeholder="t('TXT_CODE_d0d08d6')" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item :label="t('TXT_CODE_13eac7e1')" name="targetLink">
            <a-input v-model:value="formData.targetLink" :placeholder="t('TXT_CODE_8d83752')" />
          </a-form-item>

          <a-form-item :label="t('TXT_CODE_9901af98')" name="tags">
            <a-select
              v-model:value="formData.tags"
              mode="tags"
              :placeholder="t('TXT_CODE_7d839745')"
              :token-separators="[',']"
            ></a-select>
          </a-form-item>
        </a-tab-pane>
        <a-tab-pane v-if="formData.setupInfo" key="2" :tab="t('TXT_CODE_ef5f0c4c')" force-render>
          <a-form-item :label="t('TXT_CODE_7fa8720d')" :name="['setupInfo', 'startCommand']">
            <a-textarea
              v-model:value="formData.setupInfo.startCommand"
              allow-clear
              size="large"
              :auto-size="{ minRows: 1 }"
              :placeholder="t('TXT_CODE_f1cae9fa')"
            />
          </a-form-item>
          <a-row :gutter="20">
            <a-col :span="12">
              <a-form-item :label="t('TXT_CODE_53dd82fc')" :name="['setupInfo', 'stopCommand']">
                <a-textarea
                  v-model:value="formData.setupInfo.stopCommand"
                  allow-clear
                  size="large"
                  :auto-size="{ minRows: 1 }"
                  :placeholder="t('TXT_CODE_6c0478ab')"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item :label="t('TXT_CODE_61834192')" :name="['setupInfo', 'updateCommand']">
                <a-textarea
                  v-model:value="formData.setupInfo.updateCommand"
                  allow-clear
                  size="large"
                  :auto-size="{ minRows: 1 }"
                  :placeholder="t('TXT_CODE_57674047')"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="20">
            <a-col :span="8">
              <a-form-item :label="t('TXT_CODE_5ce5085c')" :name="['setupInfo', 'ie']">
                <a-select
                  v-model:value="formData.setupInfo.ie"
                  :placeholder="t('TXT_CODE_3bb646e4')"
                >
                  <a-select-option v-for="item in TERMINAL_CODE" :key="item" :value="item">
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item :label="t('TXT_CODE_2efcbf1e')" :name="['setupInfo', 'oe']">
                <a-select
                  v-model:value="formData.setupInfo.oe"
                  :placeholder="t('TXT_CODE_3bb646e4')"
                >
                  <a-select-option v-for="item in TERMINAL_CODE" :key="item" :value="item">
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item :label="t('TXT_CODE_6f161560')" :name="['setupInfo', 'fileCode']">
                <a-select
                  v-model:value="formData.setupInfo.fileCode"
                  :placeholder="t('TXT_CODE_3bb646e4')"
                >
                  <a-select-option v-for="item in TERMINAL_CODE" :key="item" :value="item">
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item :label="t('TXT_CODE_45e8f121')" :name="['setupInfo', 'tag']">
            <a-select
              v-model:value="formData.setupInfo.tag"
              mode="tags"
              :placeholder="t('TXT_CODE_7d839745')"
              :token-separators="[',']"
            ></a-select>
          </a-form-item>
        </a-tab-pane>
        <a-tab-pane
          v-if="formData.setupInfo?.docker"
          key="3"
          :tab="t('TXT_CODE_645da993')"
          force-render
        >
          <a-row :gutter="20">
            <a-col :span="12" :sm="10" :md="8" :lg="6">
              <a-form-item :label="t('TXT_CODE_61a8296e')" :name="['setupInfo', 'processType']">
                <a-switch
                  v-model:checked="formData.setupInfo.processType"
                  checked-value="docker"
                  un-checked-value="undefined"
                >
                </a-switch>
              </a-form-item>
            </a-col>
            <a-col :span="12" :sm="14" :md="16" :lg="18">
              <a-form-item :label="t('TXT_CODE_438aa1')" :name="['setupInfo', 'docker', 'image']">
                <a-input
                  v-model:value="formData.setupInfo.docker.image"
                  :disabled="!isDockerMode"
                  :placeholder="t('TXT_CODE_ef79a2ff')"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="20">
            <a-col :span="12" :sm="10" :md="8" :lg="6">
              <a-form-item
                :label="t('TXT_CODE_6a06a9ef')"
                :name="['setupInfo', 'docker', 'changeWorkdir']"
              >
                <a-switch
                  v-model:checked="formData.setupInfo.docker.changeWorkdir"
                  :disabled="!isDockerMode"
                ></a-switch>
              </a-form-item>
            </a-col>
            <a-col :span="12" :sm="14" :md="16" :lg="18">
              <a-form-item
                :label="t('TXT_CODE_b1446a00')"
                :name="['setupInfo', 'docker', 'workingDir']"
              >
                <a-input
                  v-model:value="formData.setupInfo.docker.workingDir"
                  placeholder="eg: /workspace"
                  :disabled="!isDockerMode"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="20">
            <a-col :span="12" :lg="8">
              <a-form-item :label="t('TXT_CODE_8c17acf8')" :name="['setupInfo', 'docker', 'ports']">
                <a-input-group compact style="display: flex">
                  <a-input
                    v-model:value="formData.setupInfo.docker.ports"
                    :disabled="!isDockerMode"
                    placeholder="eg: {mcsm_port1}:25565/udp"
                    readonly
                  />
                  <a-button
                    class="compact-btn-right"
                    type="primary"
                    size="large"
                    :disabled="!isDockerMode"
                    @click="handleEditDockerConfig('port')"
                  >
                    {{ t("TXT_CODE_ad207008") }}
                  </a-button>
                </a-input-group>
              </a-form-item>
            </a-col>
            <a-col :span="12" :lg="8">
              <a-form-item :label="t('TXT_CODE_18e7e5df')" :name="['setupInfo', 'docker', 'env']">
                <a-input-group compact style="display: flex">
                  <a-input
                    v-model:value="formData.setupInfo.docker.env"
                    :disabled="!isDockerMode"
                    readonly
                    placeholder="eg: PWD=123456"
                  />
                  <a-button
                    class="compact-btn-right"
                    type="primary"
                    size="large"
                    :disabled="!isDockerMode"
                    @click="handleEditDockerConfig('env')"
                  >
                    {{ t("TXT_CODE_ad207008") }}
                  </a-button>
                </a-input-group>
              </a-form-item>
            </a-col>
            <a-col :span="24" :lg="8">
              <a-form-item
                :label="t('TXT_CODE_55015f30')"
                :name="['setupInfo', 'docker', 'extraVolumes']"
              >
                <a-input-group compact style="display: flex">
                  <a-input
                    v-model:value="formData.setupInfo.docker.extraVolumes"
                    :disabled="!isDockerMode"
                    readonly
                    placeholder="eg: /host/path:/container/path"
                  />
                  <a-button
                    class="compact-btn-right"
                    type="primary"
                    size="large"
                    :disabled="!isDockerMode"
                    @click="handleEditDockerConfig('volume')"
                  >
                    {{ t("TXT_CODE_ad207008") }}
                  </a-button>
                </a-input-group>
              </a-form-item>
            </a-col>
          </a-row>
        </a-tab-pane>
      </a-tabs>
    </a-form>
  </a-modal>
</template>
