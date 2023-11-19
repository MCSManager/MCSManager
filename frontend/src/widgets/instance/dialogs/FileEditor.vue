<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
import Editor from "@/components/Editor.vue";
import { fileContent } from "@/services/apis/fileManager";
import { useRoute } from "vue-router";

const route = useRoute();
const open = ref(false);
const openEditor = ref(false);
const editorText = ref("");
const fileName = ref("");
const path = ref("");
// const daemonId = String(route.query["daemonId"]) ?? "";
// const instanceId = String(route.query["instanceId"]) ?? "";

const props = defineProps<{
  daemonId: string;
  instanceId: string;
}>();

const openDialog = async (path_: string, fileName_: string) => {
  open.value = true;
  path.value = path_;
  fileName.value = fileName_;
  await render();
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
    return message.error(err.message);
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
  } catch (err: any) {
    console.error(err.message);
    return message.error(err.message);
  }
};

const cancel = () => {
  open.value = openEditor.value = false;
};

const dialogTitle = computed(() => {
  return `${t("TXT_CODE_b0dc1f17")} ${fileName.value}`;
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
    width="1000px"
    @ok="submit()"
    @cancel="cancel()"
  >
    <Editor
      v-if="openEditor"
      ref="EditorComponent"
      v-model:text="editorText"
      :filename="fileName"
      height="70vh"
    />
    <a-skeleton v-else :paragraph="{ rows: 12 }" active />
  </a-modal>
</template>
