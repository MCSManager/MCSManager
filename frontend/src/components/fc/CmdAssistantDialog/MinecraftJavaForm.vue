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
    <a-form-item name="jarName" :label="t('服务端软件文件名')" required="true">
      <a-input
        v-model:value="form.jarName"
        :placeholder="t('一般为 .jar 文件，列如 paper.jar 等')"
      />
    </a-form-item>
    <a-row gutter="24">
      <a-col :span="12">
        <a-form-item name="maxMemory" :label="t('最大内存')">
          <a-input v-model:value="form.maxMemory" :placeholder="t('选填，-Xmx 参数，如：1024M')" />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item name="minMemory" :label="t('初始内存')">
          <a-input v-model:value="form.minMemory" :placeholder="t('选填，-Xms 参数，如：1024M')" />
        </a-form-item>
      </a-col>

      <a-col :span="24">
        <a-form-item name="javaPath" :label="t('Java 路径')">
          <a-input
            v-model:value="form.javaPath"
            :placeholder="t('选填，请输入 Java 绝对路径，不填默认取环境变量')"
          />
        </a-form-item>
      </a-col>

      <a-col :span="24">
        <a-form-item name="additional" :label="t('附加参数')">
          <a-input v-model:value="form.additional" :placeholder="t('选填，在 -jar 之前的参数')" />
        </a-form-item>
      </a-col>

      <a-col :span="24">
        <a-form-item name="suffix" :label="t('后缀参数')">
          <a-input
            v-model:value="form.suffix"
            :placeholder="t('选填，Java 程序之后的附加参数，如 -nogui 等，多个参数用空格分隔')"
          />
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
</template>
