<script setup lang="ts">
import FadeUpAnimation from "@/components/FadeUpAnimation.vue";
import Loading from "@/components/Loading.vue";
import { SEARCH_ALL_KEY, useMarketPackages } from "@/hooks/useMarketPackages";
import { t } from "@/lang/i18n";
import type { QuickStartPackages } from "@/types";
import { computed, onMounted } from "vue";
import PackageDetailTable from "./PackageDetailTable.vue";

const props = defineProps<{
  title?: string;
  btnText?: string;
  showCustomBtn?: boolean;
  onlyDockerTemplate?: boolean;
}>();

const emit = defineEmits<{
  "handle-select-template": [item: QuickStartPackages, type: "normal" | "docker"];
  "handle-select-category": [item: QuickStartPackages];
  "handle-back-to-category": [];
}>();

const {
  searchForm,
  appListLoading,
  filteredList: appList,
  platformOptions,
  handleSelectTopCategory,
  fetchTemplate
} = useMarketPackages({
  onlyDockerTemplate: props.onlyDockerTemplate
});

/** Whether we are in category view (category cards); otherwise in detail list view */
const isCategoryView = computed(() => searchForm.gameType === SEARCH_ALL_KEY);

/** Detail list: filtered template list when not in category view */
const detailList = computed(() => (isCategoryView.value ? [] : appList.value));

const handleBackToCategory = () => {
  searchForm.gameType = SEARCH_ALL_KEY;
  searchForm.platform = SEARCH_ALL_KEY;
  emit("handle-back-to-category");
};

const onCategoryCardClick = (item: QuickStartPackages) => {
  emit("handle-select-category", item);
};

const onTemplateSelect = (item: QuickStartPackages, type: "normal" | "docker") => {
  emit("handle-select-template", item, type);
};

onMounted(() => {
  fetchTemplate();
});

defineExpose({
  appList,
  fetchTemplate,
  handleSelectTopCategory
});
</script>

<template>
  <!-- Loading state - shows loading spinner while fetching package data -->
  <a-row v-if="appListLoading" :gutter="[24, 24]" style="height: 100%">
    <a-col :span="24">
      <div
        style="
          height: 50vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        "
      >
        <div>
          <Loading />
        </div>
        <div style="margin-top: 20px; color: var(--color-gray-12)">
          {{ t("TXT_CODE_7fca723a") }}
        </div>
      </div>
    </a-col>
  </a-row>

  <!-- Main content - package marketplace interface -->
  <a-row v-else :gutter="[16, 16]" style="height: 100%">
    <a-col v-if="showCustomBtn" :span="24" :md="24" class="justify-end">
      <a-button type="link" style="margin: 0; padding: 0">
        {{ t("TXT_CODE_181c72ba") }}
      </a-button>
    </a-col>

    <!-- Category 2: Detail list: search bar -->
    <a-col :span="24">
      <div class="detail-search-bar">
        <a-select
          v-model:value="searchForm.platform"
          :options="platformOptions"
          :placeholder="t('TXT_CODE_47203b64')"
          class="detail-search-platform"
          style="min-width: 140px"
        />
        <a-input
          v-model:value="searchForm.keyword"
          :placeholder="t('TXT_CODE_ce132192')"
          class="detail-search-keyword"
          style="max-width: 280px"
        />
        <a-button v-if="detailList.length > 0" type="default" @click="handleBackToCategory">
          <template #icon>
            <ArrowLeftOutlined />
          </template>
          {{ t("TXT_CODE_c14b2ea3") }}
        </a-button>
      </div>
    </a-col>

    <!-- Empty state - shown when no packages match current filters -->
    <a-col v-if="appList.length === 0" :span="24">
      <div style="display: flex; justify-content: center; align-items: center; height: 40vh">
        <a-typography-paragraph :style="{ color: 'var(--color-gray-7)' }">
          {{ t("TXT_CODE_7356e569") }}
        </a-typography-paragraph>
      </div>
    </a-col>

    <!-- Category 2: Detail list: table with back-to-category and search conditions -->
    <template v-else-if="detailList.length > 0">
      <a-col :span="24">
        <PackageDetailTable
          :data-source="detailList"
          :btn-text="btnText"
          @select="(item, type) => onTemplateSelect(item, type)"
        />
      </a-col>
    </template>

    <!-- Category 1: Category cards -->
    <fade-up-animation v-else :delay="60">
      <a-col
        v-for="(item, index) in appList"
        :key="item.key"
        :data-index="index"
        :span="24"
        :sm="24"
        :md="12"
        :lg="8"
      >
        <div
          class="package-image-container-summary global-card-container-shadow"
          style="overflow: hidden; cursor: pointer"
          @click="onCategoryCardClick(item)"
        >
          <div class="package-image-container" style="border-radius: 0">
            <img
              class="package-image cursor-pointer"
              style="height: 220px; border-radius: 0"
              :src="item.image"
              alt=""
              srcset=""
            />
          </div>
          <a-typography-title :level="5" class="flex-center package-subtitle mb-0">
            <span>{{ item.title }}</span>
          </a-typography-title>
        </div>
      </a-col>
    </fade-up-animation>
  </a-row>
</template>

<style scoped>
.detail-search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
.detail-search-platform,
.detail-search-keyword {
  flex-shrink: 0;
}
</style>
