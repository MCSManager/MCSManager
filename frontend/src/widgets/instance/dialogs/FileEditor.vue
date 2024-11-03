<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "@/lang/i18n";
import { Modal, message } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import { fileContent } from "@/services/apis/fileManager";
import { useScreen } from "@/hooks/useScreen";
import { FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons-vue";
import AceEditor from "@/components/AceEditor.vue";

const emit = defineEmits(["save"]);

const open = ref(false);
const openEditor = ref(false);
const editorText = ref("");
const fileName = ref("");
const path = ref("");
const editorComponent = ref<InstanceType<typeof AceEditor>>();

const { isPhone } = useScreen();

// eslint-disable-next-line no-unused-vars
let resolve: (t: string) => void;
// eslint-disable-next-line no-unused-vars
let reject: (e: Error) => void;

const props = defineProps<{
  daemonId: string;
  instanceId: string;
}>();

const openDialog = (_path: string, _fileName: string) => {
  open.value = true;
  path.value = _path;
  fileName.value = _fileName;
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

const submit = async (options?: {
  fromHotkey?: boolean;
  needClose?: boolean;
  getText?: boolean;
}) => {
  try {
    const { fromHotkey, needClose, getText } = options || {};
    if (getText) editorComponent.value?.updateText();
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
    message.success(fromHotkey ? t("TXT_CODE_8f47d95") : t("TXT_CODE_a7907771"));
    if (needClose) {
      cancel();
      resolve(editorText.value);
    }
    emit("save");
  } catch (err: any) {
    console.error(err.message);
    reject(err);
    return reportErrorMsg(err.message);
  }
};

const beforeCancel = () => {
  if (editorComponent.value?.isEditing)
    Modal.confirm({
      title: t("TXT_CODE_617ce69c"),
      content: t("TXT_CODE_2c0700cb"),
      onOk: () => cancel()
    });
  else cancel();
};

const cancel = async () => {
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
    :mask-closable="false"
    :width="fullScreen ? '100%' : '1300px'"
    :closable="false"
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
    <AceEditor
      v-if="openEditor"
      ref="editorComponent"
      v-model:text="editorText"
      :filename="fileName"
      height="80svh"
      @save-file="submit"
    />
    <a-skeleton v-else :paragraph="{ rows: 12 }" active />
    <template #footer>
      <a-button @click="beforeCancel"> {{ t("TXT_CODE_3b1cc020") }}</a-button>
      <a-button
        type="primary"
        :loading="isLoading"
        @click="submit({ needClose: true, getText: true })"
      >
        {{ t("TXT_CODE_abfe9512") }}
      </a-button>
    </template>
  </a-modal>
</template>
