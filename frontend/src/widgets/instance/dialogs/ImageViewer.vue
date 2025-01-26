<script setup lang="ts">
import { onMounted, ref } from "vue";
import { t } from "@/lang/i18n";
import { useFileManager } from "@/hooks/useFileManager";

const props = defineProps<{
  emitResult: () => void;
  destroyComponent: () => void;
  instanceId: string;
  daemonId: string;
  fileName: string;
  frontDir: string;
}>();

const { getFileLink } = useFileManager(props.instanceId, props.daemonId);

const isOpen = ref(true);
const imgLink = ref("");
const downloadBtnLoading = ref(false);

const onClose = () => {
  isOpen.value = false;
  props.emitResult();
  props.destroyComponent();
};

const onDownload = async () => {
  downloadBtnLoading.value = true;
  imgLink.value = (await getFileLink(props.fileName, props.frontDir)) || "";
  downloadBtnLoading.value = false;
  window.open(imgLink.value);
};

onMounted(async () => {
  imgLink.value = (await getFileLink(props.fileName, props.frontDir)) || "";
});
</script>

<template>
  <a-modal :visible="isOpen" :title="t('图像预览')" @ok="onClose" @cancel="onClose">
    <div class="image-view">
      <a-spin :spinning="!imgLink">
        <a-image :src="imgLink" />
      </a-spin>
    </div>
    <div class="image-name">
      {{ props.fileName }}
    </div>
    <template #footer>
      <a-button @click="onClose">{{ t("关闭") }}</a-button>
      <a-button type="primary" :loading="downloadBtnLoading" @click="onDownload">
        {{ t("下载") }}
      </a-button>
    </template>
  </a-modal>
</template>

<style scoped>
.image-view {
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.image-name {
  text-align: center;
}
</style>
