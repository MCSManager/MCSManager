<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
import Editor from "@/components/Editor.vue";

const open = ref(false);
const text = ref("");
const fileName = ref("");

const openDialog = (path: string) => {
  open.value = true;
  text.value = "你好世界\n123";
  fileName.value = path;
};

const submit = async () => {
  try {
    open.value = false;
    return message.success(t("更新成功"));
  } catch (err: any) {
    return message.error(err.message);
  }
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
    :ok-text="t('保存')"
    width="1000px"
    @ok="submit"
  >
    RT:{{ text }}
    <Editor v-if="open" v-model:text="text" height="600px" />
  </a-modal>
</template>
