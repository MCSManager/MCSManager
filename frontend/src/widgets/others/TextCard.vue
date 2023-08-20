<script setup lang="ts">
import { ref } from "vue";
import { $t as t } from "@/lang/i18n";
import CardPanel from "@/components/CardPanel.vue";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { useLayoutCardTools } from "@/hooks/useCardTools";

import type { LayoutCard } from "@/types/index";
import { markdownToHTML } from "../../tools/safe";

enum EDIT_MODE {
  PREVIEW = "PREVIEW",
  EDIT = "EDIT",
}

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaValue, setMetaValue } = useLayoutCardTools(props.card);
const { containerState } = useLayoutContainerStore();

const textContent = ref<string>(getMetaValue("textContent", ""));
const status = ref(EDIT_MODE.PREVIEW);

// function
const previewsTextContent = () => {
  setMetaValue("textContent", textContent.value);
  status.value = EDIT_MODE.PREVIEW;
};

const editTextContent = () => {
  status.value = EDIT_MODE.EDIT;
};
</script>

<template>
  <CardPanel>
    <template #title>
      <div class="flex">
        {{ card.title }}
        <div v-if="containerState.isDesignMode" class="ml-10">
          <a-button
            type="primary"
            size="small"
            v-if="status !== EDIT_MODE.PREVIEW"
            @click="previewsTextContent()"
          >
            {{ t("预览") }}
          </a-button>
          <a-button
            type="primary"
            size="small"
            v-else
            @click="editTextContent()"
          >
            {{ t("编辑") }}
          </a-button>
        </div>
      </div>
    </template>

    <template
      #body
      v-if="containerState.isDesignMode && status == EDIT_MODE.EDIT"
    >
      <div class="edit h-100">
        <a-textarea
          class="h-100"
          style="resize: none"
          v-model:value="textContent"
          :placeholder="
            t(
              `输入文本内容，支持 Markdown 语法，可换行。\n不要轻易使用其他人的文案，否则将有可能注入恶意代码对你进行攻击。`
            )
          "
        />
      </div>
    </template>

    <template #body v-else>
      <div
        class="previews global-markdown-html h-100"
        v-html="markdownToHTML(textContent)"
      ></div>
    </template>
  </CardPanel>
</template>
