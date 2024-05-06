<script setup lang="ts">
import { computed, reactive } from "vue";
import { getCurrentLang, isCN, t } from "@/lang/i18n";
import { quickInstallListAddr } from "@/services/apis/instance";
import type { QuickStartPackages } from "@/types";
import { reportErrorMsg } from "@/tools/validator";
import { Modal } from "ant-design-vue";
import { onMounted } from "vue";
import Loading from "@/components/Loading.vue";

const emit = defineEmits<{
  handleSelectTemplate: [item: QuickStartPackages];
}>();

const {
  state: presetList,
  execute: getQuickInstallListAddr,
  isLoading: appListLoading
} = quickInstallListAddr();

const ALL_LANG_KEY = "all";
const searchForm = reactive({
  language: isCN() ? getCurrentLang() : "en_us"
});

const appList = computed(() => {
  // For MCSManager v9
  const v9List: any[] = presetList.value as unknown as any[];
  if (v9List?.[0]?.info && v9List?.[0]?.mc) {
    const list = v9List.map((v) => {
      return {
        ...v,
        language: ALL_LANG_KEY,
        title: v.mc,
        runtime: `Java ${v.java}+`,
        description: v.info,
        hardware: v.remark,
        size: `${v.size}MB`
      };
    });
    return list as unknown as QuickStartPackages[];
  }
  // Check
  if (!presetList.value?.packages || !presetList.value?.languages) {
    return [];
  }
  let list = presetList.value?.packages;
  if (searchForm.language)
    list = list.filter(
      (item) => item.language === searchForm.language || searchForm.language === ALL_LANG_KEY
    );
  return list;
});

const appLangList = computed(() => {
  let all = [
    {
      label: t("TXT_CODE_8a30e150"),
      value: ALL_LANG_KEY
    }
  ];
  if (presetList.value?.languages instanceof Array) {
    all = all.concat(presetList.value?.languages);
  }
  return all;
});

const init = async () => {
  try {
    await getQuickInstallListAddr();
    if (!appList.value || appList.value.length === 0) {
      Modal.error({
        title: t("TXT_CODE_c534ca49"),
        content: t("TXT_CODE_bcfaf14d")
      });
    }
  } catch (err: any) {
    console.error(err.message);
    return reportErrorMsg(err.message);
  }
};

defineExpose({
  init,
  appList
});

onMounted(() => {
  init();
});
</script>

<template>
  <a-row v-if="appListLoading" :gutter="[24, 24]" style="height: 100%">
    <a-col :span="24">
      <div style="height: 50vh">
        <Loading />
      </div>
    </a-col>
  </a-row>
  <a-row v-else :gutter="[24, 24]" style="height: 100%">
    <a-col :span="24" :md="24">
      <a-form layout="horizontal" :model="searchForm">
        <a-form-item class="mb-0">
          <a-radio-group v-model:value="searchForm.language">
            <a-radio-button v-for="item in appLangList" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-radio-button>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-col>
    <fade-up-animation>
      <a-col
        v-for="item in appList"
        :key="item.targetLink + item.title"
        :span="24"
        :xl="6"
        :lg="8"
        :sm="12"
      >
        <div style="display: flex; flex-grow: 1; flex-direction: column; height: 100%">
          <CardPanel style="flex-grow: 1">
            <template #title>
              <div class="ellipsis-text" style="max-width: 280px">
                {{ item.title }}
              </div>
            </template>
            <template #body>
              <div style="min-height: 120px; position: relative">
                <a-typography-paragraph
                  :ellipsis="{ rows: 3, expandable: true }"
                  :content="item.description"
                >
                </a-typography-paragraph>
                <a-typography-paragraph>
                  <a-typography-text class="color-info">
                    <div v-if="item.runtime">{{ t("TXT_CODE_18b94497") }}: {{ item.runtime }}</div>
                    <div v-if="item.hardware">
                      {{ t("TXT_CODE_683e3033") }}: {{ item.hardware }}
                    </div>
                    <div v-if="item.size">{{ t("TXT_CODE_94bb113a") }}: {{ item.size }}</div>
                  </a-typography-text>
                  <br />
                  <a-typography-text class="color-info"> </a-typography-text>
                  <br />
                  <a-typography-text class="color-info"> </a-typography-text>
                </a-typography-paragraph>
              </div>

              <div
                style="
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  display: flex;
                  justify-content: center;
                "
              >
                <a-button
                  block
                  type="primary"
                  ghost
                  style="max-width: 120px"
                  @click="emit('handleSelectTemplate', item)"
                >
                  <template #icon>
                    <DownloadOutlined />
                  </template>
                  <span>{{ t("TXT_CODE_1704ea49") }}</span>
                </a-button>
              </div>
            </template>
          </CardPanel>
        </div>
      </a-col>
    </fade-up-animation>
  </a-row>
</template>
