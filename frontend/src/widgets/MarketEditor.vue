<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { isCN, t } from "@/lang/i18n";
import type { QuickStartPackages, QuickStartTemplate } from "@/types";
import {
  CopyOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
  SelectOutlined
} from "@ant-design/icons-vue";
import { Flex, message } from "ant-design-vue";
import axios from "axios";
import { computed, onMounted, reactive, ref } from "vue";

// import { toCopy } from '@/utils'
import Loading from "@/components/Loading.vue";
import { router } from "@/config/router";
import Editor from "./MarketEditorDialog.vue";

const url = router.currentRoute.value.query.url as string;
const isUserUpload = Boolean(router.currentRoute.value.query.userUpload as string);
const isNewTemplate = Boolean(router.currentRoute.value.query.newTemplate as string);

const appList = ref<QuickStartTemplate>();
const appListLoading = ref(false);
const fetchTemplate = async () => {
  if (!url) return;

  try {
    appListLoading.value = true;
    const { data } = await axios.get(url);
    appList.value = data.data;
  } catch (error) {
    message.error(t("TXT_CODE_aa13fde2") + `${error}`);
  } finally {
    appListLoading.value = false;
  }
};

const SEARCH_ALL_KEY = "ALL";
const searchForm = reactive({
  language: isCN() ? "zh_cn" : "en_us",
  category: SEARCH_ALL_KEY,
  gameType: SEARCH_ALL_KEY,
  platform: SEARCH_ALL_KEY
});

interface FilterOption {
  label: string;
  value: string;
}

const matchesFilterCondition = (
  item: QuickStartPackages,
  field: keyof QuickStartPackages,
  filterValue: string
): boolean => {
  return filterValue === SEARCH_ALL_KEY || item[field] === filterValue;
};

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

const getFilteredPackages = (
  // eslint-disable-next-line no-unused-vars
  additionalFilters?: (item: QuickStartPackages) => boolean
): QuickStartPackages[] => {
  if (!appList.value?.packages) {
    return [];
  }

  return appList.value.packages.filter((item) => {
    // if (props.onlyDockerTemplate && !item.setupInfo?.docker) {
    //   return false;
    // }

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
          key:
            item.title +
            item.language +
            item.platform +
            item.gameType +
            item.targetLink +
            item.category,
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
    label: valueMap[key] || "",
    value: key
  }));
};

const dynamicList = computed(() => getSummaryPackages());

const appLangList = computed(() => {
  const languageOptions: FilterOption[] =
    appList.value?.languages instanceof Array ? appList.value.languages : [];

  return [...languageOptions];
});

const appGameTypeList = computed(() => {
  const packages = getFilteredPackages(matchesLanguageFilter);
  return generateOptionsList(packages, "gameType", t("TXT_CODE_107695d"));
});

const appCategoryList = computed(() => {
  const packages = getFilteredPackages(
    (item) => matchesLanguageFilter(item) && matchesGameTypeFilter(item)
  );
  return generateOptionsList(packages, "category", t("TXT_CODE_2af87548"));
});

const appPlatformList = computed(() => {
  const packages = getFilteredPackages(
    (item) => matchesLanguageFilter(item) && matchesGameTypeFilter(item)
  );
  return generateOptionsList(packages, "platform", t("TXT_CODE_47203b64"));
});

