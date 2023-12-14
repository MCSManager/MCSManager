<script setup lang="ts">
import { ref } from "vue";
import type { MountComponent } from "@/types";
import ActionButton from "@/components/ActionButton.vue";
import { t } from "@/lang/i18n";
import { BuildFilled, DropboxSquareFilled, SwitcherFilled } from "@ant-design/icons-vue";
import { QUICKSTART_ACTION_TYPE } from "@/hooks/widgets/quickStartFlow";
import FadeUpAnimation from "@/components/FadeUpAnimation.vue";
import { useStartCmdBuilder } from "../../hooks/useGenerateStartCmd";
import { message } from "ant-design-vue";
import {
  TYPE_MINECRAFT_BEDROCK,
  TYPE_MINECRAFT_JAVA,
  TYPE_STEAM_SERVER_UNIVERSAL,
  TYPE_UNIVERSAL
} from "@/hooks/useInstance";

const { minecraftJava, buildCmd, setGameType } = useStartCmdBuilder();

enum STEP {
  SELECT_TYPE = "A",
  SELECT_SOFTWARE = "B"
}

const props = defineProps<MountComponent>();
const open = ref(true);
const activeKey = ref<string>();
const step = ref<STEP>(STEP.SELECT_TYPE);
const gameType = ref<QUICKSTART_ACTION_TYPE>();
const formRef = ref();

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent();
};

const submit = async () => {
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
    title: t("任何二进制控制台程序"),
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
        <a-tabs v-model:activeKey="activeKey">
          <a-tab-pane :key="TYPE_MINECRAFT_JAVA" :tab="t('Java 版 Minecraft 服务器')">
            <a-form ref="formRef" layout="vertical" :model="minecraftJava">
              <a-form-item name="jarName" :label="t('服务端软件文件名')" required="true">
                <a-input
                  v-model:value="minecraftJava.jarName"
                  :placeholder="t('一般为 .jar 文件，列如 paper.jar 等')"
                />
              </a-form-item>

              <a-row gutter="24">
                <a-col :span="12">
                  <a-form-item name="maxMemory" :label="t('最大内存')">
                    <a-input
                      v-model:value="minecraftJava.maxMemory"
                      :placeholder="t('选填，-Xmx 参数，如：1024M')"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item name="minMemory" :label="t('初始内存')">
                    <a-input
                      v-model:value="minecraftJava.minMemory"
                      :placeholder="t('选填，-Xms 参数，如：1024M')"
                    />
                  </a-form-item>
                </a-col>

                <a-col :span="24">
                  <a-form-item name="javaPath" :label="t('Java 路径')">
                    <a-input
                      v-model:value="minecraftJava.javaPath"
                      :placeholder="t('选填，请输入 Java 绝对路径，不填默认取环境变量')"
                    />
                  </a-form-item>
                </a-col>

                <a-col :span="24">
                  <a-form-item name="additional" :label="t('附加参数')">
                    <a-input
                      v-model:value="minecraftJava.additional"
                      :placeholder="t('选填，在 -jar 之前的参数')"
                    />
                  </a-form-item>
                </a-col>

                <a-col :span="24">
                  <a-form-item name="suffix" :label="t('后缀参数')">
                    <a-input
                      v-model:value="minecraftJava.suffix"
                      :placeholder="
                        t('选填，Java 程序之后的附加参数，如 -nogui 等，多个参数用空格分隔')
                      "
                    />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-form>
          </a-tab-pane>
          <a-tab-pane :key="TYPE_MINECRAFT_BEDROCK" :tab="t('基岩版 Minecraft 服务器')">
            B
          </a-tab-pane>
        </a-tabs>
      </div>
      <div v-else-if="gameType === QUICKSTART_ACTION_TYPE.SteamGameServer">
        <a-tabs v-model:activeKey="activeKey">
          <a-tab-pane :key="TYPE_STEAM_SERVER_UNIVERSAL" :tab="t('全部类型')">C</a-tab-pane>
        </a-tabs>
      </div>
      <div v-else-if="gameType != null">
        <a-tabs v-model:activeKey="activeKey">
          <a-tab-pane :key="TYPE_UNIVERSAL" :tab="t('全部类型')">D</a-tab-pane>
        </a-tabs>
      </div>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped></style>
