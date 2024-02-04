<script setup lang="ts">
import { ref, reactive } from "vue";
import { t } from "@/lang/i18n";
import type { InstanceDetail } from "@/types";
import { updateInstanceConfig } from "@/services/apis/instance";
import { message, type FormInstance } from "ant-design-vue";
import { reportError } from "@/tools/validator";

const formRef = ref<FormInstance>();

const props = defineProps<{
  instanceInfo?: InstanceDetail;
  instanceId?: string;
  daemonId?: string;
}>();

const emit = defineEmits(["update"]);
const formData = reactive({
  rconIp: "",
  rconPassword: "",
  rconPort: "",
  enableRcon: false
});

const open = ref(false);
const openDialog = () => {
  open.value = true;
  formData.rconIp = props.instanceInfo?.config?.rconIp ?? "";
  formData.rconPassword = props.instanceInfo?.config?.rconPassword ?? "";
  formData.rconPort = String(props.instanceInfo?.config?.rconPort || "");
  formData.enableRcon = props.instanceInfo?.config?.enableRcon ?? false;
};

const { execute, isLoading } = updateInstanceConfig();

const submit = async () => {
  try {
    await formRef.value?.validateFields();
    await execute({
      params: {
        uuid: props.instanceId ?? "",
        daemonId: props.daemonId ?? ""
      },
      data: {
        rconIp: formData.rconIp,
        rconPassword: formData.rconPassword,
        rconPort: Number(formData.rconPort || 0),
        enableRcon: formData.enableRcon
      }
    });
    emit("update");
    open.value = false;
    return message.success(t("TXT_CODE_d3de39b4"));
  } catch (err: any) {
    return reportError(err.message);
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
    :title="t('Steam Rcon 协议设置')"
    :confirm-loading="isLoading"
    :ok-text="t('TXT_CODE_abfe9512')"
    @ok="submit"
  >
    <div>
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{
            t(
              "大部分 Steam 游戏服务器都需要 RCON 协议来支持命令的执行，同时也支持 Minecraft 游戏服务器，如果你在运行 Steam 游戏服务器时发现自带的控制台无法执行命令，可以尝试配置 RCON 协议来支持命令执行。"
            )
          }}
        </a-typography-text>
      </a-typography-paragraph>
      <a-form ref="formRef" :model="formData" layout="vertical">
        <a-form-item>
          <a-typography-title :level="5">{{ t("启用 Rcon 协议") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{
                t(
                  "一旦启用 Rcon 协议，那么接下来在控制台处输入的所有命令都将以 RCON 的方式发送，不再兼容原本的控制台程序。"
                )
              }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-switch v-model:checked="formData.enableRcon" />
        </a-form-item>

        <a-form-item name="rconIp">
          <a-typography-title :level="5">{{ t("游戏服务器 IP") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("请输入游戏服务器IP地址，不填写则默认为守护进程本地主机（localhost）") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input
            v-model:value="formData.rconIp"
            :placeholder="t('不填写则自动使用 localhost 本地主机地址')"
          />
        </a-form-item>
        <a-form-item name="rconPort">
          <a-typography-title :level="5">{{ t("RCON 端口") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("请输入游戏服务器 RCON 协议端口，这通常在配置文件存在相关内容。") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input v-model:value="formData.rconPort" :placeholder="t('列如：25565')" />
        </a-form-item>
        <a-form-item name="rconPassword">
          <a-typography-title :level="5">{{ t("RCON 密码") }}</a-typography-title>
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("请输入游戏服务器 RCON 协议访问密码，这通常在配置文件存在相关内容。") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input v-model:value="formData.rconPassword" :placeholder="t('RCON 访问密码')" />
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>
