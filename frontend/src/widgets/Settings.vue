<script setup lang="ts">
import LeftMenusPanel from "@/components/LeftMenusPanel.vue";
import { getCurrentLang, t } from "@/lang/i18n";
import type { LayoutCard, Settings } from "@/types";
import { onMounted, ref, h } from "vue";
import { message } from "ant-design-vue";
import {
  BankOutlined,
  BookOutlined,
  CodepenOutlined,
  GithubOutlined,
  LockOutlined,
  ProjectOutlined,
  QuestionCircleOutlined
} from "@ant-design/icons-vue";

import { settingInfo, setSettingInfo } from "@/services/apis";
import Loading from "@/components/Loading.vue";
import { computed } from "vue";

defineProps<{
  card: LayoutCard;
}>();

const { execute, isReady } = settingInfo();
const { execute: submitExecute, isLoading: submitIsLoading } = setSettingInfo();

const formData = ref<Settings>();

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
      message.error(error);
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
    title: t("TXT_CODE_9c3ca8f"),
    key: "api",
    icon: LockOutlined
  },
  {
    title: t("TXT_CODE_3b4b656d"),
    key: "password",
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

onMounted(async () => {
  const res = await execute();
  formData.value = res.value!;
});
</script>

<template>
  <div>
    <CardPanel v-if="isReady && formData" class="CardWrapper" style="height: 100%" :padding="false">
      <template #body>
        <LeftMenusPanel :menus="menus">
          <template #baseInfo>
            <div style="max-height: 500px; overflow-y: auto">
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

                  <a-form-item>
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

          <template #api>
            <div style="max-height: 500px; overflow-y: auto">
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
                    <a-select v-model:value="formData.canFileManager" style="max-width: 320px">
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
                    <a-select v-model:value="formData.crossDomain" style="max-width: 320px">
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
                    <a-select v-model:value="formData.loginCheckIp" style="max-width: 320px">
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

          <template #password>
            <div style="max-height: 500px; overflow-y: auto">
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
