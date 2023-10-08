<script setup lang="ts">
import { ref } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
const emit = defineEmits(["selectCode"]);

const open = ref(false);
const openDialog = () => {
  open.value = true;
};

const zipCode = ref<string>();

const submit = async () => {
  try {
    if (!zipCode.value) throw new Error(t("请选择解压编码"));
    emit("selectCode", zipCode.value);
    open.value = false;
    return message.success(t("设置成功"));
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
    :title="t('选择解压编码')"
    :ok-text="t('保存')"
    @ok="submit"
  >
    <a-typography-paragraph>
      <a-typography-text type="secondary">
        {{ t("在解压/压缩文件时发现文件名存在乱码现象时，可以修改此选项解决。") }}
        <br />
        {{ t("如果压缩包来源是中国大陆，一般可选 GBK;") }}
        <br />
        {{ t("如果是来自台湾，香港地区，可以选择BIG5，如果来自其他地区可以选择 UTF-8。") }}
      </a-typography-text>
    </a-typography-paragraph>
    <a-select
      v-model:value="zipCode"
      :placeholder="t('请选择')"
      :dropdown-match-select-width="false"
    >
      <a-select-option value="utf-8">{{ t("面板/Linux（UTF8）") }}</a-select-option>
      <a-select-option value="gbk">{{ t("简体中文（GBK）") }}</a-select-option>
      <a-select-option value="big5">{{ t("繁体中文（BIG5）") }}</a-select-option>
    </a-select>
  </a-modal>
</template>
