<!-- IframeModal Dialog Component -->
<template>
  <a-modal
    v-model:open="visible"
    width="80%"
    :footer="null"
    :closable="true"
    :mask-closable="true"
    :destroy-on-close="true"
    :centered="true"
    class="iframe-modal"
    @cancel="handleCancel"
  >
    <div class="iframe-modal-content">
      <IframeBox :src="src" width="100%" height="100%" />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import IframeBox from "@/components/IframeBox/index.vue";

interface IframeModalProps {
  src: string;
}

const props = defineProps<IframeModalProps>();

const visible = ref(false);

// Handle modal close
const handleCancel = () => {
  visible.value = false;
};

// Show modal after component mount
onMounted(() => {
  visible.value = true;
});

// Expose methods for external use
defineExpose({
  close: handleCancel
});
</script>

<style scoped>
.iframe-modal :deep(.ant-modal-body) {
  padding: 0;
  height: 100%;
}

.iframe-modal-content {
  width: 100%;
  height: 80vh;
  min-height: 600px;
  overflow: hidden;
  padding: 14px 0;
}

.iframe-modal :deep(.ant-modal-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.iframe-modal :deep(.ant-modal-header) {
  flex-shrink: 0;
}
</style>
