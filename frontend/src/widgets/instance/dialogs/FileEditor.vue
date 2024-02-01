<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
import { reportError } from "@/tools/validator";
import Editor from "@/components/Editor.vue";
import { fileContent } from "@/services/apis/fileManager";
import { useKeyboardEvents } from "../../../hooks/useKeyboardEvents";

const open = ref(false);
const openEditor = ref(false);
const editorText = ref("");
const fileName = ref("");
const path = ref("");

// eslint-disable-next-line no-unused-vars
let resolve: (t: string) => void;
// eslint-disable-next-line no-unused-vars
let reject: (e: Error) => void;

const props = defineProps<{
  daemonId: string;
  instanceId: string;
}>();

let useKeyboardEventsHooks: ReturnType<typeof useKeyboardEvents> | null = null;

const initKeydownListener = () => {
  console.debug("初始化：快捷键");
  useKeyboardEventsHooks = useKeyboardEvents(
    { ctrl: true, alt: false, caseSensitive: false, key: "s" },
    async () => {
      await submitRequest();
      message.success(t("已通过快捷键保存！"));
    }
  );
  useKeyboardEventsHooks.startKeydownListener();
};

const openDialog = (_path: string, _fileName: string) => {
  open.value = true;
  path.value = _path;
  fileName.value = _fileName;
  initKeydownListener();
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

const submitRequest = async () => {
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
  } catch (err: any) {
    return reportError(err.message);
  }
};

const submit = async () => {
  try {
    await submitRequest();
    message.success(t("TXT_CODE_a7907771"));
    cancel();
    resolve(editorText.value);
  } catch (err: any) {
    console.error(err.message);
    reject(err);
    return reportError(err.message);
  }
};

const cancel = () => {
  useKeyboardEventsHooks?.removeKeydownListener();
  open.value = openEditor.value = false;
  resolve(editorText.value);
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
