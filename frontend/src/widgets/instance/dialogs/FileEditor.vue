<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
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
const daemonId = String(route.query["daemonId"]) ?? "";
const instanceId = String(route.query["instanceId"]) ?? "";

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
        remote_uuid: daemonId,
        uuid: instanceId
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
        remote_uuid: daemonId,
        uuid: instanceId
      },
      data: {
        target: path.value,
        text: editorText.value
      }
    });
    return message.success(t("保存成功"));
  } catch (err: any) {
    console.error(err.message);
    return message.error(err.message);
  }
};

const cancel = () => {
  open.value = openEditor.value = false;
};

const dialogTitle = computed(() => {
  return `${t("编辑文件")} ${fileName.value}`;
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
    :title="dialogTitle"
    width="1000px"
    :footer="null"
    @cancel="cancel()"
  >
    <a-space warp>
      <a-button @click="submit">保存</a-button>
    </a-space>
    <Editor v-if="openEditor" ref="EditorComponent" v-model:text="editorText" height="70vh" />
    <a-skeleton v-else active />
  </a-modal>
</template>
