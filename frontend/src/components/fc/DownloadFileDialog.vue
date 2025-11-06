<script setup lang="ts">
import { t } from "@/lang/i18n";
import { reportValidatorError } from "@/tools/validator";
import type { DownloadFileConfigItem } from "@/types/fileManager";
import { ref, watch } from "vue";
import type { MountComponent } from "../../types/index";

const props = defineProps<MountComponent>();

const open = ref(true);
const dataSource = ref<DownloadFileConfigItem>({
  url: "",
  fileName: ""
});

const submit = async () => {
  if (!dataSource.value.url) return reportValidatorError(t("TXT_CODE_b5095a15"));
  if (!dataSource.value.fileName) return reportValidatorError(t("TXT_CODE_de1b06cd"));
  try {
    new URL(dataSource.value.url);
  } catch (_) {
    return reportValidatorError(t("TXT_CODE_a4a960b9"));
  }
  props.emitResult(dataSource.value);
  await cancel();
};

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent();
};

const getFileNameFromUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    const urlObject = new URL(url);
    const pathSegments = urlObject.pathname.split("/").filter(Boolean);
    const lastPathSegment = pathSegments.pop() || "";
    return decodeURIComponent(lastPathSegment);
  } catch (_) {
    return undefined;
  }
};

watch(
  () => dataSource.value.url,
  (newUrl, oldUrl) => {
    if (newUrl == oldUrl) return;
    const fileName = getFileNameFromUrl(newUrl);
    if (!fileName) return;
    dataSource.value.fileName = fileName;
  }
);
</script>

<template>
  <a-modal
    v-model:open="open"
    :title="t('TXT_CODE_816ce026')"
    :closable="false"
    :destroy-on-close="true"
    width="400px"
    @cancel="cancel"
    @ok="submit"
  >
    <a-form layout="vertical">
      <a-form-item :label="t('TXT_CODE_62d10724')">
        <a-input v-model:value="dataSource.url" :placeholder="t('TXT_CODE_4ea93630')" />
      </a-form-item>
      <a-form-item :label="t('TXT_CODE_2eace3d5')">
        <a-input v-model:value="dataSource.fileName" :placeholder="t('TXT_CODE_4ea93630')" />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="cancel">{{ t("TXT_CODE_a0451c97") }}</a-button>
      <a-button type="primary" @click="submit">{{ t("TXT_CODE_d507abff") }}</a-button>
    </template>
  </a-modal>
</template>

<style lang="scss" scoped></style>
