<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { t } from "@/lang/i18n";
import { message, notification } from "ant-design-vue";
import { imageList } from "@/services/apis/envImage";

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
      return message.error(t("请填写表单完整"));
    await execute({
      params: {
        remote_uuid: props.daemonId
      },
      data: {
        dockerFile: options.dockerFile,
        name: options.name,
        tag: options.version
      },
      method: "POST"
    });
    notification["info"]({
      message: t("创建镜像任务已经开始"),
      description: t("请耐心等待")
    });
    emit("close");
  } catch (err: any) {
    console.error(err.message);
    return message.error(err.message);
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
      <a-typography-title :level="5">{{ t("关于 DockerFile 文件") }}</a-typography-title>
      <a-typography-text>
        {{ t("官方参考文档：https://docs.docker.com/engine/reference/builder/") }}
      </a-typography-text>
    </a-typography-paragraph>
    <a-typography-paragraph>
      <a-typography-title :level="5">{{ t("注意事项") }}</a-typography-title>
      <a-typography-text>
        {{ t("必须创建 /workspace 目录，此目录将自动挂载到实例的文件根目录") }}
      </a-typography-text>
    </a-typography-paragraph>
  </a-typography>

  <a-form-item>
    <a-textarea v-model:value="options.dockerFile" placeholder="必填，请输入内容" :rows="8" />
  </a-form-item>

  <a-form-item>
    <a-typography-text>
      {{ t("创建后的镜像名与版本标识") }}
    </a-typography-text>
    <a-input-group compact>
      <a-input v-model:value="options.name" style="width: 65%" />
      <a-input v-model:value="options.version" style="width: 35%" />
    </a-input-group>
  </a-form-item>

  <a-popconfirm
    :title="t('此构建过程可能需要几分钟时间，请确保网络畅通，是否继续？')"
    @confirm="submit"
  >
    <a-button type="primary">{{ t("创建镜像") }}</a-button>
  </a-popconfirm>
</template>
