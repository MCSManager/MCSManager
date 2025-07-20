<script setup lang="ts">
import LeftMenusPanel from "@/components/LeftMenusPanel.vue";
import { SUPPORTED_LANGS, isCN, t } from "@/lang/i18n";
import type { LayoutCard, Settings } from "@/types";
import { onMounted, ref } from "vue";
import { Modal, message, notification } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import {
  BankOutlined,
  BookOutlined,
  BugOutlined,
  GithubOutlined,
  KeyOutlined,
  LockOutlined,
  MessageOutlined,
  MoneyCollectOutlined,
  PicLeftOutlined,
  ProjectOutlined,
  QuestionCircleOutlined
} from "@ant-design/icons-vue";

import { settingInfo, setSettingInfo } from "@/services/apis";
import Loading from "@/components/Loading.vue";
import { useUploadFileDialog } from "@/components/fc";
import { useLayoutConfigStore } from "../stores/useLayoutConfig";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { arrayFilter } from "../tools/array";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";

defineProps<{
  card: LayoutCard;
}>();

const { execute, isReady } = settingInfo();
const { execute: submitExecute, isLoading: submitIsLoading } = setSettingInfo();
const { getSettingsConfig, setSettingsConfig } = useLayoutConfigStore();
const { setBackgroundImage } = useAppConfigStore();
const { changeDesignMode, containerState } = useLayoutContainerStore();

interface MySettings extends Settings {
  bgUrl?: string;
}

const ApacheLicense = `Copyright ${new Date().getFullYear()} MCSManager Dev

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`;

const formData = ref<MySettings>();

const submit = async (needReload: boolean = true) => {
  if (formData.value) {
    try {
      await submitExecute({
        data: {
          ...formData.value
        }
      });
      message.success(t("TXT_CODE_a7907771"));
      if (needReload) setTimeout(() => window.location.reload(), 600);
    } catch (error: any) {
      reportErrorMsg(error);
    }
  }
};

const menus = arrayFilter([
  {
    title: t("TXT_CODE_cdd555be"),
    key: "baseInfo",
    icon: ProjectOutlined
  },
  {
    title: t("TXT_CODE_1c18acc0"),
    key: "ui",
    icon: PicLeftOutlined
  },
  {
    title: t("TXT_CODE_9c3ca8f"),
    key: "security",
    icon: LockOutlined
  },
  {
    title: t("TXT_CODE_8bb8e2a1"),
    key: "business",
    icon: KeyOutlined,
    condition: () => isCN()
  },
  {
    title: t("TXT_CODE_3b4b656d"),
    key: "about",
    icon: QuestionCircleOutlined
  },
  {
    title: t("TXT_CODE_46cb40d5"),
    key: "sponsor",
    icon: MoneyCollectOutlined,
    click: () => {
      let url = "https://www.patreon.com/mcsmanager";
      if (isCN()) url = "https://afdian.com/a/mcsmanager";
      window.open(url, "_blank");
    }
  }
]);

// DO NOT I18N
const allLanguages = SUPPORTED_LANGS;

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

const totpDriftOptions = ref([
  {
    label: t("TXT_CODE_718c9310"),
    value: 0
  },
  {
    label: "30 s",
    value: 1
  },
  {
    label: "60 s",
    value: 2
  }
]);

const aboutLinks = arrayFilter([
  {
    title: "GitHub",
    icon: GithubOutlined,
    url: "https://github.com/MCSManager/MCSManager"
  },
  {
    title: "Discord",
    icon: MessageOutlined,
    url: "https://discord.gg/BNpYMVX7Cd"
  }
]);

const contacts = arrayFilter([
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
    icon: BugOutlined,
    url: "https://github.com/MCSManager/MCSManager/issues"
  }
]);

const uploadBackground = async () => {
  const body = document.querySelector("body");
  if (formData.value && body) {
    const url = await useUploadFileDialog();
    if (url) {
      formData.value.bgUrl = url;
      setBackgroundImage(url);
    }
  }
};

const handleSaveBgUrl = async (url?: string) => {
  Modal.confirm({
    title: t("TXT_CODE_c0606ef4"),
    content: t("TXT_CODE_cf95364f"),
    async onOk() {
      const cfg = await getSettingsConfig();
      if (!cfg?.theme) {
        return reportErrorMsg(t("TXT_CODE_b89780e2"));
      }
      cfg.theme.backgroundImage = url ?? formData.value?.bgUrl ?? "";
      await setSettingsConfig(cfg);
    }
  });
};

const startDesignUI = async () => {
  changeDesignMode(true);
  notification.warning({
    placement: "bottom",
    type: "warning",
    message: t("TXT_CODE_7b1adf35"),
    description: t("TXT_CODE_6b6f1d3")
  });
};

