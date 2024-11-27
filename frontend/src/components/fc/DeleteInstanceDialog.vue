<script setup lang="ts">
import { ref } from "vue";
import { t } from "@/lang/i18n";
import { Modal } from "ant-design-vue";

const props = defineProps<{
  // eslint-disable-next-line no-unused-vars
  emitResult: (deleteFiles: boolean | null) => void;
  destroyComponent: () => void;
}>();

const deleteFiles = ref(false);
const isOpen = ref(true);

const submit = (deleteFile: boolean | null = deleteFiles.value) => {
  isOpen.value = false;
  props.emitResult(deleteFile);
  props.destroyComponent();
};

const onCancel = () => {
  submit(null);
};

const onDelete = () => {
  if (!deleteFiles.value) return submit();
  Modal.confirm({
    title: t("删除实例及相关文件"),
    content: t("该操作会直接删除实例所在的整个目录，且文件无法恢复，是否继续？"),
    okText: t("确认删除"),
    onOk: () => {
      Modal.destroyAll();
      submit();
    },
    okType: "danger"
  });
};
</script>

<template>
  <a-modal :visible="isOpen" :title="t('删除实例')" @cancel="onCancel">
    <a-typography-paragraph>
      <a-typography-text>
        {{ t("若选择同时删除实例相关文件，则会直接删除实例所在的整个目录。") }}
      </a-typography-text>
    </a-typography-paragraph>

    <a-checkbox v-model:checked="deleteFiles">
      {{ t("同时删除实例相关文件") }}
    </a-checkbox>

    <template #footer>
      <a-button key="back" @click="onCancel">
        {{ t("取消") }}
      </a-button>
      <a-button key="submit" :danger="deleteFiles" type="primary" @click="onDelete">
        {{ deleteFiles ? t("删除实例及相关文件") : t("删除实例") }}
      </a-button>
    </template>
  </a-modal>
</template>
