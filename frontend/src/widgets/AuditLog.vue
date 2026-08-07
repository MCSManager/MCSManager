<script setup lang="ts">
import BetweenMenus from "@/components/BetweenMenus.vue";
import CardPanel from "@/components/CardPanel.vue";
import { useOperationLog } from "@/hooks/useOperationLog";
import { useScreen } from "@/hooks/useScreen";
import { t } from "@/lang/i18n";
import { searchOperationLog } from "@/services/apis/operationLog";
import type { LayoutCard } from "@/types";
import type { AntColumnsType, AntTableCell } from "@/types/ant";
import type { OperationLoggerItem, OperationLoggerType } from "@/types/operationLog";
import { arrayFilter } from "@/tools/array";
import { FileProtectOutlined, SearchOutlined } from "@ant-design/icons-vue";
import dayjs, { type Dayjs } from "dayjs";
import { throttle } from "lodash";
import { computed, onMounted, ref } from "vue";

defineProps<{
  card: LayoutCard;
}>();

const { isPhone } = useScreen();
const operationLog = useOperationLog();
const { execute: searchExecute, isLoading } = searchOperationLog();

const typeOptions = computed(() => {
  return Object.keys(operationLog.operationTypeNameMap).map((type) => ({
    value: type,
    label: operationLog.operationTypeNameMap[type as OperationLoggerType]
  }));
});

const levelOptions = computed(() => [
  { value: "info", label: t("TXT_CODE_92c9a2f3") },
  { value: "warning", label: t("TXT_CODE_617ce69c") },
  { value: "error", label: t("TXT_CODE_ac405b50") }
]);

interface QueryForm {
  type?: string;
  level?: string;
  operatorName: string;
  keyword: string;
  timeRange?: [Dayjs, Dayjs];
  currentPage: number;
  pageSize: number;
}

const defaultQueryForm = (): QueryForm => ({
  type: undefined,
  level: undefined,
  operatorName: "",
  keyword: "",
  timeRange: undefined,
  currentPage: 1,
  pageSize: 20
});

const queryForm = ref<QueryForm>(defaultQueryForm());
const total = ref(0);
const dataSource = ref<OperationLoggerItem[]>([]);

const fetchData = async () => {
  const form = queryForm.value;
  const res = await searchExecute({
    params: {
      page: form.currentPage,
      page_size: form.pageSize,
      type: form.type || undefined,
      level: form.level || undefined,
      operator_name: form.operatorName.trim() || undefined,
      keyword: form.keyword.trim() || undefined,
      start_time: form.timeRange?.[0] ? form.timeRange[0].valueOf() : undefined,
      end_time: form.timeRange?.[1] ? form.timeRange[1].valueOf() : undefined
    }
  });
  dataSource.value = res.value?.data || [];
  total.value = res.value?.total ?? 0;
};

const search = throttle(async () => {
  queryForm.value.currentPage = 1;
  await fetchData();
}, 600);

const reload = throttle(() => {
  fetchData();
}, 600);

const resetQuery = async () => {
  queryForm.value = defaultQueryForm();
  await fetchData();
};

const handleTableChange = (e: { current: number; pageSize: number }) => {
  queryForm.value.currentPage = e.current;
  queryForm.value.pageSize = e.pageSize;
  fetchData();
};

const columns = computed(() => {
  return arrayFilter<AntColumnsType>([
    {
      align: "center",
      title: t("TXT_CODE_7edf331d"),
      dataIndex: "operation_time",
      key: "operation_time",
      width: 165
    },
    {
      align: "center",
      title: t("TXT_CODE_2d3fc1f8"),
      dataIndex: "operation_level",
      key: "operation_level",
      width: 85,
      condition: () => !isPhone.value
    },
    {
      align: "center",
      title: t("TXT_CODE_5b265628"),
      dataIndex: "type",
      key: "type",
      width: 140
    },
    {
      align: "center",
      title: t("TXT_CODE_745f713e"),
      dataIndex: "operator_name",
      key: "operator_name",
      width: 130,
      condition: () => !isPhone.value
    },
    {
      align: "left",
      title: t("TXT_CODE_28a7b54"),
      key: "content",
      minWidth: 260
    },
    {
      align: "center",
      title: t("TXT_CODE_fe731dfc"),
      key: "action",
      width: 90
    }
  ]);
});

const formatTime = (time?: string) => {
  const timestamp = Number(time);
  if (!timestamp) return "--";
  return dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss");
};

const getTypeName = (type: OperationLoggerType) => {
  return operationLog.operationTypeNameMap[type] || type;
};

const getLevelName = (level: OperationLoggerItem["operation_level"]) => {
  const option = levelOptions.value.find((item) => item.value === level);
  return option?.label || level;
};

// Only real names are shown; IDs stay in the hover tooltip and the detail dialog
const getInstanceLabel = (record: OperationLoggerItem) => {
  return (record as any).instance_name || "--";
};

const getDaemonLabel = (record: OperationLoggerItem) => {
  return (record as any).daemon_name || "--";
};

