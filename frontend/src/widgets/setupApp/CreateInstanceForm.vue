<script setup lang="ts">
import { ref, reactive, createVNode } from "vue";
import { t } from "@/lang/i18n";
import { QUICKSTART_ACTION_TYPE, QUICKSTART_METHOD } from "@/hooks/widgets/quickStartFlow";
import type { FormInstance } from "ant-design-vue";
import type { Rule } from "ant-design-vue/es/form";
import type { NewInstanceForm } from "@/types";
import { UploadOutlined, InfoCircleOutlined } from "@ant-design/icons-vue";
import { message, Modal, type UploadProps } from "ant-design-vue";
import {
  TYPE_MINECRAFT_JAVA,
  TYPE_MINECRAFT_BEDROCK,
  TYPE_STEAM_SERVER_UNIVERSAL,
  TYPE_UNIVERSAL,
  TYPE_TERRARIA
} from "@/hooks/useInstance";
import SelectUnzipCode from "../instance/dialogs/SelectUnzipCode.vue";
import {
  uploadAddress,
  uploadInstanceFile,
  createInstance as createInstanceApi
} from "@/services/apis/instance";
import { parseForwardAddress } from "@/tools/protocol";
import { useCmdAssistantDialog } from "@/components/fc";
import { reportErrorMsg } from "@/tools/validator";

// eslint-disable-next-line no-unused-vars
enum UNZIP {
  ON = 1,
  OFF = 0
}

const selectUnzipCodeDialog = ref<InstanceType<typeof SelectUnzipCode>>();
const emit = defineEmits(["nextStep"]);

const props = defineProps<{
  appType: QUICKSTART_ACTION_TYPE;
  createMethod: QUICKSTART_METHOD;
  daemonId: string;
}>();

const zipCode = ref("utf-8");
const formRef = ref<FormInstance>();
const formData = reactive<NewInstanceForm>({
  nickname: "",
  startCommand: "",
  stopCommand: "^c",
  cwd: "",
  ie: "utf-8",
  oe: "utf-8",
  processType: "general",
  createDatetime: new Date().toDateString(),
  lastDatetime: "",
  type: TYPE_UNIVERSAL,
  tag: [],
  maxSpace: null,
  endTime: "",
  docker: {
    containerName: "",
    image: "",
    ports: [],
    extraVolumes: [],
    networkMode: "bridge",
    networkAliases: [],
    cpusetCpus: "",
    workingDir: "/workspace/",
    memory: undefined,
    cpuUsage: undefined,
    maxSpace: undefined,
    io: undefined,
    network: undefined,
    env: []
  }
});

const isImportMode = props.createMethod === QUICKSTART_METHOD.IMPORT;
const isFileMode = props.createMethod === QUICKSTART_METHOD.FILE;
const needUpload = isImportMode || isFileMode;

if (props.appType === QUICKSTART_ACTION_TYPE.Minecraft) {
  formData.startCommand = isFileMode ? "java -jar ${ProgramName}" : "";
  formData.stopCommand = "stop";
  formData.type = TYPE_MINECRAFT_JAVA;
}

if (props.appType === QUICKSTART_ACTION_TYPE.Bedrock) {
  formData.startCommand = isFileMode ? "${ProgramName}" : "";
  formData.stopCommand = "stop";
  formData.type = TYPE_MINECRAFT_BEDROCK;
}

if (props.appType === QUICKSTART_ACTION_TYPE.Terraria) {
  formData.startCommand = isFileMode ? "${ProgramName}" : "";
  formData.stopCommand = "stop";
  formData.type = TYPE_TERRARIA;
}

if (props.appType === QUICKSTART_ACTION_TYPE.SteamGameServer) {
  formData.startCommand = isFileMode ? "${ProgramName}" : "";
  formData.type = TYPE_STEAM_SERVER_UNIVERSAL;
}

const rules: Record<string, Rule[]> = {
  nickname: [{ required: true, message: t("TXT_CODE_68a504b3") }]
};

const openCmdAssistDialog = async () => {
  const cmd = await useCmdAssistantDialog();
  if (cmd) formData.startCommand = cmd;
};

const uFile = ref<File>();

