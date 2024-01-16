<script setup lang="ts">
import LeftMenusPanel from "@/components/LeftMenusPanel.vue";
import { getCurrentLang, isCN, t } from "@/lang/i18n";
import type { LayoutCard, Settings } from "@/types";
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import { reportError } from "@/tools/validator";
import {
  BankOutlined,
  BookOutlined,
  GithubOutlined,
  LockOutlined,
  PicLeftOutlined,
  ProjectOutlined,
  QuestionCircleOutlined
} from "@ant-design/icons-vue";

import { settingInfo, setSettingInfo } from "@/services/apis";
import Loading from "@/components/Loading.vue";
import { computed } from "vue";
import { useUploadFileDialog } from "@/components/fc";
import { useLayoutConfigStore } from "../stores/useLayoutConfig";

defineProps<{
  card: LayoutCard;
}>();

const { execute, isReady } = settingInfo();
const { execute: submitExecute, isLoading: submitIsLoading } = setSettingInfo();
const { getSettingsConfig, setSettingsConfig } = useLayoutConfigStore();

interface MySettings extends Settings {
  bgUrl?: string;
}

const formData = ref<MySettings>();

const submit = async () => {
  if (formData.value) {
    try {
      await submitExecute({
        data: {
          ...formData.value
        }
      });
      message.success(t("TXT_CODE_a7907771"));
      setTimeout(() => window.location.reload(), 600);
    } catch (error: any) {
      reportError(error);
    }
  }
};

const menus = [
  {
    title: t("TXT_CODE_cdd555be"),
    key: "baseInfo",
    icon: ProjectOutlined
  },
  {
    title: t("外观设置"),
    key: "ui",
    icon: PicLeftOutlined
  },
  {
    title: t("TXT_CODE_9c3ca8f"),
    key: "security",
    icon: LockOutlined
  },
  {
    title: t("TXT_CODE_3b4b656d"),
    key: "about",
    icon: QuestionCircleOutlined
  }
];

// DO NOT I18N
const allLanguages = [
  {
    label: "中文",
    value: "zh_cn"
  },
  {
    label: "English",
    value: "en_us"
  }
];

const allYesNo = [
  {
    label: t("TXT_CODE_52c8a730"),
    value: true
  },
  {
    label: t("TXT_CODE_718c9310"),
    value: false
  }
];

const aboutLinks = [
  {
    title: "GitHub",
    icon: GithubOutlined,
    url: "https://github.com/MCSManager/MCSManager"
  },
  {
    title: t("TXT_CODE_41dd4d19"),
    icon: BankOutlined,
    url: "https://mcsmanager.com/"
  },
  {
    title: t("TXT_CODE_74c3d3e5"),
    icon: BookOutlined,
    url: "https://docs.mcsmanager.com/"
  },
  {
    title: t("TXT_CODE_26407d1f"),
    icon: BookOutlined,
    url: "https://github.com/MCSManager/MCSManager/issues"
  }
];

const isZhCN = computed(() => {
  return getCurrentLang().toLowerCase() === "zh_cn";
});

const uploadBackground = async () => {
  if (formData.value) formData.value.bgUrl = await useUploadFileDialog();
};

const handleSaveBgUrl = async (url?: string) => {
  const cfg = await getSettingsConfig();
  if (!cfg?.theme) {
    return reportError(t("配置文件版本不正确，无法设置背景图，请尝试重启面板或重置自定义布局！"));
  }
  cfg.theme.backgroundImage = url ?? formData.value?.bgUrl ?? "";
  await setSettingsConfig(cfg);
};

onMounted(async () => {
  const res = await execute();
  const cfg = await getSettingsConfig();
  formData.value = res.value!;
  if (cfg?.theme?.backgroundImage) {
    formData.value.bgUrl = cfg.theme.backgroundImage;
  }
});
</script>

