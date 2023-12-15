<script setup lang="ts">
import { ref } from "vue";
import type { MountComponent } from "@/types";
import ActionButton from "@/components/ActionButton.vue";
import { t } from "@/lang/i18n";
import { BuildFilled, DropboxSquareFilled, SwitcherFilled } from "@ant-design/icons-vue";
import { QUICKSTART_ACTION_TYPE } from "@/hooks/widgets/quickStartFlow";
import FadeUpAnimation from "@/components/FadeUpAnimation.vue";
import { useStartCmdBuilder } from "@/hooks/useGenerateStartCmd";
import { message } from "ant-design-vue";
import {
  TYPE_MINECRAFT_BEDROCK,
  TYPE_MINECRAFT_JAVA,
  TYPE_STEAM_SERVER_UNIVERSAL,
  TYPE_UNIVERSAL
} from "@/hooks/useInstance";
import AnyAppFormComponent from "./AnyAppForm.vue";
import MinecraftJavaForm from "./MinecraftJavaForm.vue";
import type { Component } from "vue";

const { minecraftJava, buildCmd, setGameType, gameType, appType, anyAppForm } =
  useStartCmdBuilder();

enum STEP {
  SELECT_TYPE = "A",
  SELECT_SOFTWARE = "B"
}

const props = defineProps<MountComponent>();
const open = ref(true);
const step = ref<STEP>(STEP.SELECT_TYPE);
const formRef = ref();

const tabFormComponent: Record<string, { component: Component; title: string; form: any }> = {
  [TYPE_MINECRAFT_JAVA]: {
    component: MinecraftJavaForm,
    title: t("Java 版 Minecraft 服务器"),
    form: minecraftJava
  },
  [TYPE_MINECRAFT_BEDROCK]: {
    component: AnyAppFormComponent,
    title: t("Bedrock 版 Minecraft 服务器"),
    form: anyAppForm
  },
  [TYPE_STEAM_SERVER_UNIVERSAL]: {
    component: AnyAppFormComponent,
    title: t("Steam 游戏服务器"),
    form: anyAppForm
  },
  [TYPE_UNIVERSAL]: {
    component: AnyAppFormComponent,
    title: t("任何程序"),
    form: anyAppForm
  }
};

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent();
};

const submit = async () => {
  console.log("formRef:", formRef.value);
  try {
    await formRef.value.validate();
  } catch (error) {
    return message.warning(t("请完善表单中的必填项！"));
  }
  const command = buildCmd();

  if (props.emitResult) props.emitResult(command);
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
      setGameType(QUICKSTART_ACTION_TYPE.Minecraft);
      handleNext();
    }
  },
  {
    icon: SwitcherFilled,
    title: t("Steam 游戏服务器"),
    click: () => {
      setGameType(QUICKSTART_ACTION_TYPE.SteamGameServer);
      handleNext();
    }
  },
  {
    icon: DropboxSquareFilled,
    title: t("任何控制台程序"),
    click: () => {
      setGameType(QUICKSTART_ACTION_TYPE.AnyApp);
      handleNext();
    }
  }
];
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    width="800px"
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
      <div v-if="gameType === QUICKSTART_ACTION_TYPE.Minecraft">
        <a-tabs v-model:activeKey="appType">
          <a-tab-pane
            v-for="typeName in [TYPE_MINECRAFT_JAVA, TYPE_MINECRAFT_BEDROCK]"
            :key="typeName"
            :tab="tabFormComponent[typeName].title"
          />
        </a-tabs>
      </div>
      <div v-else-if="gameType === QUICKSTART_ACTION_TYPE.SteamGameServer">
        <a-tabs v-model:activeKey="appType">
          <a-tab-pane :key="TYPE_STEAM_SERVER_UNIVERSAL" :tab="t('Steam 游戏服务器')"> </a-tab-pane>
        </a-tabs>
      </div>
      <div v-else-if="gameType != null">
        <a-tabs v-model:activeKey="appType">
          <a-tab-pane :key="TYPE_UNIVERSAL" :tab="t('全部类型')">D</a-tab-pane>
        </a-tabs>
      </div>
      <component
        :is="tabFormComponent[appType].component"
        v-if="appType && tabFormComponent[appType]?.component"
        ref="formRef"
        v-model:data="tabFormComponent[appType].form"
      />
    </div>
  </a-modal>
</template>

<style lang="scss" scoped></style>
