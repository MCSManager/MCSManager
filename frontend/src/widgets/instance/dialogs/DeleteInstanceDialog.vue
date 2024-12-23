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

const onDelete = async () => {
  if (!deleteFiles.value) return await submit();
  Modal.confirm({
    title: t("TXT_CODE_584d786d"),
    content: t("TXT_CODE_90508729"),
    okText: t("TXT_CODE_10088738"),
    onOk: async () => {
      await submit();
      Modal.destroyAll();
    },
    okType: "danger"
  });
};
</script>

<template>
  <a-modal :visible="isOpen" :title="t('TXT_CODE_a0e19f38')" @cancel="onCancel">
    <a-typography-paragraph>
      <a-typography-text>
        {{ t("TXT_CODE_1981470a") }}
      </a-typography-text>
    </a-typography-paragraph>

    <a-checkbox v-model:checked="deleteFiles">
      {{ t("TXT_CODE_7542201a") }}
    </a-checkbox>

    <template #footer>
      <a-button key="back" @click="onCancel">
        {{ t("TXT_CODE_a0451c97") }}
      </a-button>
      <a-button
        key="submit"
        :danger="deleteFiles"
        :loading="submitBtnLoading"
        type="primary"
        @click="onDelete"
      >
        {{ deleteFiles ? t("TXT_CODE_584d786d") : t("TXT_CODE_a0e19f38") }}
      </a-button>
    </template>
  </a-modal>
</template>
