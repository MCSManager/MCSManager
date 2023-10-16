<script setup lang="ts">
import { ref } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
import SelectInstances from "@/components/SelectInstances.vue";
import type { UserInstance } from "@/types";

const emit = defineEmits(["selectedInstances"]);

const open = ref(false);
const openDialog = () => {
  open.value = true;
};
const selectedItems = ref<UserInstance[]>([]);

const submit = async () => {
  try {
    emit("selectedInstances", selectedItems.value);
    selectedItems.value.splice(0, selectedItems.value.length);
    open.value = false;
    return;
  } catch (err: any) {
    return message.error(err.message);
  }
};

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    :mask-closable="false"
    :title="t('请选择实例')"
    :ok-text="t('保存')"
    @ok="submit"
  >
    <a-typography-paragraph>
      <a-typography-text type="secondary">
        {{ t("利用远程主机地址与模糊查询来为此用户增加应用实例") }}
      </a-typography-text>
    </a-typography-paragraph>
    <SelectInstances
      @callback="
        (items: UserInstance[]) => {
          selectedItems = items;
        }
      "
    />
  </a-modal>
</template>
