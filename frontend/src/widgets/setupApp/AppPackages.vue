<script setup lang="ts">
import { computed, reactive } from "vue";
import { getCurrentLang, isCN, t } from "@/lang/i18n";
import { quickInstallListAddr } from "@/services/apis/instance";
import type { QuickStartPackages } from "@/types";
import { reportErrorMsg } from "@/tools/validator";
import { Modal } from "ant-design-vue";
import { DatabaseOutlined, DownloadOutlined } from "@ant-design/icons-vue";
import { onMounted } from "vue";
import Loading from "@/components/Loading.vue";
import CardPanel from "@/components/CardPanel.vue";
import FadeUpAnimation from "@/components/FadeUpAnimation.vue";

defineProps<{
  title?: string;
}>();

const emit = defineEmits<{
  "handle-select-template": [item: QuickStartPackages];
}>();

const {
  state: presetList,
  execute: getQuickInstallListAddr,
  isLoading: appListLoading
} = quickInstallListAddr();

const SEARCH_ALL_KEY = "ALL";

// Search form state for filtering packages
// Contains language, category, game type, and platform filters with default values
const searchForm = reactive({
  language: isCN() ? getCurrentLang() : "en_us",
  category: SEARCH_ALL_KEY,
  gameType: SEARCH_ALL_KEY,
  platform: SEARCH_ALL_KEY
});

// Type definition for filter options used in select dropdowns
interface FilterOption {
  label: string;
  value: string;
}

// Generic filter condition checker function
// Checks if an item matches a specific field filter value
// Returns true if filterValue is "ALL" (no filter) or if item field matches filterValue
const matchesFilterCondition = (
  item: QuickStartPackages,
  field: keyof QuickStartPackages,
  filterValue: string
): boolean => {
  return filterValue === SEARCH_ALL_KEY || item[field] === filterValue;
};

// Language filter function - checks if item matches current language filter
const matchesLanguageFilter = (item: QuickStartPackages): boolean => {
  return matchesFilterCondition(item, "language", searchForm.language);
};

// Game type filter function - checks if item matches current game type filter
const matchesGameTypeFilter = (item: QuickStartPackages): boolean => {
  return matchesFilterCondition(item, "gameType", searchForm.gameType);
};

// Category filter function - checks if item matches current category filter
const matchesCategoryFilter = (item: QuickStartPackages): boolean => {
  return matchesFilterCondition(item, "category", searchForm.category);
};

// Platform filter function - checks if item matches current platform filter
const matchesPlatformFilter = (item: QuickStartPackages): boolean => {
  return matchesFilterCondition(item, "platform", searchForm.platform);
};

// Get filtered packages based on current search criteria
// Supports additional custom filters through additionalFilters parameter
// Returns empty array if no packages are available
const getFilteredPackages = (
  additionalFilters?: (item: QuickStartPackages) => boolean
): QuickStartPackages[] => {
  if (!presetList.value?.packages) {
    return [];
  }

  return presetList.value.packages.filter((item) => {
    // Apply base filters (language, game type, category, platform)
    const baseFilters = [
      matchesLanguageFilter(item),
      matchesGameTypeFilter(item),
      matchesCategoryFilter(item),
      matchesPlatformFilter(item)
    ];

    // Combine base filters with additional custom filters if provided
    const allFilters = additionalFilters ? [additionalFilters(item)] : baseFilters;
    return allFilters.every((filter) => filter);
  });
};

// Generic function to generate options list for select dropdowns
// Creates unique options from package items based on specified field
// Supports additional filtering before generating options
const generateOptionsList = (
  items: QuickStartPackages[],
  field: keyof QuickStartPackages,
  allLabel: string,
  additionalFilter?: (item: QuickStartPackages) => boolean
): FilterOption[] => {
  const valueMap: Record<string, string> = {};

  // Apply additional filter if provided, otherwise use all items
  const filteredItems = additionalFilter ? items.filter(additionalFilter) : items;

  // Build unique value map from filtered items
  filteredItems.forEach((item) => {
    const value = item[field] as string;
    if (!valueMap[value]) {
      valueMap[value] = value;
    }
  });

  // Add "ALL" option to the map
  valueMap[SEARCH_ALL_KEY] = allLabel;

  // Convert map to array of FilterOption objects
  return Object.keys(valueMap).map((key) => ({
    label: valueMap[key],
    value: key
  }));
};

