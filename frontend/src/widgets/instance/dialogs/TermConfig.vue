<script setup lang="ts">
import { ref, computed, reactive, watch } from "vue";
import { t } from "@/lang/i18n";
import { useScreen } from "@/hooks/useScreen";
import type { InstanceDetail } from "@/types";
import { updateTermConfig } from "@/services/apis/instance";
import { message } from "ant-design-vue";
import { TERMINAL_CODE } from "@/types/const";
const props = defineProps<{
  instanceInfo: InstanceDetail | undefined;
  instanceId: string | undefined;
  daemonId: string | undefined;
}>();
let options = reactive<InstanceDetail>(props.instanceInfo!);

const screen = useScreen();
const isPhone = computed(() => screen.isPhone.value);
const open = ref(false);
const openDialog = () => {
  open.value = true;
};

const { execute, isLoading } = updateTermConfig();

const submit = async () => {
  try {
    await execute({
      params: {
        uuid: props.instanceId!,
        remote_uuid: props.daemonId!
      },
      data: {
        terminalOption: {
          haveColor: options.config.terminalOption.haveColor,
          pty: options.config.terminalOption.pty
        },
        crlf: options.config.crlf,
        ie: options.config.ie,
        oe: options.config.oe,
        stopCommand: options.config.stopCommand
      }
    });
    open.value = false;
    return message.success(t("TXT_CODE_d3de39b4"));
  } catch (err: any) {
    return message.error(err.message);
  }
};

watch(open, async () => {
  options = props.instanceInfo!;
});

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    width="auto"
    :title="t('终端设置')"
    :confirm-loading="isLoading"
    :ok-text="t('保存')"
    @ok="submit"
  >
    <a-form layout="vertical">
      <a-row :gutter="20">
        <a-col :xs="24" :md="12" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("仿真终端") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{
                  t("通过仿真终端转发程序来获得终端完全交互能力。\n包括使用 Tab，Ctrl 功能键等。")
                }}
                <br />
                {{ t("如果使用有问题，建议关闭。") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-switch v-model:checked="options.config.terminalOption.pty" />
          </a-form-item>

          <a-form-item>
            <a-typography-title :level="5">{{ t("网页颜色渲染") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("网页自动给输出内容增加颜色渲染，渲染的颜色不一定完全正确。") }}
                <br />
                {{ t("如果颜色渲染功能与软件自带的颜色功能冲突，可以关闭此功能。") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-switch v-model:checked="options.config.terminalOption.haveColor" />
          </a-form-item>

          <a-form-item>
            <a-typography-title :level="5">{{ t("命令执行回车符") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("如果您输入命令按回车没有反应，可以尝试调整此选项。") }}
                <br />
                {{ t("Windows 平台下一般是“回车换行符”，Linux/MacOS 平台下一般是“换行符”。") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-select
              v-model:value="options.config.crlf"
              :placeholder="t('请选择')"
              :style="'width: ' + (isPhone ? '100%' : '220px')"
            >
              <a-select-option :value="1"> {{ t("换行符（\\n）") }}</a-select-option>
              <a-select-option :value="2">{{ t("回车换行符（\\r\\n）") }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="12" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("关闭实例命令") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("当点击“关闭实例”按钮时，会立刻执行此命令，^C 代表 Ctrl+C 信号。") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input
              v-model:value="options.config.stopCommand"
              :style="'width: ' + (isPhone ? '100%' : '220px')"
            />
          </a-form-item>

          <a-form-item>
            <a-typography-title :level="5">{{ t("输入输出编码") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("如果控制台中的内容出现乱码，您可以尝试修改此编码解决问题。") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-select
              v-model:value="options.config.ie"
              class="mr-10 mb-20"
              :placeholder="t('终端输入编码')"
              :style="'width: ' + (isPhone ? '100%' : '220px')"
            >
              <a-select-option v-for="item in TERMINAL_CODE" :key="item" :value="item">
              </a-select-option>
            </a-select>
            <a-select
              v-model:value="options.config.oe"
              :placeholder="t('终端输出编码')"
              :style="'width: ' + (isPhone ? '100%' : '220px')"
            >
              <a-select-option v-for="item in TERMINAL_CODE" :key="item" :value="item">
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>
