<script setup lang="ts">
import { useScreen } from "@/hooks/useScreen";
import { SearchOutlined } from "@ant-design/icons-vue";
import { Flex } from "ant-design-vue";
import { useI18n } from "vue-i18n";

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
  if (!date) return "Unknown time!";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};
</script>

<template>
  <div class="search-results-container w-full">
    <Flex
      v-if="loading && dataSource.length === 0"
      vertical
      align="center"
      justify="center"
      class="py-32 text-center"
      style="min-height: 400px"
    >
      <a-spin size="large" style="font-size: 42px" />
    </Flex>
    <Flex
      v-else-if="dataSource.length === 0"
      vertical
      align="center"
      justify="center"
      class="py-32 text-center text-gray-400"
      style="min-height: 400px"
    >
      <div class="mb-4"><search-outlined style="font-size: 42px; opacity: 0.1" /></div>
      <div class="text-lg" style="opacity: 0.4">{{ t("TXT_CODE_SEARCH_TIP") }}</div>
    </Flex>
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
              <div
                class="font-bold text-[15px] truncate w-full whitespace-nowrap"
                :title="record.title"
              >
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
            <div
              class="flex flex-col items-start justify-center overflow-hidden"
              style="min-width: 0"
            >
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
                  type="link"
                  size="small"
                  class="opacity-60 hover:opacity-100"
                  :class="{ 'text-green-500': isInstalled(record) }"
                  :disabled="isInstalled(record)"
                  @click="emit('show-versions', record)"
                >
                  {{ isInstalled(record) ? t("TXT_CODE_INSTALLED") : t("TXT_CODE_65b21404") }}
                </a-button>
                <a-button
                  type="link"
                  size="small"
                  class="opacity-60 hover:opacity-100"
                  @click="emit('open-external', record)"
                >
                  {{ t("TXT_CODE_47fea88e") }}
                </a-button>
              </a-space>
            </div>
          </template>
        </template>
      </a-table>
      <div class="flex justify-end mt-12">
        <a-pagination
          v-bind="pagination"
          @change="(page, pageSize) => emit('change', { current: page, pageSize })"
        />
      </div>
    </div>
  </div>
</template>
