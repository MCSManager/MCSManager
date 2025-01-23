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

const onOk = () => {
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
  <a-modal :visible="isOpen" :title="t('图片查看器')" @ok="onOk" @cancel="onOk">
    <a-spin :spinning="!imgLink">
      <a-image :src="imgLink" />
    </a-spin>
    <template #footer>
      <div class="justify-space-between">
        <a-button :loading="downloadBtnLoading" @click="onDownload">下载</a-button>
        <div class="right">
          <a-button type="primary" @click="onOk">关闭</a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>
