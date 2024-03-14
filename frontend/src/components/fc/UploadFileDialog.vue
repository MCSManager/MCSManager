<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { UploadProps } from "ant-design-vue";
import { t } from "@/lang/i18n";
import { FolderOpenOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { uploadFile } from "@/services/apis/layout";
import type { MountComponent } from "../../types/index";
import { reportErrorMsg } from "@/tools/validator";

const { execute } = uploadFile();

const props = defineProps<MountComponent>();
const uploadControl = new AbortController();
const open = ref(false);
const percentComplete = ref(0);
// eslint-disable-next-line no-unused-vars
let componentResolve: (filePath: string) => void;

const openDialog = (): Promise<string> => {
  open.value = true;
  return new Promise((resolve) => {
    componentResolve = resolve;
  });
};

const submit = (path = "") => {
  open.value = false;
  componentResolve(path);
  if (props.destroyComponent) {
    props.emitResult(path);
    props.destroyComponent();
  }
};

const beforeUpload: UploadProps["beforeUpload"] = async (file) => {
  const uploadFormData = new FormData();
  uploadFormData.append("file", file);
  try {
    const res = await execute({
      data: uploadFormData,
      timeout: Number.MAX_SAFE_INTEGER,
      signal: uploadControl.signal,
      onUploadProgress: (progressEvent: any) => {
        percentComplete.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      }
    });

    if (res.value) {
      message.success(t("TXT_CODE_773f36a0"));
      submit(`/upload_files/${res.value}`);
    } else {
      submit("");
    }
  } catch (error: any) {
    reportErrorMsg(error);
  }
  return false;
};

const cancel = () => {
  uploadControl.abort();
  submit();
};

onMounted(() => {
  openDialog();
});
</script>

<template>
  <a-modal
    v-model:open="open"
    :title="t('TXT_CODE_e00c858c')"
    :closable="false"
    :destroy-on-close="true"
    width="400px"
    @cancel="cancel"
  >
    <div class="upload-container">
      <a-upload
        :max-count="1"
        :disabled="percentComplete > 0"
        :show-upload-list="false"
        :before-upload="beforeUpload"
      >
        <a-button type="primary" :loading="percentComplete > 0">
          <FolderOpenOutlined v-if="percentComplete === 0" />
          {{
            percentComplete > 0
              ? t("TXT_CODE_b625dbf0") + percentComplete + "%"
              : t("TXT_CODE_335ba209")
          }}
        </a-button>
      </a-upload>
      <a-button class="ml-16" @click="cancel">{{ t("TXT_CODE_a0451c97") }}</a-button>
    </div>
    <template #footer> </template>
  </a-modal>
</template>

<style lang="scss" scoped>
.upload-container {
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
