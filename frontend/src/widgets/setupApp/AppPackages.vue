<script setup lang="ts">
import { computed, reactive } from "vue";
import { getCurrentLang, isCN, t } from "@/lang/i18n";
import { quickInstallListAddr } from "@/services/apis/instance";
import type { QuickStartPackages } from "@/types";
import { reportErrorMsg } from "@/tools/validator";
import { Modal } from "ant-design-vue";
import { onMounted, ref } from "vue";
import Loading from "@/components/Loading.vue";
import type { SelectValue } from "ant-design-vue/es/select";

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
const selectedPackage = ref<QuickStartPackages>();

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
  selectedPackage.value = appList.value[0];
};
const onClick = () => {
  console.log("Selected package: ", selectedPackage.value);
  if (!selectedPackage.value) {
    return;
  }
  emit("handleSelectTemplate", selectedPackage.value);
};
const onChange = (value: SelectValue) => {
  selectedPackage.value = appList.value.find((item) => item.targetLink === value);
  console.log("Selected package: ", selectedPackage.value);
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
    <a-col :span="24">
      <a-select
        show-search
        :default-value="appList.length > 0 ? appList[0].targetLink : ''"
        style="width: 100%"
        @change="onChange"
      >
        <a-select-option v-for="item in appList" :key="item.targetLink + item.title" :value="item.targetLink">
          {{ item.title }}
        </a-select-option>
      </a-select>
    </a-col>
    <a-col :span="24">
      <a-card
        v-if="selectedPackage"
      >
        <template #actions>
          <a-space direction="vertical">
            <a-col style="display: block; margin-bottom: 8px;">
              <span style="color: white;">{{ selectedPackage.description }}</span>
            </a-col>
            <a-col>
              <a-tag color="red">{{ selectedPackage.size }}</a-tag>
              <a-tag color="blue">{{ selectedPackage.runtime }}</a-tag>
              <a-tag color="green">{{ selectedPackage.hardware }}</a-tag>
              <a-tag color="orange">{{ selectedPackage.language }}</a-tag>
            </a-col>
          </a-space>
        </template>
      </a-card>
    </a-col>
    <a-col :span="24">
      <a-button
        block
        type="primary"
        @click="onClick"
      >
        <template #icon>
          <DownloadOutlined />
        </template>
        <span>{{ t("TXT_CODE_1704ea49") }}</span>
      </a-button>
    </a-col>
  </a-row>
</template>