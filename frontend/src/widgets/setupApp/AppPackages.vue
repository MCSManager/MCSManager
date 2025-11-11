<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import FadeUpAnimation from "@/components/FadeUpAnimation.vue";
import Loading from "@/components/Loading.vue";
import { router } from "@/config/router";
import { useMarketPackages } from "@/hooks/useMarketPackages";
import { t } from "@/lang/i18n";
import type { QuickStartPackages } from "@/types";
import { DatabaseOutlined, DownloadOutlined } from "@ant-design/icons-vue";
import { Divider, Flex } from "ant-design-vue";
import Link from "ant-design-vue/es/typography/Link";
import { onMounted } from "vue";

const props = defineProps<{
  title?: string;
  btnText?: string;
  showCustomBtn?: boolean;
  onlyDockerTemplate?: boolean;
}>();

const emit = defineEmits<{
  "handle-select-template": [item: QuickStartPackages | null];
}>();

// Use the market packages composable
const {
  searchForm,
  appListLoading,
  filteredList: appList,
  languageOptions: appLangList,
  gameTypeOptions: appGameTypeList,
  categoryOptions: appCategoryList,
  platformOptions: appPlatformList,
  handleReset,
  handleGameTypeChange,
  handleLanguageChange,
  handlePlatformChange,
  handleSelectTopCategory,
  fetchTemplate
} = useMarketPackages({
  onlyDockerTemplate: props.onlyDockerTemplate
});

const openEditor = () => {
  router.push("/market/editor");
};

onMounted(() => {
  fetchTemplate();
});

defineExpose({
  appList,
  fetchTemplate
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
        <Link target="_blank" @click="openEditor">
          {{ t("TXT_CODE_85c10fde") }}
        </Link>
        <Divider type="vertical" />
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
  <a-row v-else :gutter="[16, 16]" style="height: 100%">
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
            @click="handleSelectTopCategory(item)"
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
              <span>
                {{ item.title }}
              </span>
            </a-typography-title>
          </div>

          <!-- Template Pack -->
          <CardPanel v-else style="flex-grow: 1" :style="{ padding: '12px' }">
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
                    @click="emit('handle-select-template', item)"
                  >
                    <template #icon>
                      <DownloadOutlined />
                    </template>
                    {{ btnText || t("TXT_CODE_1704ea49") }}
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