// Secondary line inside the content cell: "实例: xxx · 节点: xxx" (only existing parts)
const getScopeLabel = (record: OperationLoggerItem) => {
  const anyRecord = record as any;
  const parts: string[] = [];
  if (anyRecord.instance_name) parts.push(`${t("TXT_CODE_cb043d10")}: ${anyRecord.instance_name}`);
  if (anyRecord.daemon_name) parts.push(`${t("TXT_CODE_e076d90b")}: ${anyRecord.daemon_name}`);
  return parts.join(" · ");
};

const getContentMain = (record: OperationLoggerItem) => {
  const text = operationLog.generateTextByItem(record, "managementText");
  return text === "--" ? "" : text;
};

// Detail dialog
const detailItem = ref<OperationLoggerItem | null>(null);
const detailDialog = ref(false);

const openDetail = (item: OperationLoggerItem) => {
  detailItem.value = item;
  detailDialog.value = true;
};

const BASE_DETAIL_KEYS = [
  "type",
  "operation_id",
  "operation_time",
  "operation_level",
  "operator_ip",
  "operator_name",
  "operator_source",
  "instance_name",
  "daemon_name",
  "config_before",
  "config_after"
];

const detailExtraFields = computed(() => {
  if (!detailItem.value) return [];
  return Object.entries(detailItem.value)
    .filter(([key, value]) => !BASE_DETAIL_KEYS.includes(key) && value !== undefined)
    .map(([key, value]) => ({
      key,
      value: typeof value === "string" ? value : JSON.stringify(value)
    }));
});

const detailConfigBefore = computed(() => {
  const item = detailItem.value as any;
  if (!item?.config_before) return "";
  return JSON.stringify(item.config_before, null, 2);
});

const detailConfigAfter = computed(() => {
  const item = detailItem.value as any;
  if (!item?.config_after) return "";
  return JSON.stringify(item.config_after, null, 2);
});

const hasConfigDiff = computed(() => !!(detailConfigBefore.value || detailConfigAfter.value));

onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template v-if="!isPhone" #left>
            <a-typography-title class="mb-0" :level="4">
              <FileProtectOutlined />
              {{ card.title }} ({{ total }})
            </a-typography-title>
          </template>
          <template #right>
            <a-button type="default" :loading="isLoading" @click="reload">
              {{ t("TXT_CODE_b76d94e0") }}
            </a-button>
          </template>
        </BetweenMenus>
      </a-col>
      <a-col :span="24">
        <CardPanel style="height: 100%">
          <template #body>
            <div class="audit-filter mb-16">
              <a-form layout="inline" :model="queryForm">
                <a-form-item :label="t('TXT_CODE_5b265628')" class="mb-8">
                  <a-select
                    v-model:value="queryForm.type"
                    :placeholder="t('TXT_CODE_68022ee7')"
                    allow-clear
                    show-search
                    option-filter-prop="label"
                    style="width: 180px"
                    :options="typeOptions"
                    @change="search()"
                  />
                </a-form-item>
                <a-form-item :label="t('TXT_CODE_2d3fc1f8')" class="mb-8">
                  <a-select
                    v-model:value="queryForm.level"
                    :placeholder="t('TXT_CODE_68022ee7')"
                    allow-clear
                    style="width: 120px"
                    :options="levelOptions"
                    @change="search()"
                  />
                </a-form-item>
                <a-form-item :label="t('TXT_CODE_745f713e')" class="mb-8">
                  <a-input
                    v-model:value="queryForm.operatorName"
                    :placeholder="t('TXT_CODE_4ea93630')"
                    allow-clear
                    style="width: 140px"
                    @press-enter="search()"
                    @change="search()"
                  />
                </a-form-item>
                <a-form-item :label="t('TXT_CODE_482e7583')" class="mb-8">
                  <a-range-picker
                    v-model:value="queryForm.timeRange"
                    size="large"
                    show-time
                    style="width: 340px"
                    @change="search()"
                  />
                </a-form-item>
                <a-form-item :label="t('TXT_CODE_fe7c7d2d')" class="mb-8">
                  <a-input
                    v-model:value="queryForm.keyword"
                    :placeholder="t('TXT_CODE_4ea93630')"
                    allow-clear
                    style="width: 160px"
                    @press-enter="search()"
                  >
                    <template #suffix>
                      <SearchOutlined />
                    </template>
                  </a-input>
                </a-form-item>
                <a-form-item class="mb-8">
                  <a-button type="primary" :loading="isLoading" @click="search()">
                    {{ t("TXT_CODE_ee8ae330") }}
                  </a-button>
                  <a-button class="ml-8" @click="resetQuery()">
                    {{ t("TXT_CODE_50d471b2") }}
                  </a-button>
                </a-form-item>
              </a-form>
            </div>
            <a-table
              :data-source="dataSource"
              :columns="columns"
              :loading="isLoading"
              :row-key="(record: OperationLoggerItem) => record.operation_id"
              :scroll="{ x: 'max-content' }"
              :pagination="{
                current: queryForm.currentPage,
                pageSize: queryForm.pageSize,
                total: total,
                hideOnSinglePage: false,
                showSizeChanger: true
              }"
              @change="
                handleTableChange({
                  current: $event.current || 0,
                  pageSize: $event.pageSize || 0
                })
              "
            >
              <template #bodyCell="{ column, record }: AntTableCell">
                <template v-if="column.key === 'operation_time'">
                  <span class="audit-time">{{ formatTime(record.operation_time) }}</span>
                </template>
                <template v-if="column.key === 'operation_level'">
                  <a-tag :color="operationLog.getColorByLevel(record.operation_level)">
                    {{ getLevelName(record.operation_level) }}
                  </a-tag>
                </template>
                <template v-if="column.key === 'type'">
                  <a-tag>{{ getTypeName(record.type) }}</a-tag>
                </template>
                <template v-if="column.key === 'operator_name'">
                  <span>
                    {{ record.operator_name || "--" }}
                    <a-tag v-if="record.operator_source" color="purple" class="ml-4">API</a-tag>
                  </span>
                </template>
                <template v-if="column.key === 'content'">
                  <div class="audit-content">
                    <div v-if="getContentMain(record)" class="audit-content-main">
                      {{ getContentMain(record) }}
                    </div>
                    <div
                      v-if="getScopeLabel(record)"
                      class="audit-content-scope"
                      :title="record.instance_id || record.daemon_id"
                    >
                      {{ getScopeLabel(record) }}
                    </div>
                    <span v-if="!getContentMain(record) && !getScopeLabel(record)">--</span>
                  </div>
                </template>
                <template v-if="column.key === 'action'">
                  <a-button size="middle" @click="openDetail(record)">
                    {{ t("TXT_CODE_f1b166e7") }}
                  </a-button>
                </template>
              </template>
            </a-table>
          </template>
        </CardPanel>
      </a-col>
    </a-row>

    <a-modal
      v-model:open="detailDialog"
      centered
      :width="820"
      :title="t('TXT_CODE_d1f48be5')"
      :footer="null"
      :destroy-on-close="true"
    >
      <div v-if="detailItem" class="audit-detail">
        <a-typography-paragraph class="audit-sentence">
          {{ operationLog.generateTextByItem(detailItem) }}
        </a-typography-paragraph>
        <a-descriptions bordered size="small" :column="isPhone ? 1 : 2" class="mb-16">
          <a-descriptions-item :label="t('TXT_CODE_7edf331d')">
            {{ formatTime(detailItem.operation_time) }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('TXT_CODE_2d3fc1f8')">
            <a-tag :color="operationLog.getColorByLevel(detailItem.operation_level)">
              {{ getLevelName(detailItem.operation_level) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="t('TXT_CODE_5b265628')">
            <a-tag>{{ getTypeName(detailItem.type) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="t('TXT_CODE_745f713e')">
            {{ detailItem.operator_name || "--" }}
            <a-tag v-if="detailItem.operator_source" color="purple" class="ml-4">API</a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="t('TXT_CODE_5b845bf0')">
            {{ detailItem.operator_ip || "--" }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('TXT_CODE_cb043d10')">
            {{ getInstanceLabel(detailItem) }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('TXT_CODE_e076d90b')">
            {{ getDaemonLabel(detailItem) }}
          </a-descriptions-item>
          <a-descriptions-item
            v-for="field in detailExtraFields"
            :key="field.key"
            :label="field.key"
          >
            <span class="audit-extra-value">{{ field.value }}</span>
          </a-descriptions-item>
        </a-descriptions>

        <template v-if="hasConfigDiff">
          <a-row :gutter="[16, 16]">
            <a-col :span="isPhone ? 24 : 12">
              <a-typography-title :level="5">
                {{ t("TXT_CODE_cb111efa") }}
              </a-typography-title>
              <pre class="audit-json">{{ detailConfigBefore || "--" }}</pre>
            </a-col>
            <a-col :span="isPhone ? 24 : 12">
              <a-typography-title :level="5">
                {{ t("TXT_CODE_c918e658") }}
              </a-typography-title>
              <pre class="audit-json">{{ detailConfigAfter || "--" }}</pre>
            </a-col>
          </a-row>
        </template>
      </div>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
.audit-filter {
  :deep(.ant-form-item) {
    margin-right: 12px;
  }
}

.audit-time {
  font-size: 13px;
  font-family: "Consolas", "Monaco", monospace;
}

.audit-content {
  word-break: break-word;

  .audit-content-scope {
    font-size: 12px;
    color: var(--color-gray-7);
    margin-top: 2px;
  }
}

.audit-sentence {
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--color-gray-2);
  border: 1px solid var(--color-gray-4);
}

.audit-extra-value {
  word-break: break-all;
}

.audit-json {
  max-height: 320px;
  overflow: auto;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  background: var(--color-gray-2);
  border: 1px solid var(--color-gray-4);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
