<script setup lang="ts">
import { computed, reactive } from "vue";
import { getCurrentLang, isCN, t } from "@/lang/i18n";
import { quickInstallListAddr } from "@/services/apis/instance";
import type { QuickStartPackages } from "@/types";
import { reportErrorMsg } from "@/tools/validator";
import { Modal } from "ant-design-vue";
import { DownloadOutlined } from "@ant-design/icons-vue";
import { onMounted } from "vue";
import Loading from "@/components/Loading.vue";
import CardPanel from "@/components/CardPanel.vue";
import FadeUpAnimation from "@/components/FadeUpAnimation.vue";

const emit = defineEmits<{
  handleSelectTemplate: [item: QuickStartPackages];
}>();

const {
  state: presetList,
  execute: getQuickInstallListAddr,
  isLoading: appListLoading
} = quickInstallListAddr();

const SEARCH_ALL_KEY = "ALL";

// Search form state for filtering packages
// Contains language, category, and game type filters with default values
const searchForm = reactive({
  language: isCN() ? getCurrentLang() : "en_us",
  category: SEARCH_ALL_KEY,
  gameType: SEARCH_ALL_KEY
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
    // Apply base filters (language, game type, category)
    const baseFilters = [
      matchesLanguageFilter(item),
      matchesGameTypeFilter(item),
      matchesCategoryFilter(item)
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
};

const handleGameTypeChange = () => {
  searchForm.category = SEARCH_ALL_KEY;
};

const handleLanguageChange = () => {
  searchForm.gameType = SEARCH_ALL_KEY;
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
  <!-- Loading state - shows loading spinner while fetching package data -->
  <a-row v-if="appListLoading" :gutter="[24, 24]" style="height: 100%">
    <a-col :span="24">
      <div style="height: 50vh">
        <Loading />
      </div>
    </a-col>
  </a-row>

  <!-- Main content - package marketplace interface -->
  <a-row v-else :gutter="[24, 24]" style="height: 100%">
    <!-- Page title -->
    <a-col :span="24">
      <a-typography-title :level="4" style="margin-bottom: 0px">
        {{ t("TXT_CODE_88249aee") }}
      </a-typography-title>
    </a-col>

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
        :xl="6"
        :lg="8"
        :sm="12"
      >
        <!-- Individual package card -->
        <div style="display: flex; flex-grow: 1; flex-direction: column; height: 100%">
          <CardPanel style="flex-grow: 1">
            <!-- Package title -->
            <template #title>
              <div class="ellipsis-text" style="max-width: 280px">
                {{ item.title }}
              </div>
            </template>

            <!-- Package content -->
            <template #body>
              <!-- Package description and metadata -->
              <div style="min-height: 120px; position: relative">
                <!-- Package description with ellipsis -->
                <a-typography-paragraph
                  :ellipsis="{ rows: 3, expandable: true }"
                  :content="item.description"
                >
                </a-typography-paragraph>

                <!-- Package metadata (runtime, hardware, size) -->
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

              <!-- Download button positioned at bottom of card -->
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
                  style="max-width: 120px"
                  @click="emit('handleSelectTemplate', item)"
                >
                  <template #icon>
                    <DownloadOutlined />
                  </template>
                  {{ t("TXT_CODE_1704ea49") }}
                </a-button>
              </div>
            </template>
          </CardPanel>
        </div>
      </a-col>
    </fade-up-animation>
  </a-row>
</template>