<template>
  <div>
    <CardPanel v-if="isReady && formData" class="CardWrapper" style="height: 100%" :padding="false">
      <template #body>
        <LeftMenusPanel :menus="menus">
          <template #baseInfo>
            <div :style="{ maxHeight: card.height, overflowY: 'auto' }">
              <a-typography-title :level="4" class="mb-24">
                {{ t("TXT_CODE_5206cf41") }}
              </a-typography-title>
              <div style="text-align: left">
                <a-form :model="formData" layout="vertical">
                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_a1a59b08") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_2abeb185") }}
                        <br />
                        {{ t("TXT_CODE_d648ff91") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select v-model:value="formData.language" style="max-width: 320px">
                      <a-select-option
                        v-for="item in allLanguages"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_7f0017d2") }}</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("TXT_CODE_233624ad") }}
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.httpPort"
                      style="max-width: 320px"
                      :placeholder="t('TXT_CODE_4ea93630')"
                    />
                  </a-form-item>

                  <a-form-item v-if="isCN()">
                    <a-typography-title :level="5">{{ t("TXT_CODE_b2767aa2") }}</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("TXT_CODE_b1f833f3") }}
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.quickInstallAddr"
                      :placeholder="t('TXT_CODE_4ea93630')"
                    />
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_514e064a") }}</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("TXT_CODE_328191e") }}
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.httpIp"
                      style="max-width: 320px"
                      :placeholder="t('TXT_CODE_4ea93630')"
                    />
                  </a-form-item>

                  <div class="button">
                    <a-button type="primary" :loading="submitIsLoading" @click="submit()">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                  </div>
                </a-form>
              </div>
            </div>
          </template>

          <template #ui>
            <div :style="{ maxHeight: card.height, overflowY: 'auto' }">
              <a-typography-title :level="4" class="mb-24">
                {{ t("外观设置") }}
              </a-typography-title>
              <div style="text-align: left">
                <a-form :model="formData" layout="vertical">
                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_b5b33dd4") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_c26e5fb7") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-textarea
                      v-model:value="formData.loginInfo"
                      :rows="4"
                      :placeholder="t('TXT_CODE_4ea93630')"
                    />
                  </a-form-item>

                  <div class="button mb-24">
                    <a-button type="primary" :loading="submitIsLoading" @click="submit()">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                  </div>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("界面背景图片") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{
                          t(
                            "上传背景图片后，面板将设置深色主题且模糊半透明，你可以随时再切换回来。"
                          )
                        }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-typography-paragraph>
                      <div class="flex">
                        <a-input
                          v-model:value="formData.bgUrl"
                          style="max-width: 320px"
                          :placeholder="t('TXT_CODE_4ea93630')"
                        />
                        <a-button class="ml-6" @click="() => uploadBackground()">上传</a-button>
                      </div>
                    </a-typography-paragraph>
                    <a-button type="primary" class="mr-6" @click="handleSaveBgUrl()">保存</a-button>
                    <a-button danger @click="handleSaveBgUrl('')">重置</a-button>
                  </a-form-item>
                </a-form>
              </div>
            </div>
          </template>

          <template #security>
            <div :style="{ maxHeight: card.height, overflowY: 'auto' }">
              <a-typography-title :level="4" class="mb-24">
                {{ t("TXT_CODE_9c3ca8f") }}
              </a-typography-title>
              <div style="text-align: left">
                <a-form :model="formData" layout="vertical">
                  <a-typography-title :level="5">
                    {{ t("TXT_CODE_ef0ce2e") }}
                  </a-typography-title>
                  <a-typography-paragraph>
                    <a-typography-text type="secondary">
                      {{ t("TXT_CODE_fcde7b2e") }}
                      <br />
                      {{ t("TXT_CODE_af19b7b5") }}
                    </a-typography-text>
                  </a-typography-paragraph>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_adab942e") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_ceb783a9") }}
                        <br />
                        {{ t("TXT_CODE_e5b7522d") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select v-model:value.prop="formData.canFileManager" style="max-width: 320px">
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_405cd346") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_6655c905") }}
                      </a-typography-text>
                    </a-typography-paragraph>

                    <a-select v-model:value.prop="formData.crossDomain" style="max-width: 320px">
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_1d67c9c6") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_745fc959") }}
                      </a-typography-text>
                    </a-typography-paragraph>

                    <a-select v-model:value.prop="formData.loginCheckIp" style="max-width: 320px">
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                  <div class="button">
                    <a-button type="primary" :loading="submitIsLoading" @click="submit()">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                  </div>
                </a-form>
              </div>
            </div>
          </template>

          <template #about>
            <div :style="{ maxHeight: card.height, overflowY: 'auto' }">
              <a-typography-title :level="4" class="mb-24">
                {{ t("TXT_CODE_3b4b656d") }}
              </a-typography-title>
              <div class="pb-4 flex">
                <div v-for="item in aboutLinks" :key="item.url" class="mr-12 mb-12">
                  <a :href="item.url" target="_blank">
                    <a-button>
                      <component :is="item.icon" />
                      {{ item.title }}
                    </a-button>
                  </a>
                </div>
              </div>
              <a-typography-paragraph>
                <p>
                  {{ $t("TXT_CODE_d0c670df") }}
                </p>
                <p v-if="isZhCN">
                  <span>
                    {{ $t("TXT_CODE_d2c79249") }}
                    <a href="https://github.com/MCSManager/MCSManager" target="_blank">
                      {{ t("TXT_CODE_e4794d20") }}
                    </a>
                  </span>
                </p>
              </a-typography-paragraph>
            </div>
          </template>
        </LeftMenusPanel>
      </template>
    </CardPanel>
    <div v-if="!isReady" class="loading flex-center w-100 h-100">
      <Loading></Loading>
    </div>
  </div>
</template>

<style lang="scss" scoped>
div {
  position: relative;
  .loading {
    position: absolute;
    top: 0;
    left: 0;
  }
}
</style>
