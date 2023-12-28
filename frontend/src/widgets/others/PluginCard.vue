<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { LayoutCard } from "../../types/index";
import { useUploadFileDialog } from "@/components/fc";
import { useLayoutCardTools } from "../../hooks/useCardTools";
import { ref, onMounted, onUnmounted } from "vue";
import { useLayoutContainerStore } from "../../stores/useLayoutContainerStore";
import axios from "axios";
import { v4 } from "uuid";
import { ProxySandBox } from "../../tools/sandbox";

const props = defineProps<{
  card: LayoutCard;
}>();

const DOM_ID = v4().replace(/[-]/g, "");
const { containerState } = useLayoutContainerStore();
const { getMetaValue, setMetaValue } = useLayoutCardTools(props.card);

const originUrl = ref(getMetaValue<string>("url", ""));
let sandbox: ProxySandBox;

const uploadHtmlFile = async () => {
  originUrl.value = await useUploadFileDialog();
  setMetaValue("url", originUrl.value);
  await loadRemoteHtml();
};

const loadRemoteHtml = async () => {
  if (!originUrl.value || !originUrl.value.includes(".html")) return;

  const { data } = await axios.get<string>(originUrl.value);
  const dom = document.getElementById(DOM_ID);
  if (data && dom) {
    dom.innerHTML = data;
    const scriptDoms = dom.querySelectorAll("script");
    sandbox = new ProxySandBox();
    for (const remoteScript of scriptDoms) {
      if (remoteScript.src) {
        const script = document.createElement("script");
        script.src = remoteScript.src;
        script.lang = remoteScript.lang;
        document.head.appendChild(script);
      }
      if (remoteScript.textContent) {
        sandbox.executeJavascript(remoteScript.textContent);
        sandbox.mount();
      }
    }
  }
};

onMounted(() => {
  loadRemoteHtml().catch((err) => {
    console.error(err);
  });
});

onUnmounted(() => {
  if (sandbox) {
    sandbox.destroy();
  }
});
</script>

<template>
  <card-panel>
    <template #title>
      <div class="flex">
        {{ card.title }}
      </div>
    </template>
    <template #body>
      <div class="plugin-card-container">
        <div v-if="containerState.isDesignMode">
          <a-typography-paragraph>
            <p>
              {{ t("支持上传 HTML 文件，此卡片会加载 HTML 并运行 Javascript 代码。") }}
              <br />
              {{ t("使用其他人分享的文件可能会导致面板被入侵。") }}
            </p>
            <div v-if="originUrl">{{ t("HTML 文件:") }}</div>
            <div v-if="originUrl" class="mt-16 mb-16">
              <code class="p-8"> {{ originUrl }}</code>
            </div>
            <a-button class="mt-8" type="primary" @click="uploadHtmlFile">
              {{ t("上传 HTML 文件") }}
            </a-button>
          </a-typography-paragraph>
        </div>
        <div v-else :id="DOM_ID" class="html-plugin-container">
          <!-- Remote HTML -->
        </div>
      </div>
    </template>
  </card-panel>
</template>

<style lang="less" scoped>
.plugin-card-container,
.html-plugin-container {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: auto;
}
</style>
