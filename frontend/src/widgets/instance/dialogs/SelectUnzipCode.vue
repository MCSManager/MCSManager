<script setup lang="ts">
import { ref } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";

const emit = defineEmits(["selectCode"]);
const open = ref(false);
const openDialog = () => {
  open.value = true;
};

const zipCode = ref<string>();

const submit = async () => {
  try {
    if (!zipCode.value) throw new Error(t("TXT_CODE_97ceb743"));
    emit("selectCode", zipCode.value);
    open.value = false;
    return message.success(t("TXT_CODE_f07610ed"));
  } catch (err: any) {
    return reportErrorMsg(err.message);
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
    :title="t('TXT_CODE_2dc23f7a')"
    :ok-text="t('TXT_CODE_abfe9512')"
    @ok="submit"
  >
    <a-typography-paragraph>
      <a-typography-text type="secondary">
        {{ t("TXT_CODE_b278707d") }}
        <br />
        {{ t("TXT_CODE_48044fc2") }}
        <br />
        {{ t("TXT_CODE_76a82338") }}
      </a-typography-text>
    </a-typography-paragraph>
    <a-select
      v-model:value="zipCode"
      :placeholder="t('TXT_CODE_3bb646e4')"
      :dropdown-match-select-width="false"
    >
      <a-select-option value="utf-8">{{ t("TXT_CODE_91bb6101") }}</a-select-option>
      <a-select-option value="gbk">{{ t("TXT_CODE_4d6b06f0") }}</a-select-option>
      <a-select-option value="big5">{{ t("TXT_CODE_c4dfdb26") }}</a-select-option>
    </a-select>
  </a-modal>
</template>
