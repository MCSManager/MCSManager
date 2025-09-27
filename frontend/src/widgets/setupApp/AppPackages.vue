<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import FadeUpAnimation from "@/components/FadeUpAnimation.vue";
import Loading from "@/components/Loading.vue";
import { getCurrentLang, isCN, t } from "@/lang/i18n";
import { quickInstallListAddr } from "@/services/apis/instance";
import { reportErrorMsg } from "@/tools/validator";
import type { QuickStartPackages } from "@/types";
import { DatabaseOutlined, DownloadOutlined } from "@ant-design/icons-vue";
import { Flex, Modal } from "ant-design-vue";
import Link from "ant-design-vue/es/typography/Link";
import { computed, onMounted, reactive } from "vue";

const props = defineProps<{
  title?: string;
  btnText?: string;
  showCustomBtn?: boolean;
  onlyDockerTemplate?: boolean;
}>();

const emit = defineEmits<{
  "handle-select-template": [item: QuickStartPackages | null];
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
  // eslint-disable-next-line no-unused-vars
  additionalFilters?: (item: QuickStartPackages) => boolean
): QuickStartPackages[] => {
  if (!presetList.value?.packages) {
    return [];
  }

  return presetList.value.packages.filter((item) => {
    if (props.onlyDockerTemplate && !item.setupInfo?.docker) {
      return false;
    }

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

const getSummaryPackages = (
  // eslint-disable-next-line no-unused-vars
  additionalFilters?: (item: QuickStartPackages) => boolean
): QuickStartPackages[] => {
  let filteredPackages = getFilteredPackages(additionalFilters);
  if (searchForm.gameType == SEARCH_ALL_KEY) {
    const map = new Map<string, QuickStartPackages>();
    filteredPackages.forEach((item) => {
      if (!map.has(item.gameType)) {
        const summary: QuickStartPackages = {
          ...item,
          description: "",
          title: item.gameType,
          category: "",
          runtime: "",
          size: "",
          hardware: "",
          remark: "",
          targetLink: undefined,
          author: "",
          setupInfo: undefined,
          tags: undefined,
          isSummary: true
        };
        map.set(item.gameType, summary);
      } else {
        const existing = map.get(item.gameType);
        if (existing) {
          if (existing.platform != item.platform) {
            existing.platform = "All";
          }
        }
      }
    });
    filteredPackages = Array.from(map.values());
  }
  return filteredPackages;
};

// Generic function to generate options list for select dropdowns
// Creates unique options from package items based on specified field
// Supports additional filtering before generating options
const generateOptionsList = (
  items: QuickStartPackages[],
  field: keyof QuickStartPackages,
  allLabel: string,
  // eslint-disable-next-line no-unused-vars
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
  return getSummaryPackages();
});

// Computed property for language options dropdown
// Includes "ALL" option and available languages from preset data
const appLangList = computed(() => {
  const languageOptions: FilterOption[] =
    presetList.value?.languages instanceof Array ? presetList.value.languages : [];

  return [...languageOptions];
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
  return generateOptionsList(packages, "platform", t("TXT_CODE_47203b64"));
});

// Initialize function to load package data and handle errors
// Fetches quick install list and shows error modal if no packages are available
const init = async () => {
  try {
    const list = await getQuickInstallListAddr();
    if (!list.value?.packages || list.value?.packages.length === 0) {
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
  <a-typography-title :level="4" style="margin-bottom: 8px">
    <DatabaseOutlined />
    {{ title || t("TXT_CODE_88249aee") }}
  </a-typography-title>
  <a-typography-paragraph>
    <Flex justify="space-between" align="flex-start">
      <p>
        <span>{{ t("TXT_CODE_c9ce7427") }}</span>
        <span v-if="onlyDockerTemplate">
          <br />
          {{ t("TXT_CODE_de9b7cc0") }}
          <br />
        </span>
      </p>
      <p>
        <Link href="https://github.com/MCSManager/Script/issues/77" target="_blank">
          {{ t("TXT_CODE_709c2db4") }}
        </Link>
      </p>
    </Flex>
  </a-typography-paragraph>
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
  <a-row v-else :gutter="[12, 12]" style="height: 100%">
    <!-- Search filters section -->
    <a-col :span="24" :md="24">
      <a-form
        layout="horizontal"
        :model="searchForm"
        style="display: flex; gap: 10px; flex-wrap: wrap"
      >
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
            :placeholder="t('TXT_CODE_47203b64')"
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
            {{ t("TXT_CODE_880fedf7") }}
          </a-button>
        </a-form-item>
      </a-form>
    </a-col>

    <a-col v-if="showCustomBtn" :span="24" :md="24" class="justify-end">
      <a-button
        type="link"
        style="margin: 0; padding: 0"
        @click="emit('handle-select-template', null)"
      >
        {{ t("TXT_CODE_181c72ba") }}
      </a-button>
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
        :lg="6"
        :sm="24"
      >
        <!-- Individual package card -->
        <div style="display: flex; flex-grow: 1; flex-direction: column; height: 100%">
          <CardPanel style="flex-grow: 1" :style="{ padding: '12px' }">
            <!-- Package content -->
            <template #body>
              <div class="package-card-content">
                <div class="package-image-container">
                  <img class="package-image cursor-pointer" :src="item.image" alt="" srcset="" />
                </div>

                <div class="package-info">
                  <a-typography-title :level="5" class="justify-between">
                    <span>
                      {{ item.title }}
                    </span>
                    <span>
                      <a-tag v-if="item.platform" color="cyan">
                        {{
                          String(item.platform).toLowerCase() === "all"
                            ? t("TXT_CODE_all_platform")
                            : item.platform
                        }}
                      </a-tag>
                    </span>
                  </a-typography-title>
                  <div v-if="!item.isSummary" class="mb-5">
                    <a-tag v-for="tag in item.tags" :key="tag" color="blue">{{ tag }}</a-tag>
                  </div>
                  <a-typography-paragraph>
                    <a-typography-text :style="{ fontSize: '12px' }">
                      <p>
                        <span>
                          {{ item.description || "&nbsp;" }}
                        </span>
                      </p>
                      <p v-if="item.runtime">
                        <span style="opacity: 0.6">{{ t("TXT_CODE_18b94497") }}: </span>
                        <span>{{ item.runtime }}</span>
                      </p>
                      <p v-if="item.hardware">
                        <span style="opacity: 0.6">{{ t("TXT_CODE_683e3033") }}: </span>
                        <span>{{ item.hardware }}</span>
                      </p>
                    </a-typography-text>
                  </a-typography-paragraph>
                </div>

                <div class="package-action">
                  <a-button
                    v-if="!item.isSummary"
                    block
                    type="primary"
                    class="download-button"
                    @click="emit('handle-select-template', item)"
                  >
                    <template #icon>
                      <DownloadOutlined />
                    </template>
                    {{ btnText || t("TXT_CODE_1704ea49") }}
                  </a-button>

                  <a-button
                    v-else
                    block
                    type="primary"
                    class="download-button"
                    @click="searchForm.gameType = item.gameType"
                  >
                    {{ t("TXT_CODE_530f5951") }}
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
  max-height: 160px;
  height: 160px;
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
  margin: 0px auto;
  transition: all 0.3s ease;
  max-width: 140px;
}

.package-image {
  user-drag: none;
  user-select: none;
  position: relative;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.package-image::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(24, 144, 255, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.package-image:hover {
  transform: scale(1.08) rotate(2deg);
  filter: brightness(1.1) contrast(1.1);
}

.package-image:hover::after {
  opacity: 1;
}

.ant-card:hover .download-button {
  transform: scale(1.08);
  box-shadow:
    0 8px 20px rgba(24, 144, 255, 0.4),
    0 0 15px rgba(24, 144, 255, 0.2);
  background: linear-gradient(45deg, #1890ff, #40a9ff);
  border: none;
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow:
      0 8px 20px rgba(24, 144, 255, 0.4),
      0 0 15px rgba(24, 144, 255, 0.2);
  }
  50% {
    box-shadow:
      0 8px 25px rgba(24, 144, 255, 0.6),
      0 0 25px rgba(24, 144, 255, 0.4);
  }
}
</style>
