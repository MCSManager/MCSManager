<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import Editor from "@/components/Editor.vue";
import { fileContent } from "@/services/apis/fileManager";
import { useKeyboardEvents } from "@/hooks/useKeyboardEvents";
import { useScreen } from "@/hooks/useScreen";
import { FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons-vue";

const emit = defineEmits(["save"]);

const open = ref(false);
const openEditor = ref(false);
const editorText = ref("");
const fileName = ref("");
const path = ref("");

const { isPhone } = useScreen();

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
  useKeyboardEventsHooks = useKeyboardEvents(
    { ctrl: true, alt: false, caseSensitive: false, key: "s" },
    async () => {
      try {
        await submitRequest();
        message.success(t("TXT_CODE_8f47d95"));
        emit("save");
      } catch (err: any) {
        return reportErrorMsg(err.message);
      }
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

const fullScreen = ref(false);

const { state: text, execute, isLoading } = fileContent();
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
    return reportErrorMsg(err.message);
  }
};

const submitRequest = async () => {
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
};

const submit = async () => {
  try {
    await submitRequest();
    message.success(t("TXT_CODE_a7907771"));
    cancel();
    resolve(editorText.value);
    emit("save");
  } catch (err: any) {
    console.error(err.message);
    reject(err);
    return reportErrorMsg(err.message);
  }
};

const cancel = async () => {
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
    :width="fullScreen ? '100%' : '1300px'"
    :confirm-loading="isLoading"
    @ok="submit"
    @cancel="cancel"
  >
    <template #title>
      {{ dialogTitle }}
      <a-button v-if="!isPhone" type="text" size="small" @click="fullScreen = !fullScreen">
        <template #icon>
          <FullscreenExitOutlined v-if="fullScreen" />
          <FullscreenOutlined v-else />
        </template>
      </a-button>
    </template>
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
