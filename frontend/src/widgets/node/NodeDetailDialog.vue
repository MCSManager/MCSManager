<script lang="ts" setup>
import NodeRemoteMappingEdit from "@/components/NodeRemoteMappingEdit.vue";
import type { ComputedNodeInfo } from "@/hooks/useOverviewInfo";
import { useRemoteNode } from "@/hooks/useRemoteNode";
import { t } from "@/lang/i18n";
import { isLocalNetworkIP, reportErrorMsg } from "@/tools/validator";
import { message, type FormInstance } from "ant-design-vue";
import _ from "lodash";
import { computed, reactive, ref } from "vue";

const { addNode, deleteNode, updateNode } = useRemoteNode();

const editMode = ref(false);
const formRef = ref<FormInstance>();
const activeTabKey = ref("basic");
const daemonInfo = ref<ComputedNodeInfo | null>(null);

const DEFAULT_CONFIG = {
  ip: "",
  port: 24444,
  prefix: "",
  remarks: "Unnamed Node",
  apiKey: "",
  language: "",
  uploadSpeedRate: 0,
  downloadSpeedRate: 0,
  maxDownloadFromUrlFileCount: 1,
  portRangeStart: 0,
  portRangeEnd: 0,
  portAssignInterval: 0,
  daemonPort: 24444,
  remoteMappings: [] as IPanelOverviewRemoteMappingResponse[]
};

const SPEED_RATE_OPTIONS = [
  {
    label: "无限制",
    value: 0
  },
  {
    label: "320KB/s",
    value: 5
  },
  {
    label: "640KB/s",
    value: 10
  },
  {
    label: "1MB/s",
    value: 16
  },
  {
    label: "2MB/s",
    value: 32
  },
  {
    label: "4MB/s",
    value: 64
  },
  {
    label: "6MB/s",
    value: 96
  },
  {
    label: "8MB/s",
    value: 128
  },
  {
    label: "10MB/s",
    value: 160
  },
  {
    label: "15MB/s",
    value: 240
  },
  {
    label: "20MB/s",
    value: 320
  },
  {
    label: "30MB/s",
    value: 480
  }
];

function ipNeedsMapping(ip: string) {
  return ip && ip.trim() !== "localhost" && isLocalNetworkIP(ip);
}

const openDialog = (data?: ComputedNodeInfo, uuid?: string) => {
  if (data && uuid) {
    daemonInfo.value = data;
    editMode.value = true;
    dialog.uuid = uuid;
    dialog.data = {
      ...data,
      ...data.config,
      port: data.port, // connection port
      daemonPort: data.config.port, // listen port
      apiKey: "",
      remoteMappings: data.remoteMappings ?? []
    };
  } else {
    editMode.value = false;
    dialog.data = _.cloneDeep(DEFAULT_CONFIG);
  }
  dialog.status = true;
};

const dialog = reactive({
  status: false,
  loading: false,
  title: computed(() => (editMode.value ? t("TXT_CODE_39c5229e") : t("TXT_CODE_15a381d5"))),
  uuid: "",
  data: _.cloneDeep(DEFAULT_CONFIG),

  check: async () => {
    await formRef.value?.validate();
  },
  close: () => {
    dialog.clear();
    dialog.uuid = "";
    dialog.loading = false;
    dialog.status = false;
  },
  clear: () => {
    dialog.data = _.cloneDeep(DEFAULT_CONFIG);
  },
  delete: async () => {
    try {
      await deleteNode(dialog.uuid);
      dialog.close();
      message.success(t("TXT_CODE_a00e84d7"));
    } catch (error: any) {
      message.error(error.message ?? error);
    }
  },
  submit: async () => {
    try {
      await dialog.check();
      dialog.loading = true;
      if (editMode.value) {
        await updateNode(dialog.uuid, {
          ...dialog.data,
          setting: {
            ...dialog.data
          }
        });
      } else {
        await addNode(dialog.data);
      }
      message.success(t("TXT_CODE_e74d658c"));
      dialog.close();
    } catch (error: any) {
      reportErrorMsg(error.message ?? t("TXT_CODE_5245bd11"));
    }
  },
  hidden: () => {
    dialog.status = false;
    dialog.clear();
  }
});

defineExpose({ openDialog });
</script>

