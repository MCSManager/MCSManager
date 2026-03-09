<script lang="ts" setup>
import { ref } from "vue";
import { t } from "@/lang/i18n";

interface FormDataType {
  javaPath: string;
  jarName: string;
  maxMemory: string;
  minMemory: string;
  suffix: string;
  additional: string;
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
    <a-form-item name="jarName" :label="t('TXT_CODE_58508fb7')" required>
      <a-input v-model:value="form.jarName" :placeholder="t('TXT_CODE_84f760fa')" />
    </a-form-item>
    <a-row :gutter="[24, 24]">
      <a-col :span="12">
        <a-form-item name="maxMemory" :label="t('TXT_CODE_dd238854')">
          <a-input v-model:value="form.maxMemory" :placeholder="t('TXT_CODE_d7fa3be3')" />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item name="minMemory" :label="t('TXT_CODE_e050b3be')">
          <a-input v-model:value="form.minMemory" :placeholder="t('TXT_CODE_57c1b0a3')" />
        </a-form-item>
      </a-col>

      <a-col :span="24">
        <a-form-item name="javaPath" :label="t('TXT_CODE_43422ed3')">
          <a-input v-model:value="form.javaPath" :placeholder="t('TXT_CODE_7f9b6758')" />
        </a-form-item>
      </a-col>

      <a-col :span="24">
        <a-form-item name="additional" :label="t('TXT_CODE_4efba567')">
          <a-input v-model:value="form.additional" :placeholder="t('TXT_CODE_f79563ef')" />
        </a-form-item>
      </a-col>

      <a-col :span="24">
        <a-form-item name="suffix" :label="t('TXT_CODE_85770d4a')">
          <a-input v-model:value="form.suffix" :placeholder="t('TXT_CODE_6e3da823')" />
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
</template>
