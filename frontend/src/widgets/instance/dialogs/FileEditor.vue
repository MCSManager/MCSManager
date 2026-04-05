<script setup lang="ts">
import Editor from "@/components/Editor.vue";
import { useKeyboardEvents } from "@/hooks/useKeyboardEvents";
import { useScreen } from "@/hooks/useScreen";
import { t } from "@/lang/i18n";
import { fileContent } from "@/services/apis/fileManager";
import { reportErrorMsg } from "@/tools/validator";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { computed, ref } from "vue";

const emit = defineEmits(["save"]);

const open = ref(false);
const openEditor = ref(false);
const editorText = ref("");
const fileName = ref("");
const path = ref("");
const fullScreen = ref(false);

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
  fullScreen.value = isPhone.value;
  path.value = _path;
  fileName.value = _fileName;
  open.value = true;
  initKeydownListener();
  return new Promise(async (_resolve, _reject) => {
    await render();
    resolve = _resolve;
    reject = _reject;
  });
};

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
    :wrap-class-name="fullScreen ? 'full-modal' : ''"
    :cancel-text="t('TXT_CODE_3b1cc020')"
    :ok-text="t('TXT_CODE_abfe9512')"
    :mask-closable="false"
    :width="fullScreen ? '100%' : '1600px'"
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
      :height="fullScreen ? '100%' : '60vh'"
    />
    <a-skeleton v-else :paragraph="{ rows: 12 }" active />
  </a-modal>
</template>

<style lang="scss">
.full-modal {
  .ant-modal-close {
    top: 10px;
  }
  .ant-modal {
    max-width: 100%;
    top: 0;
    padding-bottom: 0;
    margin: 0 !important;
  }
  .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: 100svh;
    padding: 5px;
  }
  .ant-modal-body {
    flex: 1;
    overflow: hidden;
  }
}
</style>
