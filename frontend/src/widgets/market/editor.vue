<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import Loading from "@/components/Loading.vue";
import { router } from "@/config/router";
import { useMarketPackages } from "@/hooks/useMarketPackages";
import { t } from "@/lang/i18n";
import { setSettingInfo } from "@/services/apis";
import { uploadFile } from "@/services/apis/layout";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { reportErrorMsg } from "@/tools/validator";
import type { QuickStartPackages, QuickStartTemplate } from "@/types";
import {
  CopyOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileOutlined,
  InboxOutlined,
  LinkOutlined,
  PlusOutlined,
  SelectOutlined
} from "@ant-design/icons-vue";
import { Flex, message, Modal, type UploadProps } from "ant-design-vue";
import axios from "axios";
import { h, onMounted, ref } from "vue";
import InstanceDetail from "../instance/dialogs/InstanceDetail.vue";

const isNewTemplate = Boolean(router.currentRoute.value.query.newTemplate as string);

const { openInputDialog } = useAppToolsStore();
const {
  searchForm,
  packages,
  appListLoading,
  filteredList: appList,
  rawList,
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
} = useMarketPackages();
const { execute: execUpload, state: fileName, isLoading: upLoading } = uploadFile();
const { execute: saveSettings, isLoading: saveSetLoading } = setSettingInfo();

const fileList = ref<any>([]);
const beforeUpload: UploadProps["beforeUpload"] = (file) => {
  const reader = new FileReader();

  reader.onload = (e: ProgressEvent<FileReader>) => {
    if (!e.target || !e.target.result) return message.error(t("TXT_CODE_a62886b9"));
    if (typeof e.target.result !== "string") return message.error(t("TXT_CODE_bddc37e2"));
    const fileContent = e.target.result;
    try {
      const jsonData = JSON.parse(fileContent) as QuickStartTemplate;
      packages.value = jsonData.packages || [];
      appLangList.value = jsonData.languages || [];
    } catch {
      message.error(t("TXT_CODE_bddc37e2"));
    }
  };
  reader.onerror = () => message.error(t("TXT_CODE_a62886b9"));
  reader.readAsText(file);
  return false;
};

const cleanAxios = axios.create({
  headers: {
    "x-requested-with": null
  },
  params: {}
});
const importFromLink = async (addr?: string) => {
  try {
    if (!addr) addr = await openInputDialog(t("TXT_CODE_ac10fe01"));
    if (!addr) return message.error(t("TXT_CODE_ac10fe01"));
    appListLoading.value = true;
    const res = await cleanAxios.get(addr ?? "");
    packages.value = res.data.packages || [];
    appLangList.value = res.data.languages || [];
  } catch (err) {
    reportErrorMsg(err);
  } finally {
    appListLoading.value = false;
  }
};

const importFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text.startsWith("http")) return importFromLink(text);
    const jsonData = JSON.parse(text) as QuickStartTemplate;
    packages.value = jsonData.packages || [];
    appLangList.value = jsonData.languages || [];
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      message.error(t("TXT_CODE_bddc37e2"));
    } else if (err.name === "NotAllowedError") {
      message.error(t("TXT_CODE_2a22c2ff"));
    } else {
      message.error(err.message);
    }
  }
};

const downloadMarketJson = () => {
  if (!packages.value.length) return message.warning(t("TXT_CODE_8e223f23"));
  const dataStr = JSON.stringify(rawList.value, null, 2);
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
const editorRef = ref<InstanceType<typeof InstanceDetail>>();
const toEdit = (item: QuickStartPackages) => {
  const actualIndex = packages.value.findIndex((pkg) => findFn(pkg, item));
  editorRef?.value?.openDialog({ item, i: actualIndex });
};

const save = (item: QuickStartPackages, i: number) => {
  if (!packages.value) return;
  if (i < 0) {
    packages.value.push(item);
  } else {
    packages.value[i] = item;
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
  if (appList.value.length === selectedItems.value.length) {
    selectedItems.value = [];
  } else {
    for (const item of appList.value) {
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
    const index = packages.value.findIndex((pkg) => findFn(pkg, item));
    if (Number(index) < 0) continue;
    packages.value.splice(Number(index), 1);
  }
  selectedItems.value = [];
  message.success(t("TXT_CODE_28190dbc"));
};

const rm_rf = () => {
  packages.value = selectedItems.value = [];
};

const uploadToPanel = async () => {
  if (!packages.value.length) {
    const confirmPromise = new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: t("TXT_CODE_617ce69c"),
        icon: h(ExclamationCircleOutlined),
        content: t("TXT_CODE_f88db280"),
        okText: t("TXT_CODE_d507abff"),
        cancelText: t("TXT_CODE_a0451c97"),
        onOk() {
          resolve(true);
        },
        onCancel() {
          resolve(false);
        }
      });
    });
    if (!(await confirmPromise)) return;
  }
  const uploadFormData = new FormData();
  const dataStr = JSON.stringify(rawList.value, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  uploadFormData.append("file", blob);
  try {
    await execUpload({
      data: uploadFormData,
      timeout: Number.MAX_SAFE_INTEGER
    });
    await saveSettings({
      data: {
        presetPackAddr: `public/upload_files/${fileName.value}`
      }
    });
    message.success(t("TXT_CODE_a7907771"));
  } catch (err: any) {
    reportErrorMsg(err);
  }
};

