<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { t } from "@/lang/i18n";
import type { InstanceDetail } from "@/types";
import { updateInstanceConfig } from "@/services/apis/instance";
import { message } from "ant-design-vue";
const props = defineProps<{
  instanceInfo: InstanceDetail | undefined;
  instanceId: string | undefined;
  daemonId: string | undefined;
}>();
let options = reactive<InstanceDetail>(props.instanceInfo!);

const open = ref(false);
const openDialog = () => {
  open.value = true;
};

const { execute, isLoading } = updateInstanceConfig();

const submit = async () => {
  try {
    await execute({
      params: {
        uuid: props.instanceId ?? "",
        remote_uuid: props.daemonId ?? ""
      },
      data: {
        pingConfig: {
          ...options.config.pingConfig
        }
      }
    });
    open.value = false;
    return message.success(t("TXT_CODE_d3de39b4"));
  } catch (err: any) {
    return message.error(err.message);
  }
};

watch(open, async () => {
  options = props.instanceInfo ?? <InstanceDetail>{};
});

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    :title="t('实例状态查询协议配置')"
    :confirm-loading="isLoading"
    :ok-text="t('保存')"
    @ok="submit"
  >
    <a-form layout="vertical">
      <a-form-item>
        <a-typography-title :level="5">{{ t("更好的监控服务端状态") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{
              t(
                "此功能将根据管理员设置的实例类型自动选择相应协议，获取服务端进程的具体信息和参数（如：游戏人数，版本等）"
              )
            }}
          </a-typography-text>
        </a-typography-paragraph>
      </a-form-item>

      <a-form-item>
        <a-typography-title :level="5">{{ t("服务端访问地址") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("必填，支持域名与 IP 地址，不填写则不会查询服务端信息，人数，版本等。") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="options.config.pingConfig.ip" />
      </a-form-item>

      <a-form-item>
        <a-typography-title :level="5">{{ t("服务端访问端口") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("必填，仅可输入数字端口号") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="options.config.pingConfig.port" type="number" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