const beforeUpload: UploadProps["beforeUpload"] = async (file) => {
  uFile.value = file;

  if (isImportMode) {
    const extName = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["zip", "jar"].includes(extName)) return reportErrorMsg(t("TXT_CODE_808e5ad9"));
    selectUnzipCodeDialog.value?.openDialog();
  } else {
    finalConfirm();
  }

  return false;
};

const setUnzipCode = async (code: string) => {
  zipCode.value = code;
  finalConfirm();
};

const finalConfirm = async () => {
  const thisModal = Modal.confirm({
    title: t("TXT_CODE_2a3b0c17"),
    icon: createVNode(InfoCircleOutlined),
    content: needUpload ? t("TXT_CODE_e06841b5") : t("TXT_CODE_5deeefb5"),
    okText: t("TXT_CODE_d507abff"),
    async onOk() {
      thisModal.destroy();
      try {
        await formRef.value?.validateFields();
        needUpload ? await selectedFile() : await createInstance();
      } catch {
        return reportErrorMsg(t("TXT_CODE_47e21c80"));
      }
    },
    onCancel() {}
  });
};

const { state: cfg, execute: getCfg } = uploadAddress();
const { execute: uploadFile } = uploadInstanceFile();
const percentComplete = ref(0);
const selectedFile = async () => {
  try {
    if (!formData.cwd) formData.cwd = ".";
    if (formData.docker.image) formData.processType = "docker";
    if (isFileMode)
      formData.startCommand = formData.startCommand.replace("${ProgramName}", uFile.value!.name);
    await getCfg({
      params: {
        upload_dir: ".",
        daemonId: props.daemonId
      },
      data: formData
    });
    if (!cfg.value) throw new Error(t("TXT_CODE_e8ce38c2"));

    const uploadFormData = new FormData();
    uploadFormData.append("file", uFile.value as any);

    await uploadFile({
      params: {
        unzip: isImportMode ? UNZIP.ON : UNZIP.OFF,
        code: zipCode.value
      },
      timeout: Number.MAX_VALUE,
      data: uploadFormData,
      url: `${parseForwardAddress(cfg.value.addr, "http")}/upload/${cfg.value.password}`,
      onUploadProgress: (progressEvent: any) => {
        percentComplete.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      }
    });
    emit("nextStep", cfg.value.instanceUuid);
    return message.success(t("TXT_CODE_d28c05df"));
  } catch (err: any) {
    console.error(err);
    return reportErrorMsg(err.message);
  }
};

const {
  state: newInstanceInfo,
  execute: executeCreateInstance,
  isLoading: createInstanceLoading
} = createInstanceApi();
const createInstance = async () => {
  try {
    if (!formData.cwd) formData.cwd = ".";
    if (formData.docker.image) formData.processType = "docker";
    await executeCreateInstance({
      params: {
        daemonId: props.daemonId
      },
      data: formData
    });
    if (newInstanceInfo.value) emit("nextStep", newInstanceInfo.value.instanceUuid);
    return message.success(t("TXT_CODE_d28c05df"));
  } catch (err: any) {
    return reportErrorMsg(err.message);
  }
};
</script>

