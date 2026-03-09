<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { QuickStartPackages } from "@/types";
import type { AntTableCell } from "@/types/ant";
import { DownloadOutlined } from "@ant-design/icons-vue";
import { Flex } from "ant-design-vue";
import { computed, ref } from "vue";
import type { PackageTableColumnDef } from "./usePackageTableColumns";
import { usePackageTableColumns } from "./usePackageTableColumns";

withDefaults(
  defineProps<{
    dataSource: QuickStartPackages[];
    btnText?: string;
  }>(),
  { btnText: "" }
);

const emit = defineEmits<{
  select: [item: QuickStartPackages, type: "normal" | "docker"];
}>();

const { columns, columnDefs } = usePackageTableColumns();

const configModalVisible = ref(false);
const configModalRecord = ref<QuickStartPackages | null>(null);
const myLanguage = ref(window.navigator.language.split("-")[0]);

const configModalJson = computed(() => {
  const record = configModalRecord.value;
  if (!record) return "";
  try {
    return JSON.stringify(record, null, 2);
  } catch {
    return String(record);
  }
});

function openConfigModal(record: QuickStartPackages) {
  configModalRecord.value = record;
  configModalVisible.value = true;
}

function closeConfigModal() {
  configModalVisible.value = false;
  configModalRecord.value = null;
}

function getColumnDef(key: string): PackageTableColumnDef | undefined {
  return columnDefs.value.find((c) => c.key === key);
}

function getCellText(record: QuickStartPackages, dataIndex: string): string {
  const v = record[dataIndex as keyof QuickStartPackages];
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function platformDisplayText(platform: string): string {
  return String(platform).toLowerCase() === "all" ? t("TXT_CODE_all_platform") : platform;
}
</script>

<template>
  <a-table
    :data-source="dataSource"
    :columns="columns"
    :scroll="{ x: 'max-content' }"
    :pagination="{
      pageSize: 10,
      showSizeChanger: false,
      showTotal: (total: number) => t('TXT_CODE_TOTAL_ITEMS', { total })
    }"
    :row-key="
      (r: QuickStartPackages) => r.key ?? `${r.targetLink ?? ''}-${r.title ?? ''}-${r.language}`
    "
    size="middle"
  >
    <template #bodyCell="{ column, record }: AntTableCell">
      <!-- Image column -->
      <template v-if="getColumnDef(String(column.key ?? ''))?.isImage">
        <div class="package-table-image-cell">
          <template v-if="record.image">
            <a-popover trigger="hover" placement="top">
              <template #content>
                <div class="package-table-image-popover">
                  <img :src="record.image" alt="" class="package-table-image-popover-img" />
                </div>
              </template>
              <a-avatar
                :src="record.image"
                :size="48"
                shape="square"
                class="package-table-avatar"
              />
            </a-popover>
          </template>
          <span v-else class="package-table-thumb-placeholder">—</span>
        </div>
      </template>

      <!-- Title column -->
      <template v-else-if="column.key === 'title'">
        <div>
          <Flex>
            <a-typography-text style="font-size: 13px; font-weight: 600">
              {{ record[`title-${myLanguage}`] || record.title }}
            </a-typography-text>
            <a-tag v-if="record?.setupInfo?.docker?.image" color="cyan" class="ml-8">
              {{ record?.setupInfo?.docker?.image }}
            </a-tag>
          </Flex>
          <a-tooltip :title="record.description" placement="topLeft">
            <a-typography-text type="secondary" class="package-table-description-cell">
              {{ record[`description-${myLanguage}`] || record.description }}
            </a-typography-text>
          </a-tooltip>
        </div>
      </template>

      <template v-else-if="column.key === 'remark'">
        <a-tooltip :title="record.remark || '—'" placement="topLeft">
          <a-typography-text type="secondary" class="package-table-description-cell">
            {{ record[`remark-${myLanguage}`] || record.remark }}
          </a-typography-text>
        </a-tooltip>
      </template>

      <!-- Tags -->
      <template
        v-else-if="['runtime', 'hardware', 'platform', 'tags'].includes(String(column.key))"
      >
        <div v-if="!getCellText(record, String(column.dataIndex))"></div>
        <div v-else class="ml-8">
          <a-tag color="blue">{{ getCellText(record, String(column.dataIndex)) }}</a-tag>
        </div>
      </template>
      <template v-else-if="column.key === 'author'">
        <div class="ml-8">
          <a-tag color="green">{{ getCellText(record, String(column.dataIndex)) }}</a-tag>
        </div>
      </template>

      <!-- Action column -->
      <template v-else-if="column.key === 'action'">
        <Flex gap="small" align="center" justify="center">
          <a-button type="link" size="small" @click="openConfigModal(record)">
            {{ t("TXT_CODE_ee5cd485") }}
          </a-button>
          <a-button
            v-if="record?.dockerOptional"
            type="primary"
            class="button-color-success"
            size="small"
            @click="emit('select', record, 'docker')"
          >
            <template #icon>
              <DownloadOutlined />
            </template>
            {{ t("TXT_CODE_9123858b") }}
          </a-button>
          <a-button type="primary" size="small" @click="emit('select', record, 'normal')">
            <template #icon>
              <DownloadOutlined />
            </template>
            <span v-if="!record?.setupInfo?.docker?.image">
              {{ btnText || t("TXT_CODE_1704ea49") }}
            </span>
            <span v-else>
              {{ t("TXT_CODE_9123858b") }}
            </span>
          </a-button>
        </Flex>
      </template>

      <!-- Text column: ellipsis with full text on hover -->
      <template v-else>
        <a-tooltip
          :title="getCellText(record, String(column.dataIndex)) || '—'"
          placement="topLeft"
        >
          <span class="package-table-ellipsis-cell">
            {{ getCellText(record, String(column.dataIndex)) || "—" }}
          </span>
        </a-tooltip>
      </template>
    </template>
  </a-table>

  <a-modal
    v-model:open="configModalVisible"
    :title="t('TXT_CODE_ee5cd485')"
    width="900px"
    :footer="null"
    destroy-on-close
    @cancel="closeConfigModal"
  >
    <div class="config-modal-body">
      <pre class="config-modal-json"><code>{{ configModalJson }}</code></pre>
    </div>
  </a-modal>
</template>

<style scoped>
.package-table-image-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}
.package-table-avatar {
  border-radius: 4px;
  cursor: pointer;
}
.package-table-avatar :deep(img) {
  object-fit: cover;
}
.package-table-image-popover {
  padding: 4px;
}
.package-table-image-popover-img {
  width: 500px;
  height: auto;
  max-height: 500px;
  object-fit: contain;
  display: block;
  border-radius: 4px;
}
.package-table-thumb-placeholder {
  color: var(--color-gray-6);
  font-size: 12px;
}
.package-table-ellipsis-cell {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.package-table-description-cell {
  font-size: 12px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
}

.config-modal-body {
  max-height: 70vh;
  overflow: auto;
}
.config-modal-json {
  margin: 0;
  padding: 12px;
  background: var(--color-gray-2);
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
  font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace;
  /* white-space: pre-wrap;
  word-break: break-all; */
  color: var(--color-gray-12);
}
</style>