<template>
  <a-modal v-model:open="dialog.status" :title="dialog.title" width="800px">
    <a-tabs v-model:activeKey="activeTabKey">
      <!-- 基本信息标签页 -->
      <a-tab-pane key="basic" :tab="t('TXT_CODE_cc7b54b9')">
        <a-form ref="formRef" :model="dialog.data" layout="vertical">
          <a-form-item :label="t('TXT_CODE_a884de59')" name="remarks" required>
            <a-input v-model:value="dialog.data.remarks" :placeholder="t('TXT_CODE_4b1d5199')" />
          </a-form-item>

          <a-form-item :label="t('TXT_CODE_93f9b02a')" name="ip" required>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_be7a689a") }}
                <br />
                {{ t("TXT_CODE_c82a51b0") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input v-model:value="dialog.data.ip" />
            <a-typography-text v-if="ipNeedsMapping(dialog.data.ip)" type="secondary">
              {{ t("TXT_CODE_93c3cb78") }}
            </a-typography-text>
          </a-form-item>

          <a-form-item :label="t('TXT_CODE_4a6bf8c6')" name="port" required>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_df455795") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input v-model:value="dialog.data.port" />
          </a-form-item>

          <a-form-item :label="t('TXT_CODE_300c2ff4')" name="apiKey" :required="!editMode">
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_5ef2cf20") }}

                <a href="https://docs.mcsmanager.com/advanced/distributed.html" target="_blank">
                  {{ t("TXT_CODE_be1351ce") }}
                </a>
              </a-typography-text>
            </a-typography-paragraph>
            <a-input
              v-model:value="dialog.data.apiKey"
              :placeholder="editMode ? t('TXT_CODE_dc570cf2') : t('TXT_CODE_fe25087f')"
            />
          </a-form-item>

          <a-form-item :label="t('TXT_CODE_693f31d6')" name="prefix">
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_3e93e31e") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input v-model:value="dialog.data.prefix" />
          </a-form-item>
        </a-form>
      </a-tab-pane>

      <!-- 高级配置标签页 -->
      <a-tab-pane v-if="daemonInfo?.available" key="advanced" :tab="t('TXT_CODE_31a1d824')">
        <a-form :model="dialog.data" layout="vertical">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item :label="t('TXT_CODE_fde31068')" name="uploadSpeedRate">
                <a-typography-paragraph>
                  <a-typography-text type="secondary">
                    {{ t("TXT_CODE_d8d19932") }}
                  </a-typography-text>
                </a-typography-paragraph>
                <a-select v-model:value="dialog.data.uploadSpeedRate" style="width: 100%">
                  <a-select-option
                    v-for="item in SPEED_RATE_OPTIONS"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item :label="t('TXT_CODE_785a0fcf')" name="downloadSpeedRate">
                <a-typography-paragraph>
                  <a-typography-text type="secondary">
                    {{ t("TXT_CODE_b9fc604c") }}
                  </a-typography-text>
                </a-typography-paragraph>
                <a-select v-model:value="dialog.data.downloadSpeedRate" style="width: 100%">
                  <a-select-option
                    v-for="item in SPEED_RATE_OPTIONS"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item :label="t('TXT_CODE_a15fca22')" name="maxDownloadFromUrlFileCount">
                <a-typography-paragraph>
                  <a-typography-text type="secondary">
                    {{ t("TXT_CODE_ecaf78a2") }}
                  </a-typography-text>
                </a-typography-paragraph>
                <a-input v-model:value="dialog.data.maxDownloadFromUrlFileCount" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item :label="t('TXT_CODE_cd1f9ef7')" name="daemonPort">
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_75ef0619") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input v-model:value="dialog.data.daemonPort" />
          </a-form-item>
          <a-form-item :label="t('TXT_CODE_bbe23ee7')" name="remoteMappings">
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_497568db") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-card>
              <NodeRemoteMappingEdit
                v-if="dialog.data.remoteMappings"
                v-model:value="dialog.data.remoteMappings"
              />
              <a-typography-text v-else type="secondary">
                {{ t("TXT_CODE_48c291c1") }}
              </a-typography-text>
            </a-card>
          </a-form-item>
        </a-form>
      </a-tab-pane>
    </a-tabs>

    <template #footer>
      <div class="justify-space-between">
        <a-popconfirm
          :title="t('TXT_CODE_fb267b0b')"
          ok-text="Yes"
          cancel-text="No"
          @confirm="dialog.delete()"
        >
          <a-button v-if="editMode" key="delete" danger>{{ t("TXT_CODE_8b937b23") }}</a-button>
        </a-popconfirm>
        <div class="right">
          <a-button key="back" @click="dialog.hidden()">{{ t("TXT_CODE_a0451c97") }}</a-button>
          <a-button key="submit" type="primary" :loading="dialog.loading" @click="dialog.submit()">
            {{ t("TXT_CODE_d507abff") }}
          </a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>