// Computed property for filtered application list
// Uses the generic getFilteredPackages function with current search criteria
const appList = computed(() => {
  return getFilteredPackages();
});

// Computed property for language options dropdown
// Includes "ALL" option and available languages from preset data
const appLangList = computed(() => {
  const allOption: FilterOption = {
    label: t("TXT_CODE_8a30e150"),
    value: SEARCH_ALL_KEY
  };

  const languageOptions: FilterOption[] =
    presetList.value?.languages instanceof Array ? presetList.value.languages : [];

  return [allOption, ...languageOptions];
});

// Computed property for game type options dropdown
// Filters packages by current language selection before generating options
const appGameTypeList = computed(() => {
  const packages = getFilteredPackages(matchesLanguageFilter);
  return generateOptionsList(packages, "gameType", t("TXT_CODE_107695d"));
});

// Computed property for category options dropdown
// Filters packages by current language and game type selections before generating options
const appCategoryList = computed(() => {
  const packages = getFilteredPackages(
    (item) => matchesLanguageFilter(item) && matchesGameTypeFilter(item)
  );
  return generateOptionsList(packages, "category", t("TXT_CODE_2af87548"));
});

// Computed property for platform options dropdown
// Filters packages by current language, game type, and category selections before generating options
const appPlatformList = computed(() => {
  const packages = getFilteredPackages(
    (item) => matchesLanguageFilter(item) && matchesGameTypeFilter(item)
  );
  return generateOptionsList(packages, "platform", t("所有系统"));
});

// Initialize function to load package data and handle errors
// Fetches quick install list and shows error modal if no packages are available
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

const handleReset = () => {
  searchForm.language = isCN() ? getCurrentLang() : "en_us";
  searchForm.gameType = SEARCH_ALL_KEY;
  searchForm.category = SEARCH_ALL_KEY;
  searchForm.platform = SEARCH_ALL_KEY;
};

const handleGameTypeChange = () => {
  searchForm.category = SEARCH_ALL_KEY;
  searchForm.platform = SEARCH_ALL_KEY;
};

const handleLanguageChange = () => {
  searchForm.gameType = SEARCH_ALL_KEY;
  searchForm.category = SEARCH_ALL_KEY;
  searchForm.platform = SEARCH_ALL_KEY;
};

