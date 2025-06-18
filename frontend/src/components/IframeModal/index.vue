<!-- IframeModal Dialog Component -->
<template>
  <a-modal
    v-model:open="visible"
    :width="modalWidth"
    :height="modalHeight"
    :footer="null"
    :closable="closable"
    :mask-closable="maskClosable"
    :destroy-on-close="true"
    class="iframe-modal"
    @cancel="handleCancel"
  >
    <div class="iframe-modal-content" :style="{ height: iframeHeight }">
      <IframeBox
        :src="src"
        :width="iframeWidth"
        :height="iframeHeight"
        @load="handleIframeLoad"
        @error="handleIframeError"
      />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import IframeBox from "@/components/IframeBox/index.vue";

interface IframeModalProps {
  src: string;
  width?: string | number;
  height?: string | number;
  closable?: boolean;
  maskClosable?: boolean;
  destroyComponent?: (delay?: number) => Promise<void>;
  emitResult?: (data: any) => void;
}

const props = withDefaults(defineProps<IframeModalProps>(), {
  width: "100%",
  height: "100%",
  closable: true,
  maskClosable: true
});

const visible = ref(false);

// Calculate modal and iframe dimensions
const modalWidth = typeof props.width === "number" ? `${props.width}px` : props.width;
const modalHeight = typeof props.height === "number" ? `${props.height}px` : props.height;
const iframeWidth = "100%";
const iframeHeight =
  typeof props.height === "number" ? `${props.height - 100}px` : "calc(80vh - 100px)";

// Handle modal close
const handleCancel = () => {
  visible.value = false;
  // Delay component destruction
  props.destroyComponent?.(300);
};

// Handle iframe load complete
const handleIframeLoad = () => {
  console.log("Iframe loaded successfully");
};

// Handle iframe load error
const handleIframeError = () => {
  console.error("Iframe load failed");
};

// Return result and close modal
const emitResultAndClose = (data: any) => {
  visible.value = false;
  props.emitResult?.(data);
  props.destroyComponent?.(300);
};

// Show modal after component mount
onMounted(() => {
  visible.value = true;
});

// Expose methods for external use
defineExpose({
  emitResultAndClose,
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
  overflow: hidden;
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