const gotoBusinessCenter = () => {
  window.open("https://redeem.mcsmanager.com/", "_blank");
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

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_b2767aa2") }}</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("TXT_CODE_b1f833f3") }}
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.presetPackAddr"
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
                {{ t("TXT_CODE_1c18acc0") }}
              </a-typography-title>
              <div style="text-align: left">
                <a-form :model="formData" layout="vertical">
                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_ebd2a6a1") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        <div>
                          {{ t("TXT_CODE_ba717ff3") }}
                        </div>
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-button
                      v-if="!containerState.isDesignMode"
                      type="default"
                      :loading="submitIsLoading"
                      @click="startDesignUI()"
                    >
                      {{ t("TXT_CODE_bc46c15b") }}
                    </a-button>
                    <p v-if="containerState.isDesignMode">
                      {{ t("TXT_CODE_3b24a247") }}
                    </p>
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

                  <div class="button mb-24">
                    <a-button type="primary" :loading="submitIsLoading" @click="submit()">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                  </div>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_8ae0dc90") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        <div>
                          {{ t("TXT_CODE_434786c9") }}
                        </div>
                        <div>
                          {{ t("TXT_CODE_cf95364f") }}
                        </div>
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-typography-paragraph>
                      <div class="flex">
                        <a-input
                          v-model:value="formData.bgUrl"
                          style="max-width: 320px"
                          :placeholder="t('TXT_CODE_4ea93630')"
                        />
                        <a-button class="ml-6" @click="() => uploadBackground()">
                          {{ t("TXT_CODE_ae09d79d") }}
                        </a-button>
                      </div>
                    </a-typography-paragraph>
                    <a-button type="primary" class="mr-6" @click="handleSaveBgUrl()">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                    <a-button danger @click="handleSaveBgUrl('')">
                      {{ t("TXT_CODE_50d471b2") }}
                    </a-button>
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
                      {{ t("TXT_CODE_a583cae4") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_bfbdf579") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select
                      v-model:value.prop="(formData as any).allowChangeCmd"
                      style="max-width: 320px"
                    >
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
                      {{ t("TXT_CODE_adab942e") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_ceb783a9") }}
                        <br />
                        {{ t("TXT_CODE_e5b7522d") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select
                      v-model:value.prop="(formData as any).canFileManager"
                      style="max-width: 320px"
                    >
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
                      {{ t("TXT_CODE_a5f01916") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_f5f9664") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select
                      v-model:value.prop="(formData as any).allowUsePreset"
                      style="max-width: 320px"
                    >
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

                    <a-select
                      v-model:value.prop="(formData as any).crossDomain"
                      style="max-width: 320px"
                    >
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
                      {{ t("TXT_CODE_f0789d81") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_ae575e12") }}
                      </a-typography-text>
                    </a-typography-paragraph>

                    <a-select
                      v-model:value.prop="(formData as any).reverseProxyMode"
                      style="max-width: 320px"
                    >
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

                    <a-select
                      v-model:value.prop="(formData as any).loginCheckIp"
                      style="max-width: 320px"
                    >
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
                      {{ t("TXT_CODE_b026be33") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_a77b1a21") }}
                      </a-typography-text>
                    </a-typography-paragraph>

                    <a-select
                      v-model:value="formData.totpDriftToleranceSteps"
                      style="max-width: 320px"
                    >
                      <a-select-option
                        v-for="item in totpDriftOptions"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <div class="button">
                    <a-button type="primary" :loading="submitIsLoading" @click="submit(false)">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                  </div>
                </a-form>
              </div>
            </div>
          </template>

          <template #business>
            <div
              :style="{
                maxHeight: card.height,
                overflowY: 'auto'
              }"
            >
              <a-typography-title :level="4" class="mb-24">
                {{ t("TXT_CODE_8bb8e2a1") }}
              </a-typography-title>
              <div class="mb-24">
                <a-typography-paragraph>
                  <a-typography-title :level="5">
                    {{ t("TXT_CODE_180884da") }}
                  </a-typography-title>
                  <a-typography-text type="secondary">
                    {{ t("TXT_CODE_3f227bcf") }}
                  </a-typography-text>
                </a-typography-paragraph>
                <div>
                  <a-switch v-model:checked="formData.businessMode" @change="submit(false)" />
                </div>
              </div>
              <div class="mb-24">
                <a-typography-paragraph>
                  <a-typography-title :level="5">
                    {{ t("TXT_CODE_d31196db") }}
                  </a-typography-title>
                  <a-typography-text type="secondary">
                    {{ t("TXT_CODE_59c39e03") }}
                  </a-typography-text>
                </a-typography-paragraph>
                <div>
                  <a-button :disabled="!formData.businessMode" @click="gotoBusinessCenter()">
                    {{ t("TXT_CODE_2dbd3cd3") }}
                  </a-button>
                </div>
              </div>
              <div v-if="formData.businessMode" class="mb-24">
                <a-typography-paragraph>
                  <a-typography-title :level="5">{{ t("TXT_CODE_72cfab69") }}</a-typography-title>
                  <a-typography-text type="secondary">
                    {{ t("TXT_CODE_678164d7") }}
                  </a-typography-text>
                </a-typography-paragraph>
                <div>
                  <a-input
                    v-model:value="formData.businessId"
                    style="max-width: 200px"
                    placeholder="eg: 123"
                  />
                </div>
              </div>
              <div>
                <a-button type="primary" :loading="submitIsLoading" @click="submit(false)">
                  {{ t("TXT_CODE_abfe9512") }}
                </a-button>
              </div>
            </div>
          </template>

          <template #about>
            <div :style="{ maxHeight: card.height, overflowY: 'auto' }">
              <a-typography-title :level="4" class="mb-24">
                {{ t("TXT_CODE_3b4b656d") }}
              </a-typography-title>
              <a-typography-paragraph>
                <p>
                  {{ $t("TXT_CODE_d0c670df") }}
                </p>
              </a-typography-paragraph>
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
                  {{ $t("TXT_CODE_97433ac4") }}
                </p>
              </a-typography-paragraph>
              <div class="pb-4 flex">
                <div v-for="item in contacts" :key="item.url" class="mr-12 mb-12">
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
                  {{ $t("TXT_CODE_e57bd50f") }}
                </p>
                <pre style="font-size: 13px">{{ ApacheLicense }}</pre>
              </a-typography-paragraph>
            </div>
          </template>

          <template #sponsor>
            <div :style="{ maxHeight: card.height, overflowY: 'auto' }">
              <a-typography-title :level="4" class="mb-24">
                {{ t("TXT_CODE_46cb40d5") }}
              </a-typography-title>
              <a-typography-paragraph>
                <p>
                  {{ $t("TXT_CODE_d0c670df") }}
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