const handlePlatformChange = () => {
  searchForm.category = SEARCH_ALL_KEY;
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
  <a-typography-title :level="4" style="margin-bottom: 20px">
    <DatabaseOutlined />
    {{ title || t("TXT_CODE_88249aee") }}
  </a-typography-title>
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
        <div><Loading /></div>
        <div style="margin-top: 20px; color: var(--color-gray-12)">
          {{ t("加载中，如果长期无反应，请检查网络。") }}
        </div>
      </div>
    </a-col>
  </a-row>

  <!-- Main content - package marketplace interface -->
  <a-row v-else :gutter="[24, 24]" style="height: 100%">
    <!-- Search filters section -->
    <a-col :span="24" :md="24">
      <a-form layout="horizontal" :model="searchForm" style="display: flex; gap: 10px">
        <!-- Language filter dropdown -->
        <a-form-item class="mb-0">
          <a-select
            v-model:value="searchForm.language"
            style="width: 200px"
            :placeholder="t('TXT_CODE_8a30e150')"
            @change="handleLanguageChange"
          >
            <a-select-option v-for="item in appLangList" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- Game type filter dropdown -->
        <a-form-item class="mb-0">
          <a-select
            v-model:value="searchForm.gameType"
            style="width: 200px"
            :placeholder="t('TXT_CODE_107695d')"
            @change="handleGameTypeChange"
          >
            <a-select-option v-for="item in appGameTypeList" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- Platform filter dropdown -->
        <a-form-item class="mb-0">
          <a-select
            v-model:value="searchForm.platform"
            style="width: 200px"
            placeholder="请选择系统"
            @change="handlePlatformChange"
          >
            <a-select-option v-for="item in appPlatformList" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- Category filter dropdown -->
        <a-form-item class="mb-0">
          <a-select
            v-model:value="searchForm.category"
            style="width: 200px"
            :placeholder="t('TXT_CODE_ebbb2def')"
          >
            <a-select-option v-for="item in appCategoryList" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item class="mb-0">
          <a-button type="default" @click="handleReset">
            {{ t("TXT_CODE_50d471b2") }}
          </a-button>
        </a-form-item>
      </a-form>
    </a-col>

    <!-- Empty state - shown when no packages match current filters -->
    <a-col v-if="appList.length === 0" :span="24">
      <div style="display: flex; justify-content: center; align-items: center; height: 40vh">
        <a-typography-paragraph :style="{ color: 'var(--color-gray-7)' }">
          {{ t("TXT_CODE_7356e569") }}
        </a-typography-paragraph>
      </div>
    </a-col>

    <!-- Package cards grid with fade-up animation -->
    <fade-up-animation>
      <a-col
        v-for="item in appList"
        :key="item.targetLink + item.title + item.gameType + item.language + item.category"
        :span="24"
        :xl="8"
        :lg="8"
        :sm="12"
      >
        <!-- Individual package card -->
        <div style="display: flex; flex-grow: 1; flex-direction: column; height: 100%">
          <CardPanel style="flex-grow: 1" :style="{ padding: '12px' }">
            <!-- Package title -->
            <template #title> </template>

            <!-- Package content -->
            <template #body>
              <div class="package-card-content">
                <div class="package-image-container">
                  <img class="package-image cursor-pointer" :src="item.image" alt="" srcset="" />
                </div>

                <div class="package-info">
                  <a-typography-title :level="5">
                    {{ item.title }}
                  </a-typography-title>
                  <a-typography-paragraph>
                    {{ item.description }}
                  </a-typography-paragraph>
                  <a-typography-paragraph>
                    <span class="text-gray-5">{{ t("TXT_CODE_18b94497") }}: </span>
                    <span>{{ item.runtime }}</span>
                    <br />
                    <span class="text-gray-5">{{ t("TXT_CODE_683e3033") }}: </span>
                    <span>{{ item.hardware }}</span>
                  </a-typography-paragraph>
                </div>

                <div class="package-action">
                  <a-button
                    block
                    type="primary"
                    class="download-button"
                    @click="emit('handle-select-template', item)"
                  >
                    <template #icon>
                      <DownloadOutlined />
                    </template>
                    {{ t("TXT_CODE_1704ea49") }}
                  </a-button>
                </div>
              </div>
            </template>
          </CardPanel>
        </div>
      </a-col>
    </fade-up-animation>
  </a-row>
</template>

<style scoped>
.package-card-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: space-between;
  height: 100%;
  transition: all 0.3s ease;
}

.package-image-container {
  overflow: hidden;
  border-radius: 8px;
}

.package-image {
  height: 100%;
  width: 100%;
  object-fit: cover;
  max-height: 120px;
  transition: transform 0.3s ease;
}

.package-info {
  flex: 1;
}

.package-action {
  display: flex;
  justify-content: center;
}

.download-button {
  max-width: 120px;
  transition: all 0.3s ease;
  background-color: var(--color-green-6);
}

/* 鼠标移入特效 */
.ant-card:hover {
  transition: all 0.3s ease;
  cursor: pointer;
}

.ant-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.package-image:hover {
  transform: scale(1.05);
}

.ant-card:hover .download-button {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}
</style>
