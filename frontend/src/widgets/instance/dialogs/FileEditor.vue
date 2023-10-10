<script setup lang="ts">
import { onMounted, ref } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
const emit = defineEmits([""]);

const open = ref(false);
const openDialog = () => {
  open.value = true;
};

const editor = ref();

const submit = async () => {
  try {
    emit("");
    open.value = false;
    return message.success(t("更新成功"));
  } catch (err: any) {
    return message.error(err.message);
  }
};

defineExpose({
  openDialog
});

onMounted(() => {});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    :mask-closable="false"
    :title="t('编辑文件')"
    :ok-text="t('保存')"
    @ok="submit"
  >
    <div ref="editor"></div>
  </a-modal>
</template>
