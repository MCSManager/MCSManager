import { getCurrentLang, isCN, t } from "@/lang/i18n";
import { quickInstallListAddr } from "@/services/apis/instance";
import { reportErrorMsg } from "@/tools/validator";
import type { QuickStartPackages } from "@/types";
import { Modal } from "ant-design-vue";
import { computed, reactive, ref } from "vue";

// Constants
export const SEARCH_ALL_KEY = "ALL";

// Types
export interface FilterOption {
  label: string;
  value: string;
}

export interface SearchForm {
  language: string;
  category: string;
  gameType: string;
  platform: string;
}

export interface UseMarketPackagesOptions {
  onlyDockerTemplate?: boolean;
}

/**
 * Composable for market packages filtering and search functionality
 */
export function useMarketPackages(options: UseMarketPackagesOptions = {}) {
  const packages = ref<QuickStartPackages[]>([]);
  const { onlyDockerTemplate = false } = options;
  const defaultLanguage = isCN() ? getCurrentLang() : "en_us";

  // Search form state
  const searchForm = reactive<SearchForm>({
    language: defaultLanguage,
    category: SEARCH_ALL_KEY,
    gameType: SEARCH_ALL_KEY,
    platform: SEARCH_ALL_KEY
  });

  // Generic filter condition checker function
  const matchesFilterCondition = (
    item: QuickStartPackages,
    field: keyof QuickStartPackages,
    filterValue: string
  ): boolean => {
    return filterValue === SEARCH_ALL_KEY || item[field] === filterValue;
  };

  // Specific filter functions
  const matchesLanguageFilter = (item: QuickStartPackages): boolean => {
    return matchesFilterCondition(item, "language", searchForm.language);
  };

  const matchesGameTypeFilter = (item: QuickStartPackages): boolean => {
    return matchesFilterCondition(item, "gameType", searchForm.gameType);
  };

  const matchesCategoryFilter = (item: QuickStartPackages): boolean => {
    return matchesFilterCondition(item, "category", searchForm.category);
  };

  const matchesPlatformFilter = (item: QuickStartPackages): boolean => {
    return matchesFilterCondition(item, "platform", searchForm.platform);
  };

  // Get filtered packages based on current search criteria
  const getFilteredPackages = (
    additionalFilters?: (item: QuickStartPackages) => boolean
  ): QuickStartPackages[] => {
    if (!packages.value || packages.value.length === 0) {
      return [];
    }

    return packages.value.filter((item) => {
      if (onlyDockerTemplate && !item.setupInfo?.docker) {
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

  // Get summary packages for game type grouping
  const getSummaryPackages = (
    additionalFilters?: (item: QuickStartPackages) => boolean
  ): QuickStartPackages[] => {
    let filteredPackages = getFilteredPackages(additionalFilters);
    if (searchForm.gameType === SEARCH_ALL_KEY) {
      const map = new Map<string, QuickStartPackages>();
      filteredPackages.forEach((item) => {
        if (!map.has(item.gameType)) {
          const summary: QuickStartPackages = {
            ...item,
            key: JSON.stringify({
              title: item.title,
              language: item.language,
              platform: item.platform,
              gameType: item.gameType,
              targetLink: item.targetLink,
              category: item.category
            }),
            description: "",
            title: item.gameType,
            category: "",
            runtime: "",
            size: "",
            hardware: "",
            remark: "",
            targetLink: undefined,
            author: "",
            setupInfo: undefined as any,
            tags: undefined,
            isSummary: true
          };
          map.set(item.gameType, summary);
        } else {
          const existing = map.get(item.gameType);
          if (existing) {
            if (existing.platform !== item.platform) {
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
      label: valueMap[key] || "",
      value: key
    }));
  };

  // Computed properties
  const filteredList = computed(() => getSummaryPackages());
  const languageOptions = ref<FilterOption[]>([
    {
      label: "简体中文",
      value: "zh_cn"
    },
    {
      label: "English",
      value: "en_us"
    }
  ]);

  const rawList = computed(() => ({
    languages: languageOptions.value,
    packages: packages.value
  }));

  const gameTypeOptions = computed(() => {
    const packages = getFilteredPackages(matchesLanguageFilter);
    return generateOptionsList(packages, "gameType", t("TXT_CODE_107695d"));
  });

  const categoryOptions = computed(() => {
    const packages = getFilteredPackages(
      (item) => matchesLanguageFilter(item) && matchesGameTypeFilter(item)
    );
    return generateOptionsList(packages, "category", t("TXT_CODE_2af87548"));
  });

  const platformOptions = computed(() => {
    const packages = getFilteredPackages(
      (item) => matchesLanguageFilter(item) && matchesGameTypeFilter(item)
    );
    return generateOptionsList(packages, "platform", t("TXT_CODE_47203b64"));
  });

  // Handler functions
  const handleReset = () => {
    searchForm.language = defaultLanguage;
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

  const handleSelectTopCategory = (item: QuickStartPackages) => {
    searchForm.gameType = item.gameType;
  };

  const { execute: getQuickInstallListAddr, isLoading: appListLoading } = quickInstallListAddr();
  const fetchTemplate = async () => {
    try {
      const list = await getQuickInstallListAddr();
      languageOptions.value = list.value?.languages || [];
      packages.value = list.value?.packages || [];
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

  return {
    // State
    packages,
    searchForm,
    appListLoading,

    // Filter functions
    matchesFilterCondition,
    matchesLanguageFilter,
    matchesGameTypeFilter,
    matchesCategoryFilter,
    matchesPlatformFilter,

    // Core functions
    getFilteredPackages,
    getSummaryPackages,
    generateOptionsList,

    // Computed properties
    filteredList,
    rawList,
    languageOptions,
    gameTypeOptions,
    categoryOptions,
    platformOptions,

    // Handler functions
    handleReset,
    handleGameTypeChange,
    handleLanguageChange,
    handlePlatformChange,
    handleSelectTopCategory,

    fetchTemplate
  };
}
