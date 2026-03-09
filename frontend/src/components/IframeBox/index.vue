<!-- IframeBox 组件 -->
<template>
  <div class="iframe-box" :style="{ width: width, height: height }">
    <iframe
      v-if="iframeSrc"
      ref="iframeRef"
      :style="{ width: width, height: height }"
      :src="iframeSrc"
      class="iframe-content"
      @load="handleLoad"
      @error="handleError"
    ></iframe>

    <div v-if="error" class="iframe-error">
      <p>{{ t("TXT_CODE_ef8f8e29") }}</p>
      <p>{{ error }}</p>
      <a-button type="primary" @click="reload">{{ t("TXT_CODE_9277af78") }}</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t } from "@/lang/i18n";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { nextTick, onMounted, ref } from "vue";
import { useIframeEventListener, type IframeBoxEmits, type IframeBoxProps } from "./config";

const props = withDefaults(defineProps<IframeBoxProps>(), {
  width: "100%",
  height: "100%"
});

const emit = defineEmits<IframeBoxEmits>();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const error = ref<string>("");
const iframeSrc = ref<string>("");
const { isDarkTheme } = useAppConfigStore();

useIframeEventListener(iframeRef);

// 处理iframe加载完成
const handleLoad = () => {
  error.value = "";
  emit("load");
};

// 处理iframe加载错误
const handleError = (err: any) => {
  console.error("IframeBox error", err);
  error.value = err?.message;
  emit("error");
};

const generateIframeAddr = () => {
  return `${props.src}?theme=${isDarkTheme.value ? "dark" : "light"}&t=${Date.now()}`;
};

// 重新加载iframe
const reload = () => {
  iframeSrc.value = "";
  nextTick(() => {
    iframeSrc.value = generateIframeAddr();
  });
};

onMounted(() => {
  iframeSrc.value = generateIframeAddr();
});
</script>

<style scoped>
.iframe-box {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.iframe-content {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
}

.iframe-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #ff4d4f;
}
</style>
