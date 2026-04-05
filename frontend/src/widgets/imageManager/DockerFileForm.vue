<script setup lang="ts">
import { reactive, onMounted } from "vue";
import { t } from "@/lang/i18n";
import { notification } from "ant-design-vue";
import { imageList } from "@/services/apis/envImage";
import { reportErrorMsg } from "@/tools/validator";

const props = defineProps<{
  dockerFile: string;
  name: string;
  version: string;
  daemonId: string;
}>();

const emit = defineEmits(["close"]);

const options = reactive({
  dockerFile: "",
  name: "",
  version: ""
});

const { execute } = imageList();
const submit = async () => {
  try {
    if (!options.dockerFile || !options.name || !options.version)
      return reportErrorMsg(t("TXT_CODE_2764f197"));
    await execute({
      params: {
        daemonId: props.daemonId
      },
      data: {
        dockerFile: options.dockerFile,
        name: options.name,
        tag: options.version
      },
      method: "POST"
    });
    notification["info"]({
      message: t("TXT_CODE_55edf44d"),
      description: t("TXT_CODE_b340c04a")
    });
    emit("close");
  } catch (err: any) {
    console.error(err.message);
    return reportErrorMsg(err.message);
  }
};

onMounted(() => {
  options.dockerFile = props.dockerFile;
  options.name = props.name;
  options.version = props.version;
});
</script>

<template>
  <a-typography>
    <a-typography-paragraph>
      <a-typography-title :level="5">{{ t("TXT_CODE_868df02c") }}</a-typography-title>
      <a-typography-text>
        {{ t("TXT_CODE_77d93d7d") }}
      </a-typography-text>
    </a-typography-paragraph>
    <a-typography-paragraph>
      <a-typography-title :level="5">{{ t("TXT_CODE_ef0ce2e") }}</a-typography-title>
      <a-typography-text>
        {{ t("TXT_CODE_5024d817") }}
      </a-typography-text>
    </a-typography-paragraph>
  </a-typography>

  <a-form-item>
    <a-textarea v-model:value="options.dockerFile" :rows="8" />
  </a-form-item>

  <a-form-item>
    <a-typography-text>
      {{ t("TXT_CODE_7cf078e8") }}
    </a-typography-text>
    <a-input-group compact>
      <a-input v-model:value="options.name" style="width: 65%" />
      <a-input v-model:value="options.version" style="width: 35%" />
    </a-input-group>
  </a-form-item>

  <a-popconfirm :title="t('TXT_CODE_4e4b52a0')" @confirm="submit">
    <a-button type="primary">{{ t("TXT_CODE_3d09f0ac") }}</a-button>
  </a-popconfirm>
</template>
