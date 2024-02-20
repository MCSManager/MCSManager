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
    if (file.type !== "application/x-zip-compressed") return reportError(t("TXT_CODE_808e5ad9"));
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
        return reportError(t("TXT_CODE_47e21c80"));
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
    return reportError(err.message);
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
    return reportError(err.message);
  }
};
</script>

<template>
  <div style="text-align: left">
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
        <a-input v-model:value="formData.nickname" :placeholder="t('列如：我的第一个服务器')" />
      </a-form-item>

      <a-form-item v-if="createMethod === QUICKSTART_METHOD.DOCKER">
        <a-typography-title :level="5" class="require-field">
          {{ t("请填写镜像名称") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            <span>
              {{ t("实例将在运行时拉取镜像，并且使用镜像创建容器，此镜像名必须存在云端或本地") }}
            </span>
            <br />
            <span>{{ t("务必确保你的这台机器已成功安装 Docker！") }}</span>
          </a-typography-text>
        </a-typography-paragraph>
        <a-input
          v-model:value="formData.docker.image"
          :placeholder="t('镜像完整名，列如：openjdk:17')"
        />
      </a-form-item>

      <a-form-item v-if="createMethod === QUICKSTART_METHOD.DOCKER">
        <a-typography-title :level="5">
          {{ t("挂载工作目录") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("文件管理功能下的目录将挂载到容器内的此目录") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="formData.docker.workingDir" :placeholder="t('默认：/workspace/')" />
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
              {{
                t(
                  "可以填写启动命令，如 java -jar demo.jar，不填写启动命令将以镜像内部定义的命令为准"
                )
              }}
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
        <a-input v-model:value="formData.cwd" :placeholder="t('默认自动分配')" />
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
            <span>{{
              t("完善所有必填项后即可创建，更多其他设置请创建完成后，在应用实例设置中可以编辑！")
            }}</span>
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
