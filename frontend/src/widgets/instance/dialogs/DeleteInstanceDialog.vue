<script setup lang="ts">
import { ref } from "vue";
import { t } from "@/lang/i18n";
import { Modal } from "ant-design-vue";

import { batchDelete } from "@/services/apis/instance";
import { reportErrorMsg } from "@/tools/validator";

const props = defineProps<{
  // eslint-disable-next-line no-unused-vars
  emitResult: (ok: boolean) => void;
  destroyComponent: () => void;
  instanceId: string;
  daemonId: string;
}>();

const deleteFiles = ref(false);
const isOpen = ref(true);
const submitBtnLoading = ref(false);

const submit = async (deleteFile: boolean | null = deleteFiles.value) => {
  const { execute } = batchDelete();
  submitBtnLoading.value = true;
  try {
    await execute({
      params: {
        daemonId: props.daemonId || ""
      },
      data: {
        uuids: [props.instanceId || ""],
        deleteFile: deleteFile || false
      }
    });
    props.emitResult(true);
  } catch (error) {
    reportErrorMsg(error);
    props.emitResult(false);
  }
  isOpen.value = false;
  props.destroyComponent();
};

const onCancel = () => {
  isOpen.value = false;
  props.emitResult(false);
  props.destroyComponent();
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
      <a-button
        key="submit"
        :danger="deleteFiles"
        :loading="submitBtnLoading"
        type="primary"
        @click="onDelete"
      >
        {{ deleteFiles ? t("删除实例及相关文件") : t("删除实例") }}
      </a-button>
    </template>
  </a-modal>
</template>