<template>
  <div style="text-align: left">
    <a-typography-paragraph v-if="createMethod === QUICKSTART_METHOD.DOCKER" :level="5">
      <InfoCircleOutlined />
      {{ t("TXT_CODE_b51bac6f") }}
    </a-typography-paragraph>
    <a-form ref="formRef" :rules="rules" :model="formData" layout="vertical" autocomplete="off">
      <a-form-item name="nickname">
        <a-typography-title :level="5" class="require-field">
          {{ t("TXT_CODE_f70badb9") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_818928ba") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="formData.nickname" :placeholder="t('TXT_CODE_475c5890')" />
      </a-form-item>

      <a-form-item v-if="createMethod === QUICKSTART_METHOD.DOCKER">
        <a-typography-title :level="5" class="require-field">
          {{ t("TXT_CODE_de3ced4b") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            <span>
              {{ t("TXT_CODE_c7a43089") }}
            </span>
            <br />
            <span>{{ t("TXT_CODE_8fd7a9a1") }}</span>
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="formData.docker.image" :placeholder="t('TXT_CODE_95c5e900')" />
      </a-form-item>

      <a-form-item v-if="createMethod === QUICKSTART_METHOD.DOCKER">
        <a-typography-title :level="5">
          {{ t("TXT_CODE_fdec1b6f") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_3c37583b") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="formData.docker.workingDir" :placeholder="t('TXT_CODE_2082f653')" />
      </a-form-item>

      <a-form-item name="startCommand">
        <a-typography-title :level="5">
          {{ t("TXT_CODE_d12fa808") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            <span v-if="createMethod === QUICKSTART_METHOD.IMPORT">
              {{ t("TXT_CODE_17544b7b") }}
            </span>
            <span v-else-if="createMethod === QUICKSTART_METHOD.DOCKER">
              {{ t("TXT_CODE_26495d02") }}
            </span>
            <span v-else>
              {{ t("TXT_CODE_8c0db3f4") }}
            </span>
          </a-typography-text>
        </a-typography-paragraph>
        <a-input-group compact style="display: flex">
          <a-textarea
            v-model:value="formData.startCommand"
            :rows="3"
            :placeholder="t('TXT_CODE_619d74d3')"
            style="min-height: 40px"
          />
          <a-button
            type="default"
            style="height: auto; border-top-left-radius: 0; border-bottom-left-radius: 0"
            @click="openCmdAssistDialog"
          >
            {{ t("TXT_CODE_2728d0d4") }}
          </a-button>
        </a-input-group>
      </a-form-item>

      <a-form-item v-if="createMethod !== QUICKSTART_METHOD.EXIST" name="cwd">
        <a-typography-title :level="5">
          {{ t("TXT_CODE_320f4304") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_877eea45") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="formData.cwd" :placeholder="t('TXT_CODE_a85091a4')" />
      </a-form-item>

      <a-form-item v-if="createMethod === QUICKSTART_METHOD.FILE">
        <a-typography-title :level="5" class="require-field">
          {{ t("TXT_CODE_444db70f") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_fc4e2173") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-upload
          accept=".jar"
          :before-upload="beforeUpload"
          :max-count="1"
          :change="selectedFile"
          :disabled="percentComplete > 0"
        >
          <a-button type="primary" :loading="percentComplete > 0">
            <upload-outlined v-if="percentComplete === 0" />
            {{
              percentComplete > 0
                ? t("TXT_CODE_b625dbf0") + percentComplete + "%"
                : t("TXT_CODE_335ba209")
            }}
          </a-button>
        </a-upload>
      </a-form-item>

      <a-form-item v-else-if="createMethod === QUICKSTART_METHOD.IMPORT">
        <a-typography-title :level="5" class="require-field">
          {{ t("TXT_CODE_f9b6e61b") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_510bd294") }}
            <br />
            {{ t("TXT_CODE_1561198c") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-upload
          accept=".zip"
          :before-upload="beforeUpload"
          :max-count="1"
          :change="selectedFile"
          :disabled="percentComplete > 0"
        >
          <a-button type="primary" :loading="percentComplete > 0">
            <upload-outlined v-if="percentComplete === 0" />
            {{
              percentComplete > 0
                ? t("TXT_CODE_b625dbf0") + percentComplete + "%"
                : t("TXT_CODE_c17f6488")
            }}
          </a-button>
        </a-upload>
      </a-form-item>

      <a-form-item v-else>
        <a-typography-paragraph class="mt-10">
          <a-typography-text>
            <span>{{ t("TXT_CODE_7da6e84") }}</span>
          </a-typography-text>
        </a-typography-paragraph>
        <a-button type="primary" :loading="createInstanceLoading" @click="finalConfirm">
          {{ t("TXT_CODE_5a74975b") }}
        </a-button>
      </a-form-item>
    </a-form>
  </div>

  <SelectUnzipCode ref="selectUnzipCodeDialog" @select-code="setUnzipCode" />
</template>

<style lang="scss" scoped>
.CardWrapper {
  min-height: 500px;
}
.btn-area {
  position: absolute;
  bottom: 16px;
  right: 16px;
}
</style>
