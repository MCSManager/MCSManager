<script setup lang="ts">
import { ref } from "vue";
import type { MountComponent } from "@/types";
import ActionButton from "@/components/ActionButton.vue";
import { t } from "@/lang/i18n";
import { router } from "@/config/router";
import { BuildFilled, DropboxSquareFilled, SwitcherFilled } from "@ant-design/icons-vue";
import { QUICKSTART_ACTION_TYPE } from "@/hooks/widgets/quickStartFlow";
import FadeUpAnimation from "@/components/FadeUpAnimation.vue";

enum STEP {
  SELECT_TYPE = "A",
  SELECT_SOFTWARE = "B"
}

const props = defineProps<MountComponent>();
const open = ref(true);
const activeKey = ref(1);
const step = ref<STEP>(STEP.SELECT_TYPE);
const appType = ref<QUICKSTART_ACTION_TYPE>();

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent();
};

const submit = async () => {
  if (props.emitResult) props.emitResult("");
  await cancel();
};

const handleNext = () => {
  if (step.value === STEP.SELECT_TYPE) {
    step.value = STEP.SELECT_SOFTWARE;
  }
};

const actions = [
  {
    icon: BuildFilled,
    title: t("Minecraft 游戏服务器"),
    click: () => {
      appType.value = QUICKSTART_ACTION_TYPE.Minecraft;
      handleNext();
    }
  },
  {
    icon: SwitcherFilled,
    title: t("Steam 游戏服务器"),
    click: () => {
      appType.value = QUICKSTART_ACTION_TYPE.SteamGameServer;
      handleNext();
    }
  },
  {
    icon: DropboxSquareFilled,
    title: t("任何二进制控制台程序"),
    click: () => {
      appType.value = QUICKSTART_ACTION_TYPE.AnyApp;
      handleNext();
    }
  }
];
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    :mask-closable="false"
    :title="t('命令助手')"
    :ok-text="t('确定')"
    :cancel-text="t('TXT_CODE_a0451c97')"
    :ok-button-props="{ disabled: step !== STEP.SELECT_SOFTWARE }"
    @ok="submit"
    @cancel="cancel"
  >
    <div>
      <div v-if="step === STEP.SELECT_TYPE">
        <a-row :gutter="[0, 12]">
          <a-typography-text>
            {{ t("请选择你的服务器程序类别") }}
          </a-typography-text>
          <fade-up-animation>
            <action-button
              v-for="(action, index) in actions"
              :key="action.title"
              :title="action.title"
              :click="actions[index].click"
              :icon="action.icon"
              :data-index="index"
            />
          </fade-up-animation>
        </a-row>
      </div>
      <div v-if="appType === QUICKSTART_ACTION_TYPE.Minecraft">
        <a-tabs v-model:activeKey="activeKey">
          <a-tab-pane :key="1" :tab="t('Java 版 Minecraft 服务器')">A</a-tab-pane>
          <a-tab-pane :key="2" :tab="t('基岩版 Minecraft 服务器')">B</a-tab-pane>
        </a-tabs>
      </div>
      <div v-else-if="appType === QUICKSTART_ACTION_TYPE.SteamGameServer">
        <a-tabs v-model:activeKey="activeKey">
          <a-tab-pane :key="1" :tab="t('全部类型')">C</a-tab-pane>
        </a-tabs>
      </div>
      <div v-else-if="appType != null">
        <a-tabs v-model:activeKey="activeKey">
          <a-tab-pane :key="1" :tab="t('全部类型')">D</a-tab-pane>
        </a-tabs>
      </div>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped></style>
