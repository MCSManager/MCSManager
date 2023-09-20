<script setup lang="ts">
import { ref } from "vue";
import { t } from "@/lang/i18n";
import type { InstanceDetail } from "@/types";
import { updateInstanceConfig } from "@/services/apis/instance";
import { message } from "ant-design-vue";
const props = defineProps<{
  instanceInfo?: InstanceDetail;
  instanceId?: string;
  daemonId?: string;
}>();
const emit = defineEmits(["update"]);
let options = ref<InstanceDetail>()!;

const open = ref(false);
const openDialog = () => {
  open.value = true;
  options.value = props.instanceInfo;
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
        eventTask: options.value?.config.eventTask
      }
    });
    emit("update");
    open.value = false;
    return message.success(t("TXT_CODE_d3de39b4"));
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
    :title="t('事件触发型任务')"
    :confirm-loading="isLoading"
    :ok-text="t('保存')"
    @ok="submit"
  >
    <a-form v-if="options" layout="vertical">
      <a-form-item>
        <a-typography-title :level="5">{{ t("自动重启") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("若实例状态在未经面板操作的情况下变为非运行状态将立刻发起启动实例操作。") }}
            <br />
            {{ t("可用于崩溃后自动重启功能。") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-switch v-model:checked="options.config.eventTask.autoRestart" />
      </a-form-item>

      <a-form-item>
        <a-typography-title :level="5">{{ t("自动启动") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("只要远程节点（远程节点）运行，就自动发起一次启动实例操作。") }}
            <br />
            {{ t("如果将远程节点开机自启则可用于开机自启实例。") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-switch v-model:checked="options.config.eventTask.autoStart" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
