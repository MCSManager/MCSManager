<script setup lang="ts">
import { getProPanelUrl } from "@/components/IframeBox/config";
import IframeBox from "@/components/IframeBox/index.vue";
import LeftMenusPanel from "@/components/LeftMenusPanel.vue";
import Loading from "@/components/Loading.vue";
import { useUploadFileDialog } from "@/components/fc";
import { router } from "@/config/router";
import { SUPPORTED_LANGS, isCN, t } from "@/lang/i18n";
import { setSettingInfo, settingInfo } from "@/services/apis";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { reportErrorMsg } from "@/tools/validator";
import type { LayoutCard, Settings } from "@/types";
import {
  BankOutlined,
  BookOutlined,
  BugOutlined,
  EditOutlined,
  GithubOutlined,
  LockOutlined,
  MessageOutlined,
  MoneyCollectOutlined,
  PicLeftOutlined,
  PlusOutlined,
  ProjectOutlined,
  QuestionCircleOutlined
} from "@ant-design/icons-vue";
import { Modal, message, notification } from "ant-design-vue";
import { onMounted, onUnmounted, ref } from "vue";
import { useLayoutConfigStore } from "../stores/useLayoutConfig";
import { arrayFilter } from "../tools/array";

defineProps<{
  card: LayoutCard;
}>();

const { execute, isReady } = settingInfo();
const { execute: submitExecute, isLoading: submitIsLoading } = setSettingInfo();
const { getSettingsConfig, setSettingsConfig } = useLayoutConfigStore();
const { setLogoImage, setBackgroundImage } = useAppConfigStore();
const { changeDesignMode, containerState } = useLayoutContainerStore();

interface MySettings extends Settings {
  logoUrl?: string;
  bgUrl?: string;
  proLicenseKey?: string;
}

const ApacheLicense = `Copyright ${new Date().getFullYear()} MCSManager

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
  // {
  //   title: t("TXT_CODE_574ed474"),
  //   key: "pro",
  //   icon: SketchOutlined,
  //   condition: () => isCN()
  // },
  // {
  //   title: t("TXT_CODE_caf8ebb7"),
  //   key: "redeem",
  //   icon: KeyOutlined,
  //   condition: () => isCN()
  // },
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
    title: t("TXT_CODE_46cb40d5"),
    key: "sponsor",
    icon: MoneyCollectOutlined,
    condition: () => !isCN(),
    click: () => {
      let url = "https://www.patreon.com/mcsmanager";
      if (isCN()) url = "https://afdian.com/a/mcsmanager";
      window.open(url, "_blank");
    }
  },
  {
    title: t("TXT_CODE_3b4b656d"),
    key: "about",
    icon: QuestionCircleOutlined
  }
]);

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

const uploadLogo = async () => {
  const body = document.querySelector("body");
  if (formData.value && body) {
    const url = await useUploadFileDialog();
    if (url) {
      formData.value.logoUrl = url;
      setLogoImage(url);
    }
  }
};

const handleSaveLogoUrl = async (url?: string) => {
  Modal.confirm({
    title: t("TXT_CODE_dc053043"),
    content: t("TXT_CODE_cf95364f"),
    async onOk() {
      const cfg = await getSettingsConfig();
      if (!cfg?.theme) {
        return reportErrorMsg(t("TXT_CODE_b89780e2"));
      }
      cfg.theme.logoImage = url ?? formData.value?.logoUrl ?? "";
      await setSettingsConfig(cfg);
    }
  });
};

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

const leftMenusPanelRef = ref<InstanceType<typeof LeftMenusPanel>>();

const toTemplate = {
  path: "/market/editor",
  new: () =>
    router.push({
      path: toTemplate.path,
      query: {
        newTemplate: "true"
      }
    }),
  edit: () =>
    router.push({
      path: toTemplate.path,
      query: {}
    })
};

onMounted(async () => {
  const res = await execute();
  const cfg = await getSettingsConfig();
  formData.value = res.value!;
  if (cfg?.theme?.logoImage) {
    formData.value.logoUrl = cfg.theme.logoImage;
  }
  if (cfg?.theme?.backgroundImage) {
    formData.value.bgUrl = cfg.theme.backgroundImage;
  }
  setTimeout(() => {
    if (router.currentRoute.value.query.tab === "pro") {
      leftMenusPanelRef.value?.setActiveKey("pro");
    }
  }, 100);
});

onUnmounted(() => {
  const route = router.currentRoute.value;
  router.replace({
    query: {
      ...route.query,
      tab: undefined
    }
  });
});
</script>

<template>
  <div>
    <CardPanel v-if="isReady && formData" class="CardWrapper" style="height: 100%" :padding="false">
      <template #body>
        <LeftMenusPanel ref="leftMenusPanelRef" :menus="menus">
          <template #baseInfo>
            <div class="content-box" :style="{ maxHeight: card.height }">
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
                    <a-typography-title :level="5">{{ t("TXT_CODE_6265ae47") }}</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("TXT_CODE_24c4768a") }}
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.presetPackAddr"
                      :placeholder="t('TXT_CODE_4ea93630')"
                      style="max-width: 320px"
                    />

                    <a-button class="mx-8" type="primary" @click="toTemplate.edit">
                      {{ t("TXT_CODE_ad207008") }}
                      <EditOutlined />
                    </a-button>
                    <a-button @click="toTemplate.new">
                      {{ t("TXT_CODE_53499d7") }}
                      <PlusOutlined />
                    </a-button>
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

                  <a-form-item>
                    <a-typography-title :level="5">Panel ID</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("TXT_CODE_e2976753") }}
                      <br />
                      <span v-if="formData.panelId">
                        {{ t("TXT_CODE_e56cced3") }}
                      </span>
                      <span v-else>
                        {{ t("TXT_CODE_699b4b66") }}
                      </span>
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.panelId"
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
            <div class="content-box" :style="{ maxHeight: card.height }">
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
                    <a-typography-title :level="5">{{ t("TXT_CODE_47b5a2f7") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        <div>
                          {{ t("TXT_CODE_cf95364f") }}
                        </div>
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-typography-paragraph>
                      <div class="flex">
                        <a-input
                          v-model:value="formData.logoUrl"
                          style="max-width: 320px"
                          :placeholder="t('TXT_CODE_4ea93630')"
                        />
                        <a-button class="ml-6" @click="() => uploadLogo()">
                          {{ t("TXT_CODE_ae09d79d") }}
                        </a-button>
                      </div>
                    </a-typography-paragraph>
                    <a-button type="primary" class="mr-6" @click="handleSaveLogoUrl()">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                    <a-button danger @click="handleSaveLogoUrl('')">
                      {{ t("TXT_CODE_50d471b2") }}
                    </a-button>
                  </a-form-item>

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
            <div class="content-box" :style="{ maxHeight: card.height }">
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
                      {{ t("TXT_CODE_3c93920b") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_bc2e52a0") }}
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

          <template #pro>
            <IframeBox :src="getProPanelUrl('/status')" :height="card.height" />
          </template>

          <template #redeem>
            <IframeBox :src="getProPanelUrl('/')" :height="card.height" />
          </template>

          <template #about>
            <div class="content-box" :style="{ maxHeight: card.height }">
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
            <div class="content-box" :style="{ maxHeight: card.height }">
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

.content-box {
  padding: 16px;
  overflow-y: auto;
}
</style>