onMounted(() => {
  if (isNewTemplate) {
    packages.value = [];
  } else {
    fetchTemplate();
  }
});
</script>

<template>
  <a-typography-title :level="4" class="mb-8">
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
        <a-button :loading="upLoading || saveSetLoading" @click="uploadToPanel">
          {{ t("TXT_CODE_592eff33") }}
          <CopyOutlined />
        </a-button>
      </a-form-item>

      <a-dropdown>
        <template #overlay>
          <a-menu>
            <a-menu-item @click="downloadMarketJson">
              <DownloadOutlined />
              {{ t("TXT_CODE_c5a46eba") }}
            </a-menu-item>
            <a-popconfirm :title="t('TXT_CODE_276756b2')" @confirm="rm_rf">
              <a-menu-item danger>
                <DeleteOutlined />
                {{ t("TXT_CODE_75da3f2d") }}
              </a-menu-item>
            </a-popconfirm>
          </a-menu>
        </template>
        <a-button type="primary">
          {{ t("TXT_CODE_fe731dfc") }}
          <DownOutlined />
        </a-button>
      </a-dropdown>

      <template v-if="!packages.length">
        <a-dropdown>
          <template #overlay>
            <a-menu>
              <a-menu-item>
                <a-upload
                  v-model:file-list="fileList"
                  accept=".json"
                  :max-count="1"
                  :show-upload-list="false"
                  :before-upload="beforeUpload"
                >
                  <FileOutlined />
                  {{ t("TXT_CODE_fd0cdf5d") }}
                </a-upload>
              </a-menu-item>
              <a-menu-item @click="importFromLink()">
                <LinkOutlined />
                {{ t("TXT_CODE_dfc4b650") }}
              </a-menu-item>
              <a-menu-item @click="importFromClipboard">
                <CopyOutlined />
                {{ t("TXT_CODE_caaac421") }}
              </a-menu-item>
            </a-menu>
          </template>
          <a-button class="button-color-warning">
            {{ t("TXT_CODE_1df9fbd5") }}
            <DownOutlined />
          </a-button>
        </a-dropdown>
      </template>
    </div>

    <div class="flex-center gap-10">
      <template v-if="multipleMode">
        <a-form-item class="mb-0">
          <div class="p-[8px]">
            {{ t("TXT_CODE_379fa48a") }}: {{ selectedItems.length }} {{ t("TXT_CODE_5cd3b4bd") }}
          </div>
        </a-form-item>

        <a-form-item class="mb-0">
          <a-button type="default" size="large" @click="exitMultipleMode">
            {{ t("TXT_CODE_5366af54") }}
          </a-button>
        </a-form-item>

        <a-form-item class="mb-0">
          <a-button type="default" size="large" @click="selectAllItems">
            {{
              appList.length !== 0 && appList.length === selectedItems.length
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
          <a-button size="large" type="primary">
            {{ t("TXT_CODE_8fd8bfd3") }}
            <DownOutlined />
          </a-button>
        </a-dropdown>
      </template>
      <a-form-item v-else class="mb-0">
        <a-button type="default" size="large" @click="toMultiMode">
          {{ t("TXT_CODE_5cb656b9") }}
        </a-button>
      </a-form-item>

      <a-form-item class="mb-0">
        <a-button
          class="button-color-success"
          size="large"
          @click="editorRef?.openDialog({ i: -1 })"
        >
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
    <a-col v-if="appList.length === 0" :span="24">
      <div class="flex-center flex-col my-50 m-auto" style="width: 40svw">
        <a-typography-paragraph style="color: var(--color-gray-7)">
          {{ t("TXT_CODE_7356e569") }}
        </a-typography-paragraph>
        <template v-if="packages.length === 0">
          <a-upload-dragger
            v-model:fileList="fileList"
            class="w-full"
            accept=".json"
            :max-count="1"
            :before-upload="beforeUpload"
            :show-upload-list="false"
          >
            <div class="flex-center flex-col h-full">
              <p class="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p class="ant-upload-text">{{ t("TXT_CODE_8e16ee21") }}</p>
              <p class="ant-upload-hint">
                {{ t("TXT_CODE_e1c60611") }}
              </p>
            </div>
          </a-upload-dragger>
        </template>
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

  <InstanceDetail
    ref="editorRef"
    :game-type-list="appGameTypeList"
    :platform-list="appPlatformList"
    :category-list="appCategoryList"
    @save-template="save"
  />
</template>
