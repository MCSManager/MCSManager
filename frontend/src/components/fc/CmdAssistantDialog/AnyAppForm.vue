<script lang="ts" setup>
import { ref } from "vue";
import { t } from "@/lang/i18n";

interface FormDataType {
  softwarePath: string;
  params: string;
}

const props = defineProps<{
  data: FormDataType;
}>();

const formRef = ref();
const form = ref<FormDataType>(props.data);

const validate = async () => {
  return await formRef.value.validate();
};

defineExpose({ validate });
</script>

<template>
  <a-form ref="formRef" layout="vertical" :model="form">
    <a-form-item name="softwarePath" :label="t('需要启动的程序')" required>
      <a-input
        v-model:value="form.softwarePath"
        :placeholder="t('列如：server.exe，app.exe，或使用绝对路径等')"
      />
    </a-form-item>
    <a-form-item name="params" :label="t('额外参数')">
      <a-input
        v-model:value="form.params"
        :placeholder="t('选填，根据你的启动程序按需填写，如：-server -XXX -ZZZ 等')"
      />
      <div class="mt-6">
        <a-typography-text type="secondary">
          {{ t("额外参数会自动拼接到软件路径的末尾。") }}
        </a-typography-text>
      </div>
    </a-form-item>
  </a-form>
</template>
