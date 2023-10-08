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
  TYPE_UNIVERSAL
} from "@/hooks/useInstance";
import SelectUnzipCode from "../instance/dialogs/SelectUnzipCode.vue";
import {
  uploadAddress,
  uploadInstanceFile,
  createInstance as createInstanceApi
} from "@/services/apis/instance";
import { parseForwardAddress } from "@/tools/protocol";

enum UNZIP {
  ON = 1,
  OFF = 0
}

const selectUnzipCodeDialog = ref<InstanceType<typeof SelectUnzipCode>>();
const emit = defineEmits(["nextStep"]);

const props = defineProps<{
  appType: QUICKSTART_ACTION_TYPE;
  createMethod: QUICKSTART_METHOD;
  remoteUuid: string;
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
  createDatetime: new Date().toDateString(),
  lastDatetime: "",
  type: TYPE_UNIVERSAL,
  tag: [],
  maxSpace: null,
  endTime: ""
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

if (props.appType === QUICKSTART_ACTION_TYPE.SteamGameServer) {
  formData.startCommand = isFileMode ? "${ProgramName}" : "";
  formData.type = TYPE_STEAM_SERVER_UNIVERSAL;
}

const rules: Record<string, Rule[]> = {
  nickname: [{ required: true, message: t("请输入实例名称") }],
  startCommand: [
    {
      required: true,
      validator: async (_rule: Rule, value: string) => {
        if (value === "") throw new Error(t("请输入启动命令"));
        if (value.includes("\n"))
          throw new Error(t("启动命令中不可包含换行，这并非脚本文件，不可执行多条命令"));
      },
      trigger: "change"
    }
  ]
};

const uFile = ref<File>();

const beforeUpload: UploadProps["beforeUpload"] = async (file) => {
  uFile.value = file;

  if (isImportMode) {
    if (file.type !== "application/x-zip-compressed")
      return message.error(t("只能上传zip压缩文件"));
    selectUnzipCodeDialog.value?.openDialog();
  } else {
    finalConfirm();
  }

  return false;
};

// 设置解压缩编码
const setUnzipCode = async (code: string) => {
  zipCode.value = code;
  finalConfirm();
};

// 最终确认
const finalConfirm = async () => {
  const thisModal = Modal.confirm({
    title: t("最终确认"),
    icon: createVNode(InfoCircleOutlined),
    content: needUpload
      ? t("上传文件时将同时创建实例，此操作不可逆，是否继续？")
      : t("实例将创建，是否继续？"),
    okText: t("确定"),
    async onOk() {
      thisModal.destroy();
      try {
        await formRef.value?.validateFields();
        needUpload ? await selectedFile() : await createInstance();
      } catch {
        return message.error(t("请先完善基本参数再进行上传文件操作"));
      }
    },
    onCancel() {}
  });
};

// 通过上传单个程序或者压缩包创建实例
const { state: cfg, execute: getCfg } = uploadAddress();
const { execute: uploadFile } = uploadInstanceFile();
const percentComplete = ref(0);
const selectedFile = async () => {
  try {
    if (!formData.cwd) formData.cwd = ".";
    if (isFileMode) {
      formData.startCommand = formData.startCommand.replace("${ProgramName}", uFile.value!.name);
    }
    await getCfg({
      params: {
        upload_dir: ".",
        remote_uuid: props.remoteUuid
      },
      data: formData
    });
    if (!cfg.value) throw new Error(t("获取上传地址失败"));

    const uploadFormData = new FormData();
    uploadFormData.append("file", uFile.value as any);

    await uploadFile({
      params: {
        unzip: isImportMode ? UNZIP.ON : UNZIP.OFF,
        code: zipCode.value
      },
      data: uploadFormData,
      url: `${parseForwardAddress(cfg.value.addr, "http")}/upload/${cfg.value.password}`,
      onUploadProgress: (progressEvent: any) => {
        percentComplete.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      }
    });
    emit("nextStep", cfg.value.instanceUuid);
    return message.success(t("创建成功"));
  } catch (err: any) {
    console.error(err);
    return message.error(err.message);
  }
};

// 直接新建实例
const {
  state: newInstanceInfo,
  execute: executeCreateInstance,
  isLoading: createInstanceLoading
} = createInstanceApi();
const createInstance = async () => {
  try {
    if (!formData.cwd) formData.cwd = ".";
    await executeCreateInstance({
      params: {
        remote_uuid: props.remoteUuid
      },
      data: formData
    });
    if (newInstanceInfo.value) emit("nextStep", newInstanceInfo.value.instanceUuid);
    return message.success(t("创建成功"));
  } catch (err: any) {
    return message.error(err.message);
  }
};
</script>

<template>
  <div style="text-align: left">
    <a-form ref="formRef" :rules="rules" :model="formData" layout="vertical" autocomplete="off">
      <a-form-item name="nickname">
        <a-typography-title :level="5" class="require-field">
          {{ t("实例名称") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("支持中文，尽可能保证唯一性") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="formData.nickname" />
      </a-form-item>

      <a-form-item name="startCommand">
        <a-typography-title :level="5" class="require-field">
          {{ t("启动命令") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{
              createMethod === QUICKSTART_METHOD.IMPORT
                ? t("因为无法识别压缩包中的服务端文件名，请您自行填写启动命令")
                : t("请您自行填写启动命令")
            }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input-group compact style="display: flex">
          <a-textarea
            v-model:value="formData.startCommand"
            :rows="3"
            :placeholder="t('如 java -jar server.jar，cmd.exe 等等')"
            style="min-height: 40px"
          />
          <a-button
            type="default"
            style="height: auto; border-top-left-radius: 0; border-bottom-left-radius: 0"
          >
            {{ t("命令助手") }}
          </a-button>
        </a-input-group>
      </a-form-item>

      <a-form-item v-if="createMethod !== QUICKSTART_METHOD.EXIST" name="cwd">
        <a-typography-title :level="5">
          {{ t("服务端文件目录") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("选填，默认自动创建与管理，如需填写请写完整绝对路径，如: C:/Servers/MyServer") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="formData.cwd" />
      </a-form-item>

      <a-form-item v-if="createMethod === QUICKSTART_METHOD.FILE">
        <a-typography-title :level="5" class="require-field">
          {{ t("上传单个服务端软件") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("上传文件后实例将自动创建") }}
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
            {{ percentComplete > 0 ? t("正在上传：") + percentComplete + "%" : t("选择文件") }}
          </a-button>
        </a-upload>
      </a-form-item>

      <a-form-item v-else-if="createMethod === QUICKSTART_METHOD.IMPORT">
        <a-typography-title :level="5" class="require-field">
          {{ t("上传服务端压缩包") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("仅支持 ZIP 格式，上传后压缩包会自动解压到 “文件目录”") }}
            <br />
            {{ t("上传文件后实例将自动创建并解压文件，可能需要一段时间才能完成解压任务") }}
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
            {{ percentComplete > 0 ? t("正在上传：") + percentComplete + "%" : t("选择 zip 文件") }}
          </a-button>
        </a-upload>
      </a-form-item>

      <a-form-item v-else>
        <a-typography-paragraph class="mt-10">
          <a-typography-text>
            {{ t("填写好服务端软件文件名后，再前往文件管理上传服务端软件即可开启实例。") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-button type="primary" :loading="createInstanceLoading" @click="finalConfirm">
          {{ t("创建实例") }}
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
