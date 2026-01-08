<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useScreen } from "@/hooks/useScreen";
import {
  SearchOutlined,
  CloudDownloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined
} from "@ant-design/icons-vue";

const props = defineProps<{
  loading: boolean;
  dataSource: any[];
  columns: any[];
  pagination: any;
  mods: any[];
}>();

const emit = defineEmits(["show-versions", "open-external", "download", "change"]);

const { t } = useI18n();
const { isPhone } = useScreen();

const isInstalled = (record: any) => {
  return props.mods?.some((m: any) => m.extraInfo?.project?.id === record.id);
};

const formatDate = (date: string) => {
  if (!date) return t("TXT_CODE_UNKNOWN");
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};
</script>

<template>
  <div class="search-results-container w-full">
    <div v-if="loading && dataSource.length === 0" class="py-32 text-center">
      <a-spin size="large" />
    </div>
    <div v-else-if="dataSource.length === 0" class="py-32 text-center text-gray-400">
      <div class="mb-4"><search-outlined style="font-size: 64px; opacity: 0.1" /></div>
      <div class="text-lg opacity-60">{{ t("TXT_CODE_SEARCH_TIP") }}</div>
    </div>
    <div v-else class="search-results-table">
      <a-table
        :loading="loading"
        :data-source="dataSource"
        :columns="columns"
        :pagination="false"
        row-key="id"
        size="middle"
      >
        <template #headerCell="{ column }">
          <span v-if="column.title" class="font-bold">{{ column.title }}</span>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'icon'">
            <a-avatar :src="record.icon_url" shape="square" :size="40" class="rounded-md" />
          </template>
          <template v-if="column.key === 'name'">
            <div class="flex flex-col text-left overflow-hidden" style="min-width: 0">
              <div class="font-bold text-[15px] truncate w-full whitespace-nowrap" :title="record.title">
                {{ record.title }}
              </div>
              <!-- Mobile only: show version and source -->
              <div v-if="isPhone" class="flex items-center gap-2 mt-0.5">
                <span class="text-[10px] opacity-60 font-mono bg-gray-500/10 px-1 rounded">
                  {{ record.version_number || t("TXT_CODE_UNKNOWN_VERSION") }}
                </span>
                <span class="text-[10px] opacity-60">{{ record.source }}</span>
              </div>
              <div
                class="text-xs opacity-60 truncate w-full whitespace-nowrap mt-0.5"
                :title="record.description"
              >
                {{ record.description }}
              </div>
            </div>
          </template>
          <template v-if="column.key === 'version'">
            <div class="flex flex-col items-start justify-center overflow-hidden" style="min-width: 0">
              <div
                class="font-bold text-xs text-blue-600 dark:text-blue-400 truncate w-full font-mono whitespace-nowrap"
                :title="record.version_number"
              >
                {{ record.version_number || t("TXT_CODE_UNKNOWN_VERSION") }}
              </div>
              <div class="text-[9px] opacity-40 truncate w-full text-left whitespace-nowrap">
                {{ formatDate(record.updated) }}
              </div>
            </div>
          </template>
          <template v-if="column.key === 'type'">
            <a-tag color="blue" class="border-none rounded-md">{{ record.project_type }}</a-tag>
          </template>
          <template v-if="column.key === 'source'">
            <a-tag
              :color="
                record.source === 'CurseForge'
                  ? 'orange'
                  : record.source === 'SpigotMC'
                  ? 'yellow'
                  : 'green'
              "
              class="border-none rounded-md"
            >
              {{ record.source }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <div class="flex justify-center">
              <a-space :size="12">
                <a-button
                  type="text"
                  size="small"
                  @click="emit('show-versions', record)"
                  class="opacity-60 hover:opacity-100"
                  :title="isInstalled(record) ? t('TXT_CODE_INSTALLED') : t('TXT_CODE_DOWNLOAD')"
                  :class="{ 'text-green-500': isInstalled(record) }"
                >
                  <template #icon>
                    <check-circle-outlined v-if="isInstalled(record)" style="font-size: 16px" />
                    <cloud-download-outlined v-else style="font-size: 16px" />
                  </template>
                </a-button>
                <a-button
                  type="text"
                  size="small"
                  @click="emit('open-external', record)"
                  class="opacity-60 hover:opacity-100"
                  :title="t('TXT_CODE_f1b166e7')"
                >
                  <template #icon><file-text-outlined style="font-size: 16px" /></template>
                </a-button>
              </a-space>
            </div>
          </template>
        </template>
      </a-table>
      <div class="flex justify-end mt-4">
        <a-pagination
          v-bind="pagination"
          @change="(page, pageSize) => emit('change', { current: page, pageSize })"
        />
      </div>
    </div>
  </div>
</template>
