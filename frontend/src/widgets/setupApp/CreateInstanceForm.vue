<script setup lang="ts">
import { getFileConfigAddr } from "@/hooks/useFileManager";
import { INSTANCE_TYPE_TRANSLATION, TYPE_MINECRAFT_BUNGEECORD } from "@/hooks/useInstance";
import { QUICKSTART_ACTION_TYPE, QUICKSTART_METHOD } from "@/hooks/widgets/quickStartFlow";
import { t } from "@/lang/i18n";
import { createInstance as createInstanceApi, uploadAddress } from "@/services/apis/instance";
import uploadService, { UploadFiles } from "@/services/uploadService";
import { parseForwardAddress } from "@/tools/protocol";
import { reportErrorMsg } from "@/tools/validator";
import { defaultInstanceInfo } from "@/types/const";
import {
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  UploadOutlined
} from "@ant-design/icons-vue";
import type { FormInstance } from "ant-design-vue";
import { message, Modal, type UploadProps } from "ant-design-vue";
import type { Rule } from "ant-design-vue/es/form";
import { computed, createVNode, onUnmounted, reactive, ref } from "vue";
import SelectUnzipCode from "../instance/dialogs/SelectUnzipCode.vue";

const selectUnzipCodeDialog = ref<InstanceType<typeof SelectUnzipCode>>();
const emit = defineEmits(["nextStep"]);

const props = defineProps<{
  createMethod: QUICKSTART_METHOD;
  daemonId: string;
}>();

const zipCode = ref("utf-8");
const formRef = ref<FormInstance>();
const formData = reactive<IGlobalInstanceConfig>(defaultInstanceInfo);

const isImportMode = props.createMethod === QUICKSTART_METHOD.IMPORT;
const isFileMode = props.createMethod === QUICKSTART_METHOD.FILE;
const needUpload = isImportMode || isFileMode;

function changeInstanceType(appType: string) {
  if (appType.includes(QUICKSTART_ACTION_TYPE.Minecraft)) {
    if (appType === TYPE_MINECRAFT_BUNGEECORD) {
      formData.stopCommand = "end";
    } else {
      formData.stopCommand = "stop";
    }
  }

  if (appType.includes(QUICKSTART_ACTION_TYPE.Bedrock)) {
    formData.stopCommand = "stop";
  }

  if (appType.includes(QUICKSTART_ACTION_TYPE.Terraria)) {
    formData.stopCommand = "stop";
  }

  if (
    appType.includes(QUICKSTART_ACTION_TYPE.SteamGameServer) ||
    appType.includes(QUICKSTART_ACTION_TYPE.AnyApp)
  ) {
    formData.stopCommand = "^c";
  }
}

const rules: Record<string, Rule[]> = {
  nickname: [{ required: true, message: t("TXT_CODE_68a504b3") }],
  stopCommand: [{ required: true, message: t("TXT_CODE_83053cd5") }]
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
  try {
    await formRef.value?.validate();
  } catch (err: any) {
    return reportErrorMsg(t("TXT_CODE_47e21c80"));
  }
  const thisModal = Modal.confirm({
    title: t("TXT_CODE_2a3b0c17"),
    icon: createVNode(InfoCircleOutlined),
    content: needUpload ? t("TXT_CODE_e06841b5") : t("TXT_CODE_5deeefb5"),
    okText: t("TXT_CODE_d507abff"),
    async onOk() {
      thisModal.destroy();
      try {
        needUpload ? await selectedFile() : await createInstance();
      } catch (err: any) {
        return reportErrorMsg(err);
      }
    },
    onCancel() {}
  });
};

const uploadStarted = ref(false);
const uploadFileInstance = ref<UploadFiles>();
let uploadStartCallback: (() => void) | undefined = undefined;
let uploadEndCallback: (() => void) | undefined = undefined;
onUnmounted(() => {
  if (uploadFileInstance.value) {
    if (uploadStartCallback) uploadFileInstance.value.removeCallback("start", uploadStartCallback);
    if (uploadEndCallback) uploadFileInstance.value.removeCallback("end", uploadEndCallback);
  }
});

const { state: cfg, execute: getCfg } = uploadAddress();
const percentComplete = computed(() => {
  if (!uploadStarted.value) return 0;
  const uploadData = uploadService.uiData.value;
  if (!uploadData.current) return 0;
  return (uploadData.current[0] / uploadData.current[1]) * 100;
});

const percentText = () => {
  if (!uploadFileInstance.value) {
    return t("TXT_CODE_c17f6488");
  }

  if (uploadStarted.value) {
    return t("TXT_CODE_b625dbf0") + percentComplete.value.toFixed(0) + "%";
  } else {
    return t("TXT_CODE_f63c4be2", {
      n: uploadService.getFileNth(uploadFileInstance.value.id || "")
    });
  }
};

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

    uploadStartCallback = () => {
      uploadStarted.value = true;
    };
    const addr = parseForwardAddress(getFileConfigAddr(cfg.value), "http");
    const task = uploadService.append(
      uFile.value!,
      addr,
      cfg.value.password,
      {
        overwrite: false,
        unzip: isImportMode,
        code: zipCode.value
      },
      (task) => {
        task.addCallback("start", uploadStartCallback!);
      }
    );
    uploadFileInstance.value = task;
    const instanceUuid = cfg.value.instanceUuid;
    uploadEndCallback = () => {
      emit("nextStep", instanceUuid);
      return message.success(t("TXT_CODE_d28c05df"));
    };
    task.addCallback("end", uploadEndCallback);
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

      <a-form-item>
        <a-typography-title :level="5" class="require-field">
          {{ t("TXT_CODE_2f291d8b") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_be608c82") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-select
          v-model:value="formData.type"
          :placeholder="t('TXT_CODE_3bb646e4')"
          @change="(value) => changeInstanceType(value?.toString() ?? '')"
        >
          <a-select-option v-for="(item, key) in INSTANCE_TYPE_TRANSLATION" :key="key" :value="key">
            {{ item }}
          </a-select-option>
        </a-select>
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
          {{ t("TXT_CODE_81979d0f") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_3407250a") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="formData.docker.workingDir" :placeholder="t('TXT_CODE_2082f659')" />
      </a-form-item>

      <a-form-item v-if="createMethod === QUICKSTART_METHOD.DOCKER">
        <a-typography-title :level="5" class="require-field">
          {{ t("TXT_CODE_5484094a") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_60dd05d5") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-switch
          v-model:checked="formData.docker.changeWorkdir"
          :checked-value="true"
          :un-checked-value="false"
        >
          <template #checkedChildren>
            <check-outlined />
          </template>
          <template #unCheckedChildren>
            <close-outlined />
          </template>
        </a-switch>
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
            :placeholder="t('TXT_CODE_d4ad1dd')"
            style="min-height: 40px"
          />
        </a-input-group>
      </a-form-item>

      <a-form-item name="stopCommand">
        <a-typography-title :level="5" class="require-field">
          {{ t("TXT_CODE_11cfe3a1") }}
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_7ec7ccb8") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="formData.stopCommand" :placeholder="t('TXT_CODE_83053cd5')" />
      </a-form-item>

      <a-form-item name="cwd">
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
          :disabled="percentComplete > 0 || uploadFileInstance != undefined"
        >
          <a-button
            :disabled="!formData.nickname"
            type="primary"
            :loading="percentComplete > 0 || uploadFileInstance != undefined"
          >
            <upload-outlined v-if="percentComplete == 0 && uploadFileInstance == undefined" />
            {{ percentText() }}
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
