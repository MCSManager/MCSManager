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
    <a-form-item name="softwarePath" :label="t('TXT_CODE_c7b1b8d0')" required>
      <a-input v-model:value="form.softwarePath" :placeholder="t('TXT_CODE_a2a0e054')" />
    </a-form-item>
    <a-form-item name="params" :label="t('TXT_CODE_b9442311')">
      <a-input v-model:value="form.params" :placeholder="t('TXT_CODE_2a379a13')" />
      <div class="mt-6">
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_d705a2bd") }}
        </a-typography-text>
      </div>
    </a-form-item>
  </a-form>
</template>
