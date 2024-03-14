<script setup lang="ts">
import { ref } from "vue";
import type { MountComponent } from "@/types";
import ActionButton from "@/components/ActionButton.vue";
import { t } from "@/lang/i18n";
import { BuildFilled, DropboxSquareFilled, SwitcherFilled } from "@ant-design/icons-vue";
import { QUICKSTART_ACTION_TYPE } from "@/hooks/widgets/quickStartFlow";
import FadeUpAnimation from "@/components/FadeUpAnimation.vue";
import { useStartCmdBuilder } from "@/hooks/useGenerateStartCmd";
import { reportErrorMsg } from "@/tools/validator";
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
    title: t("TXT_CODE_95583336"),
    form: minecraftJava
  },
  [TYPE_MINECRAFT_BEDROCK]: {
    component: AnyAppFormComponent,
    title: t("TXT_CODE_28116f29"),
    form: anyAppForm
  },
  [TYPE_STEAM_SERVER_UNIVERSAL]: {
    component: AnyAppFormComponent,
    title: t("TXT_CODE_dd8d27ce"),
    form: anyAppForm
  },
  [TYPE_UNIVERSAL]: {
    component: AnyAppFormComponent,
    title: t("TXT_CODE_10693964"),
    form: anyAppForm
  }
};

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent();
};

const submit = async () => {
  try {
    await formRef.value.validate();
  } catch (error: any) {
    return reportErrorMsg(t("TXT_CODE_d6c5a7f8"));
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
    title: t("TXT_CODE_f2deb1d0"),
    click: () => {
      setGameType(QUICKSTART_ACTION_TYPE.Minecraft);
      handleNext();
    }
  },
  {
    icon: SwitcherFilled,
    title: t("TXT_CODE_dd8d27ce"),
    click: () => {
      setGameType(QUICKSTART_ACTION_TYPE.SteamGameServer);
      handleNext();
    }
  },
  {
    icon: DropboxSquareFilled,
    title: t("TXT_CODE_4600deb7"),
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
    :title="t('TXT_CODE_2728d0d4')"
    :ok-text="t('TXT_CODE_d507abff')"
    :cancel-text="t('TXT_CODE_a0451c97')"
    :ok-button-props="{ disabled: step !== STEP.SELECT_SOFTWARE }"
    @ok="submit"
    @cancel="cancel"
  >
    <div>
      <div v-if="step === STEP.SELECT_TYPE">
        <a-row :gutter="[0, 12]">
          <a-typography-text>
            {{ t("TXT_CODE_18df7f10") }}
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
          <a-tab-pane :key="TYPE_STEAM_SERVER_UNIVERSAL" :tab="t('TXT_CODE_dd8d27ce')">
          </a-tab-pane>
        </a-tabs>
      </div>
      <div v-else-if="gameType != null">
        <a-tabs v-model:activeKey="appType">
          <a-tab-pane :key="TYPE_UNIVERSAL" :tab="t('TXT_CODE_feab659d')"></a-tab-pane>
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
