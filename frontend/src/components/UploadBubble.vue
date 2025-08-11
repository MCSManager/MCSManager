<script setup lang="ts">
import { t } from "@/lang/i18n";
import { CloudUploadOutlined } from "@ant-design/icons-vue";
import { FloatButton } from "ant-design-vue";
import uploadService from "@/services/uploadService";
import { computed } from "vue";

const uploadData = uploadService.uiData;
const uploadCount = computed(() => {
  return uploadData.value.files[1] - uploadData.value.files[0] + 1;
});
const uploadProgress = computed(() => {
  if (uploadService.uiData.value.current) {
    return (
      (uploadService.uiData.value.current[0] * 100) /
      uploadService.uiData.value.current[1]
    ).toFixed(0);
  }
  return "0";
});
</script>

<template>
  <FloatButton
    v-if="uploadData.current && !uploadData.suspending"
    :badge="{
      count: uploadCount,
      overflowCount: 99,
      color: 'blue'
    }"
    :tooltip="t('TXT_CODE_b0ff4172', { n: uploadCount }) + ` (${uploadProgress}%)`"
  >
    <template #icon>
      <CloudUploadOutlined />
    </template>
  </FloatButton>
</template>

<style scoped lang="scss"></style>
