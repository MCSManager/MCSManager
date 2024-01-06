<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
import { reportError } from "@/tools/validator";
import Editor from "@/components/Editor.vue";
import { fileContent } from "@/services/apis/fileManager";
import { useRoute } from "vue-router";

const route = useRoute();
const open = ref(false);
const openEditor = ref(false);
const editorText = ref("");
const fileName = ref("");
const path = ref("");
let resolve: (t: string) => void;
let reject: (e: Error) => void;

const props = defineProps<{
  daemonId: string;
  instanceId: string;
}>();

const openDialog = (path_: string, fileName_: string) => {
  open.value = true;
  path.value = path_;
  fileName.value = fileName_;
  return new Promise(async (_resolve, _reject) => {
    await render();
    resolve = _resolve;
    reject = _reject;
  });
};

const { state: text, execute } = fileContent();
const render = async () => {
  try {
    await execute({
      params: {
        daemonId: props.daemonId,
        uuid: props.instanceId
      },
      data: {
        target: path.value
      }
    });

    if (text.value) {
      typeof text.value === "boolean" ? (editorText.value = "") : (editorText.value = text.value);
    }

    openEditor.value = true;
  } catch (err: any) {
    console.error(err.message);
    return reportError(err.message);
  }
};

const submit = async () => {
  try {
    await execute({
      params: {
        daemonId: props.daemonId,
        uuid: props.instanceId
      },
      data: {
        target: path.value,
        text: editorText.value
      }
    });
    message.success(t("TXT_CODE_a7907771"));
    open.value = openEditor.value = false;
    resolve(editorText.value);
  } catch (err: any) {
    console.error(err.message);
    reject(err);
    return reportError(err.message);
  }
};

const cancel = () => {
  open.value = openEditor.value = false;
};

const dialogTitle = computed(() => {
  return fileName.value;
});

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    :cancel-text="t('TXT_CODE_3b1cc020')"
    :ok-text="t('TXT_CODE_abfe9512')"
    :mask-closable="false"
    :title="dialogTitle"
    width="1300px"
    @ok="submit()"
    @cancel="cancel()"
  >
    <Editor
      v-if="openEditor"
      ref="EditorComponent"
      v-model:text="editorText"
      :filename="fileName"
      height="80vh"
    />
    <a-skeleton v-else :paragraph="{ rows: 12 }" active />
  </a-modal>
</template>
