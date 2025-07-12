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
      <p>页面加载失败，请稍后重试！</p>
      <p>{{ error }}</p>
      <a-button type="primary" @click="reload">重试</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  error.value = err?.message;
  emit("error");
};

const generateIframeAddr = () => {
  return `${props.src}?theme=${isDarkTheme() ? "dark" : "light"}&t=${Date.now()}`;
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
