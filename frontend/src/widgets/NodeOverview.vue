<script setup lang="ts">
import { useOverviewInfo } from "@/hooks/useOverviewInfo";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { computed } from "vue";

defineProps<{
  card: LayoutCard;
}>();

const { state } = useOverviewInfo();

const columns = [
  {
    title: `${t("TXT_CODE_c7d0002e")}:${t("TXT_CODE_f49149d0")}`,
    dataIndex: "address",
    key: "address",
    width: 140
  },
  { title: t("TXT_CODE_3c8fd4c2"), dataIndex: "remark", key: "remark", width: 100 },
  { title: "CPU", dataIndex: "cpu", key: "cpu", width: 72 },
  { title: t("TXT_CODE_593ee330"), dataIndex: "mem", key: "mem", width: 72 },
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
      const instancePercent = total > 0 ? Math.round((running / total) * 100) : 0;
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
        memText: v.memText,
        instances: `${running} / ${total}`,
        running,
        total,
        instancePercent,
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
            <!-- IP:端口 合并列 -->
            <template v-if="column.key === 'address'">
              <span class="NodeOverview__address">{{ record.address }}</span>
            </template>
            <!-- 昵称：标签，空时显示占位 -->
            <template v-else-if="column.key === 'remark'">
              <a-tag v-if="record.remark !== '--'" color="cyan" class="NodeOverview__tag">
                {{ record.remark }}
              </a-tag>
              <span v-else class="NodeOverview__muted">--</span>
            </template>
            <!-- CPU：进度条内显示百分比 -->
            <template v-else-if="column.key === 'cpu'">
              <a-tag color="purple" class="NodeOverview__tag">{{ record.cpu }}</a-tag>
            </template>
            <!-- 内存：进度条内显示已用/总量 -->
            <template v-else-if="column.key === 'mem'">
              <a-tag color="purple" class="NodeOverview__tag">{{ record.mem }}</a-tag>
            </template>
            <!-- 运行实例：进度条内显示 运行/总数 -->
            <template v-else-if="column.key === 'instances'">
              <a-tag color="green" class="NodeOverview__tag">
                {{ record.running }} / {{ record.total }}
              </a-tag>
            </template>
            <!-- 版本：标签 -->
            <template v-else-if="column.key === 'version'">
              <a-tag v-if="record.version !== '--'" color="purple" class="NodeOverview__tag">
                {{ record.version }}
              </a-tag>
              <span v-else class="NodeOverview__muted">--</span>
            </template>
            <!-- 连接状态：在线/离线标签 -->
            <template v-else-if="column.key === 'status'">
              <a-tag :color="record.available ? 'green' : 'red'" class="NodeOverview__tag">
                {{ record.status }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.NodeOverview {
  .value {
    font-weight: 800;
    font-size: 36px;
    margin-top: 4px;
  }
}

.NodeOverview__wrap {
  overflow: auto;
  padding: 0 1px;
}

.NodeOverview__address {
  font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace;
  font-size: 12px;
  color: var(--ant-color-text);
}

.NodeOverview__tag {
  margin-inline-end: 0;
}

.NodeOverview__muted {
  color: var(--ant-color-text-tertiary);
  font-size: 12px;
}

.NodeOverview__progress-cell {
  min-width: 0;

  .ant-progress {
    margin-bottom: 0;
  }

  .ant-progress-inner {
    vertical-align: middle;
  }

  :deep(.ant-progress-text) {
    font-size: 11px;
    min-width: 2.5em;
  }
}

:deep(.NodeOverview__wrap .ant-table-pagination) {
  margin: 8px 0 0;
}

:deep(.NodeOverview__wrap .ant-table) {
  font-size: 12px;
}

:deep(.NodeOverview__wrap .ant-table-thead > tr > th) {
  font-weight: 600;
  color: var(--ant-color-text-secondary);
  background: var(--ant-color-fill-quaternary);
}
</style>
