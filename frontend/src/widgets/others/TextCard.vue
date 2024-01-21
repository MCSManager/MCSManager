<!-- eslint-disable vue/no-v-html -->
<!-- eslint-disable no-unused-vars -->
<script setup lang="ts">
import { ref } from "vue";
import { $t as t } from "@/lang/i18n";
import CardPanel from "@/components/CardPanel.vue";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import type { LayoutCard } from "@/types/index";
import { markdownToHTML as mdToHTML } from "@/tools/safe";

enum EDIT_MODE {
  PREVIEW = "PREVIEW",
  EDIT = "EDIT"
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

const markdownTextToHTML = (md: string) => {
  return mdToHTML(md);
};
</script>

<template>
  <CardPanel>
    <template #title>
      <div class="flex">{{ card.title }}</div>
    </template>
    <template #operator>
      <div v-if="containerState.isDesignMode" class="ml-10">
        <a-button
          v-if="status !== EDIT_MODE.PREVIEW"
          type="primary"
          size="small"
          @click="previewsTextContent()"
        >
          {{ t("TXT_CODE_4d81a657") }}
        </a-button>
        <a-button v-else type="primary" size="small" @click="editTextContent()">
          {{ t("TXT_CODE_ad207008") }}
        </a-button>
      </div>
    </template>

    <template v-if="containerState.isDesignMode && status == EDIT_MODE.EDIT" #body>
      <div class="edit h-100">
        <a-textarea
          v-model:value="textContent"
          class="h-100"
          style="resize: none"
          :placeholder="t('TXT_CODE_7ceebc05')"
        />
      </div>
    </template>

    <template v-else #body>
      <div class="full-card-body-container">
        <div
          class="previews global-markdown-html h-100"
          v-html="markdownTextToHTML(textContent)"
        ></div>
      </div>
    </template>
  </CardPanel>
</template>
