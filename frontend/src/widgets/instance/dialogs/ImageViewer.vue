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
const imgBlobUrl = ref("");
const downloadBtnLoading = ref(false);

const onClose = () => {
  isOpen.value = false;
  if (imgBlobUrl.value) URL.revokeObjectURL(imgBlobUrl.value);
  props.emitResult();
  props.destroyComponent();
};

const onDownload = async () => {
  downloadBtnLoading.value = true;
  // A FRESH download link (new passport) - the one from onMounted is spent.
  imgLink.value = (await getFileLink(props.fileName, props.frontDir)) || "";
  downloadBtnLoading.value = false;
  window.open(imgLink.value);
};

onMounted(async () => {
  const link = (await getFileLink(props.fileName, props.frontDir)) || "";
  if (!link) return;
  // Fetch ONCE into a blob URL: the download passport is single-use and the
  // antd image preview re-requests the same src - pointing both the image and
  // its preview at a blob URL keeps them working without a second download.
  try {
    const res = await fetch(link);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    imgBlobUrl.value = URL.createObjectURL(blob);
    imgLink.value = imgBlobUrl.value;
  } catch {
    imgLink.value = link;
  }
});
</script>

<template>
  <a-modal :visible="isOpen" :title="t('TXT_CODE_eee2a47f')" @ok="onClose" @cancel="onClose">
    <div class="image-view">
      <a-spin :spinning="!imgLink">
        <a-image :src="imgLink" />
      </a-spin>
    </div>
    <div class="image-name">
      {{ props.fileName }}
    </div>
    <template #footer>
      <a-button type="primary" :loading="downloadBtnLoading" @click="onDownload">
        {{ t("TXT_CODE_65b21404") }}
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
