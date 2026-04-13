<!-- eslint-disable vue/html-indent -->
<script setup lang="ts">
import { useOverviewInfo } from "@/hooks/useOverviewInfo";
import { t } from "@/lang/i18n";
import { getUsageColor } from "@/tools/common";
import { formatMemoryUsage } from "@/tools/memory";
import { hasVersionUpdate } from "@/tools/version";
import type { LayoutCard } from "@/types";
import { CheckCircleOutlined, InfoCircleOutlined } from "@ant-design/icons-vue";
import { computed } from "vue";

defineProps<{
  card: LayoutCard;
}>();

const { state } = useOverviewInfo();
const specifiedDaemonVersion = computed(() => state.value?.specifiedDaemonVersion);

const columns = [
  {
    title: `${t("TXT_CODE_c7d0002e")}:${t("TXT_CODE_f49149d0")}`,
    dataIndex: "address",
    key: "address",
    width: 140
  },
  { title: t("TXT_CODE_3c8fd4c2"), dataIndex: "remark", key: "remark", width: 100 },
  { title: "CPU", dataIndex: "cpu", key: "cpu", width: 72 },
  { title: t("TXT_CODE_593ee330"), dataIndex: "mem", key: "mem", width: 120 },
  { title: "磁盘", dataIndex: "disk", key: "disk", width: 170 },
  { title: t("TXT_CODE_eaed6901"), dataIndex: "instances", key: "instances", width: 90 },
  { title: t("TXT_CODE_3f99f17f"), dataIndex: "version", key: "version", width: 100 },
  { title: t("TXT_CODE_f80e0786"), dataIndex: "status", key: "status", width: 90 }
];

const dataSource = computed(() => {
  const list =
    state.value?.remote.map((v) => {
      const totalMem = v.system?.totalmem ?? 0;
      const freeMem = v.system?.freemem ?? 0;
      const memUsedPercent = totalMem > 0 ? Math.round((1 - freeMem / totalMem) * 100) : undefined;
      const cpuPercent = v.system ? Number((v.system.cpuUsage * 100).toFixed(0)) : undefined;
      const running = v.instance?.running ?? 0;
      const total = v.instance?.total ?? 0;
      const primaryDisk = v.system?.primaryDisk;

      return {
        key: v.uuid,
        address: `${v.ip}:${v.port}`,
        ip: v.ip,
        port: v.port,
        remark: v.remarks || "--",
        cpu: v.cpuInfo ?? "--",
        cpuPercent,
        mem: v.memText ?? "--",
        memUsedPercent,
        primaryDisk,
        disks: v.system?.disks ?? [],
        disk: primaryDisk ? `${formatMemoryUsage(primaryDisk.freeBytes)} 可用` : "--",
        diskUsagePercent: primaryDisk?.usagePercent,
        instances: `${running} / ${total}`,
        running,
        total,
        version: v.version || "--",
        status: v.available ? t("TXT_CODE_823bfe63") : t("TXT_CODE_66ce073e"),
        available: v.available
      };
    }) ?? [];

  return list;
});

const paginationConfig = computed(() => {
  const total = dataSource.value.length;
  if (total <= 8) return false;
  return {
    pageSize: 8,
    showSizeChanger: false,
    showTotal: (n: number) => t("TXT_CODE_TOTAL_ITEMS", { total: n }),
    size: "small" as const
  };
});

const getRecordValue = (record: Record<string, any>, key?: string | number) => {
  if (key == null) return "";
  return record[String(key)];
};
</script>

<template>
  <CardPanel class="NodeOverview" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <div class="NodeOverview__wrap" :style="{ height: card.height }">
        <a-table
          :scroll="{ x: 'max-content' }"
          :columns="columns"
          :data-source="dataSource"
          :pagination="paginationConfig"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'address'">
              <span class="text-monospace">{{ record.address }}</span>
            </template>

            <template v-else-if="column.key === 'cpu'">
              <span
                v-if="record.available"
                class="text-monospace"
                :style="{ color: getUsageColor(record.cpuPercent ?? 0) }"
              >
                {{ record.cpu }}
              </span>
              <span v-else>--</span>
            </template>

            <template v-else-if="column.key === 'mem'">
              <span
                v-if="record.available"
                :style="{ color: getUsageColor(record.memUsedPercent ?? 0, 'var(--color-primary)') }"
              >
                {{ record.mem }}
              </span>
              <span v-else>--</span>
            </template>

            <template v-else-if="column.key === 'disk'">
              <span
                v-if="record.available"
                :style="{ color: getUsageColor(record.diskUsagePercent ?? 0, 'var(--color-success)') }"
              >
                {{ record.disk }}
              </span>
              <span v-else>--</span>
            </template>

            <template v-else-if="column.key === 'instances'">
              {{ record.running }} / {{ record.total }}
            </template>

            <template v-else-if="column.key === 'version'">
              <a-tooltip
                v-if="record.available && hasVersionUpdate(specifiedDaemonVersion, record.version)"
              >
                <template #title>
                  {{ t("TXT_CODE_e520908a") }}
                </template>
                <span class="color-danger">
                  <InfoCircleOutlined class="mr-2" />
                  {{ record.version }}
                </span>
              </a-tooltip>

              <span v-else-if="record.available" class="color-success">
                <CheckCircleOutlined class="mr-2" />
                {{ record.version }}
              </span>
              <span v-else>{{ record.version }}</span>
            </template>

            <template v-else-if="column.key === 'status'">
              <a-tag :color="record.available ? 'green' : ''">
                {{ record.status }}
              </a-tag>
            </template>

            <template v-else>
              {{ getRecordValue(record, column.key) }}
            </template>
          </template>

          <template #expandedRowRender="{ record }">
            <div class="node-disk-list">
              <div v-if="!record.disks.length" class="node-disk-list__empty">暂无磁盘快照</div>
              <div
                v-for="disk in record.disks"
                :key="`${record.key}-${disk.mount}`"
                class="node-disk-list__item"
              >
                <div class="node-disk-list__title">
                  <span class="text-monospace">{{ disk.mount }}</span>
                  <a-tag v-if="record.primaryDisk?.mount === disk.mount" color="blue">主磁盘</a-tag>
                </div>
                <div class="node-disk-list__meta">
                  <span class="text-monospace">{{ disk.device }}</span>
                  <span>{{ formatMemoryUsage(disk.usedBytes) }} / {{ formatMemoryUsage(disk.totalBytes) }}</span>
                  <span>{{ formatMemoryUsage(disk.freeBytes) }} 可用</span>
                  <span>{{ disk.usagePercent.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </template>
        </a-table>
      </div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.NodeOverview__wrap {
  overflow: auto;
  padding: 0 1px;
}

.text-monospace {
  font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace;
}

.node-disk-list {
  display: grid;
  gap: 10px;
}

.node-disk-list__item {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--card-border-color);
  background: rgba(250, 252, 255, 0.75);
}

.node-disk-list__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 600;
}

.node-disk-list__meta {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--color-gray-7);
}

.node-disk-list__empty {
  color: var(--color-gray-7);
}

:deep(.NodeOverview__wrap .ant-table-pagination) {
  margin: 8px 0 0;
}

:deep(.NodeOverview__wrap .ant-table) {
  font-size: 12px;
}

:deep(.NodeOverview__wrap .ant-table-thead > tr > th) {
  font-weight: 600;
}
</style>