const handleReset = () => {
  searchForm.language = isCN() ? "zh_cn" : "en_us";
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

const downloadMarketJson = () => {
  if (!appList.value) return message.warning(t("TXT_CODE_8e223f23"));
  const dataStr = JSON.stringify(appList.value, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "market.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  message.success(t("TXT_CODE_38fb23a8"));
};

const findFn = (pkg: QuickStartPackages, item: QuickStartPackages) =>
  pkg.targetLink === item.targetLink &&
  pkg.title === item.title &&
  pkg.gameType === item.gameType &&
  pkg.language === item.language &&
  pkg.platform === item.platform &&
  pkg.category === item.category;
const editorRef = ref<InstanceType<typeof Editor>>();
const toEdit = (item: QuickStartPackages) => {
  const actualIndex = appList.value?.packages.findIndex((pkg) => findFn(pkg, item));
  editorRef?.value?.open(item, actualIndex);
};

const save = (item: QuickStartPackages, i: number) => {
  if (!appList.value?.packages) return;
  // 如果 i < 0 表示新
  if (i < 0) {
    appList.value.packages.push(item);
  } else {
    appList.value.packages[i] = item;
  }
};

const multipleMode = ref(false);
const selectedItems = ref<QuickStartPackages[]>([]);
const toMultiMode = () => {
  multipleMode.value = true;
};

const findItem = (item: QuickStartPackages) => selectedItems.value.find((i) => findFn(i, item));

const selectItem = (item: QuickStartPackages) => {
  if (findItem(item)) {
    selectedItems.value.splice(selectedItems.value.indexOf(item), 1);
  } else {
    selectedItems.value.push(item);
  }
};

const handleSelectItem = (item: QuickStartPackages) => {
  if (item.isSummary) return;
  if (multipleMode.value) {
    selectItem(item);
  } else {
    toEdit(item);
  }
};

const selectAllItems = () => {
  if (dynamicList.value.length === selectedItems.value.length) {
    selectedItems.value = [];
  } else {
    for (const item of dynamicList.value) {
      if (item.isSummary) continue;
      if (findItem(item)) continue;
      selectedItems.value.push(item);
    }
  }
};

const exitMultipleMode = () => {
  multipleMode.value = false;
  selectedItems.value = [];
};

const batchDelete = () => {
  if (selectedItems.value.length === 0) return message.warning(t("TXT_CODE_72952e19"));
  for (const item of selectedItems.value) {
    const index = appList.value?.packages.findIndex((pkg) => findFn(pkg, item));
    if (Number(index) < 0) continue;
    appList.value?.packages.splice(Number(index), 1);
  }
  selectedItems.value = [];
  message.success(t("TXT_CODE_28190dbc"));
};

onMounted(() => {
  if (isUserUpload) {
    // appList.value = userUploadData.value;
  } else if (isNewTemplate) {
    appList.value = {
      packages: [],
      languages: [
        {
          label: "简体中文",
          value: "zh_cn"
        },
        {
          label: "English",
          value: "en_us"
        }
      ]
    };
  } else {
    fetchTemplate();
  }
});
</script>

<template>
  <a-typography-title :level="4" style="margin-bottom: 8px">
    <EditOutlined />
    {{ t("TXT_CODE_dfd4fc5a") }}
  </a-typography-title>
  <a-typography-paragraph>
    <div>
      {{ t("TXT_CODE_372e7b9c") }}
    </div>
  </a-typography-paragraph>
  <a-form layout="horizontal" class="flex-wrap justify-between">
    <div class="flex-wrap gap-10">
      <a-form-item class="mb-0">
        <!--   @click="toCopy(JSON.stringify(appList))" -->
        <a-button type="primary" size="large">
          {{ t("TXT_CODE_29efd001") }}
          <CopyOutlined />
        </a-button>
      </a-form-item>

      <a-form-item class="mb-0">
        <a-button class="button-color-success" size="large" @click="downloadMarketJson">
          {{ t("TXT_CODE_c5a46eba") }}
          <DownloadOutlined />
        </a-button>
      </a-form-item>
    </div>

    <div class="flex-center gap-10">
      <template v-if="multipleMode">
        <a-form-item class="mb-0">
          <div class="p-[8px]">
            {{ t("TXT_CODE_379fa48a") }}: {{ selectedItems.length }} {{ t("TXT_CODE_5cd3b4bd") }}
          </div>
        </a-form-item>

        <a-form-item class="mb-0">
          <a-button class="btn-has-icon" type="default" size="large" @click="exitMultipleMode">
            {{ t("TXT_CODE_5366af54") }}
          </a-button>
        </a-form-item>

        <a-form-item class="mb-0">
          <a-button class="btn-has-icon" type="default" size="large" @click="selectAllItems">
            {{
              dynamicList.length === selectedItems.length
                ? t("TXT_CODE_df87c46d")
                : t("TXT_CODE_f466d7a")
            }}
          </a-button>
        </a-form-item>
        <a-dropdown>
          <template #overlay>
            <a-menu>
              <a-menu-item
                v-for="item in [
                  {
                    title: t('TXT_CODE_ecbd7449'),
                    icon: DeleteOutlined,
                    click: batchDelete
                  }
                ]"
                :key="item.title"
                @click="item.click"
              >
                <component :is="item.icon" />
                {{ item.title }}
              </a-menu-item>
            </a-menu>
          </template>
          <a-button class="btn-has-icon" size="large" type="primary">
            {{ t("TXT_CODE_8fd8bfd3") }}
            <DownOutlined />
          </a-button>
        </a-dropdown>
      </template>
      <a-form-item v-else class="mb-0">
        <a-button class="btn-has-icon" type="default" size="large" @click="toMultiMode">
          {{ t("TXT_CODE_5cb656b9") }}
        </a-button>
      </a-form-item>

      <a-form-item class="mb-0">
        <a-button class="button-color-success btn-has-icon" size="large" @click="editorRef?.open()">
          {{ t("TXT_CODE_3d45d8d") }}
          <PlusOutlined />
        </a-button>
      </a-form-item>
    </div>
  </a-form>

  <a-typography-title :level="4" class="mb-8 mt-30">
    <DatabaseOutlined />
    {{ t("TXT_CODE_88249aee") }}
  </a-typography-title>
  <a-typography-paragraph>
    <Flex justify="space-between" align="flex-start">
      <p>
        <span>{{ t("TXT_CODE_c9ce7427") }}</span>
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
  <a-row v-else :gutter="[16, 16]">
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

    <!-- Empty state - shown when no packages match current filters -->
    <a-col v-if="dynamicList.length === 0" :span="24">
      <div style="display: flex; justify-content: center; align-items: center; height: 40vh">
        <a-typography-paragraph :style="{ color: 'var(--color-gray-7)' }">
          {{ t("TXT_CODE_7356e569") }}
        </a-typography-paragraph>
      </div>
    </a-col>

    <!-- Package cards grid with fade-up animation -->
    <fade-up-animation>
      <a-col
        v-for="item in dynamicList"
        :key="item.key"
        :span="24"
        :sm="24"
        :md="12"
        :lg="item.isSummary ? 8 : 6"
      >
        <div style="display: flex; flex-grow: 1; flex-direction: column; height: 100%">
          <!-- Top Category Card -->
          <div
            v-if="item.isSummary"
            class="package-image-container-summary global-card-container-shadow"
            style="overflow: hidden"
            @click="searchForm.gameType = item.gameType"
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

            <a-typography-title :level="5" class="flex-center package-subtitle">
              <span>
                {{ item.title }}
              </span>
            </a-typography-title>
          </div>

          <!-- Template Pack -->
          <CardPanel
            v-else
            style="flex-grow: 1; padding: 12px"
            :class="{ selected: multipleMode && findItem(item) }"
          >
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
                  <div class="mb-5">
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
                    block
                    type="primary"
                    class="download-button"
                    @click="handleSelectItem(item)"
                  >
                    <template #icon>
                      <SelectOutlined v-if="multipleMode" />
                      <DownloadOutlined v-else />
                    </template>
                    {{
                      multipleMode
                        ? findItem(item)
                          ? t("TXT_CODE_abedfd03")
                          : t("TXT_CODE_7b2c5414")
                        : t("TXT_CODE_1704ea49")
                    }}
                  </a-button>
                </div>
              </div>
            </template>
          </CardPanel>
        </div>
      </a-col>
    </fade-up-animation>
  </a-row>

  <Editor
    ref="editorRef"
    :g-l="appGameTypeList"
    :p-l="appPlatformList"
    :c-l="appCategoryList"
    @ok="save"
  />
</template>

<style scoped lang="scss">
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

.cursor-pointer {
  cursor: pointer;
}

.package-image {
  height: 100%;
  width: 100%;
  object-fit: cover;
  height: 160px;
  transition: transform 0.3s ease;
  background-color: var(--color-gray-1);
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

.package-subtitle {
  cursor: pointer;
  background-color: var(--card-bottom-background-color);
  color: rgb(255, 255, 255);
  padding: 8px;
  font-size: 14px;
  font-weight: 400;
  // border-bottom-left-radius: 6px;
  // border-bottom-right-radius: 6px;
  border-radius: 0 !important;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  text-align: center;
  z-index: 1;
  margin: 0;
}

.package-image-container-summary {
  position: relative;
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
