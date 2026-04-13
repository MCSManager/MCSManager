<script setup lang="ts">
import MonitorMiniTrend from "@/components/MonitorMiniTrend.vue";
import NodeSimpleChart from "@/components/NodeSimpleChart.vue";
import { useMonitorOverview } from "@/hooks/useMonitorOverview";
import { getUsageColor } from "@/tools/common";
import { formatMemoryUsage } from "@/tools/memory";
import { parseTimestamp } from "@/tools/time";
import type { LayoutCard } from "@/types";
import { CloudServerOutlined, ConsoleSqlOutlined, ReloadOutlined } from "@ant-design/icons-vue";
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{
  card: LayoutCard;
}>();

const router = useRouter();
const { state, refresh, isLoading } = useMonitorOverview();

type MonitorOverviewRecord = IMcsmMonitorOverviewResponse["servers"][number] & {
  key: string;
  nodeHost?: IMcsmMonitorHostSnapshot;
  hostDisks: IMcsmMonitorDiskSnapshot[];
  procCpuText: string;
  procMemText: string;
  tpsText: string;
  playersText: string;
  pluginStatusText: string;
  lastSeenText: string;
  hostCpuText: string;
  hostMemText: string;
  hostDiskText: string;
  nodeStatusText: string;
};

const nodeMap = computed(() => {
  const entries = (state.value?.nodes ?? []).map((node) => [node.daemonId, node] as const);
  return new Map(entries);
});

const summaryItems = computed(() => {
  const summary = state.value?.summary;
  return [
    {
      key: "nodes",
      label: "在线节点",
      value: `${summary?.nodesOnline ?? 0} / ${summary?.nodesTotal ?? 0}`
    },
    {
      key: "servers",
      label: "运行实例",
      value: `${summary?.serversRunning ?? 0} / ${summary?.serversTotal ?? 0}`
    },
    {
      key: "plugins",
      label: "插件心跳",
      value: `${summary?.pluginOnline ?? 0}`
    },
    {
      key: "updatedAt",
      label: "更新时间",
      value: parseTimestamp(state.value?.generatedAt ?? 0) || "--"
    }
  ];
});

const columns = [
  {
    title: "实例",
    dataIndex: "instanceName",
    key: "instanceName",
    width: 180
  },
  {
    title: "节点",
    dataIndex: "daemonRemarks",
    key: "daemonRemarks",
    width: 180
  },
  {
    title: "状态",
    dataIndex: "statusText",
    key: "statusText",
    width: 100
  },
  {
    title: "进程 CPU",
    dataIndex: "procCpuText",
    key: "procCpuText",
    width: 100
  },
  {
    title: "进程内存",
    dataIndex: "procMemText",
    key: "procMemText",
    width: 140
  },
  {
    title: "TPS(1m)",
    dataIndex: "tpsText",
    key: "tpsText",
    width: 100
  },
  {
    title: "人数",
    dataIndex: "playersText",
    key: "playersText",
    width: 110
  },
  {
    title: "插件",
    dataIndex: "pluginStatusText",
    key: "pluginStatusText",
    width: 100
  },
  {
    title: "最后心跳",
    dataIndex: "lastSeenText",
    key: "lastSeenText",
    width: 170
  },
  {
    title: "操作",
    key: "actions",
    width: 120
  }
];

const formatPercent = (value?: number) => {
  if (value == null) return "--";
  return `${value.toFixed(1)}%`;
};

const formatAgo = (timestamp?: number) => {
  if (!timestamp) return "--";
  const diff = Math.max(0, Date.now() - timestamp);
  if (diff < 1000) return "刚刚";
  if (diff < 60_000) return `${Math.floor(diff / 1000)} 秒前`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  return parseTimestamp(timestamp);
};

const formatHostMemory = (host?: IMcsmMonitorHostSnapshot) => {
  if (!host) return "--";
  return `${formatMemoryUsage(host.totalmem - host.freemem)} / ${formatMemoryUsage(host.totalmem)}`;
};

const formatDiskSummary = (disk?: IMcsmMonitorDiskSnapshot) => {
  if (!disk) return "--";
  return `${formatMemoryUsage(disk.freeBytes)} 可用`;
};

const formatProcessStatus = (statusText: string) => {
  const statusMap: Record<string, string> = {
    running: "运行中",
    starting: "启动中",
    stopping: "停止中",
    busy: "繁忙",
    stopped: "已停止"
  };
  return statusMap[statusText] || statusText || "--";
};

const dataSource = computed<MonitorOverviewRecord[]>(() =>
  (state.value?.servers ?? [])
    .map((server) => {
      const node = nodeMap.value.get(server.daemonId);
      const nodeHost = node?.host;

      return {
        ...server,
        key: `${server.daemonId}-${server.serverId}`,
        nodeHost,
        hostDisks: nodeHost?.disks ?? [],
        procCpuText: formatPercent(server.process.cpuPercent),
        procMemText: server.process.memoryBytes ? formatMemoryUsage(server.process.memoryBytes) : "--",
        tpsText: server.plugin.tps.oneMin ? server.plugin.tps.oneMin.toFixed(2) : "--",
        playersText: `${server.plugin.onlinePlayers} / ${server.plugin.maxPlayers}`,
        pluginStatusText: server.plugin.online ? "在线" : "离线",
        lastSeenText: formatAgo(server.plugin.lastSeen),
        hostCpuText: formatPercent(nodeHost?.cpuPercent),
        hostMemText: formatHostMemory(nodeHost),
        hostDiskText: formatDiskSummary(server.hostPrimaryDisk ?? nodeHost?.primaryDisk),
        nodeStatusText: server.daemonAvailable ? "在线" : "离线"
      };
    })
    .sort((a, b) => {
      if (a.processRunning !== b.processRunning) return a.processRunning ? -1 : 1;
      return a.instanceName.localeCompare(b.instanceName);
    })
);

const toTerminal = (record: Pick<MonitorOverviewRecord, "daemonId" | "instanceId">) => {
  router.push({
    path: "/instances/terminal",
    query: {
      daemonId: record.daemonId,
      instanceId: record.instanceId
    }
  });
};

const toTerminalFromRow = (record: Record<string, any>) => {
  toTerminal(record as Pick<MonitorOverviewRecord, "daemonId" | "instanceId">);
};

const getRecordValue = (record: Record<string, any>, key?: string | number) => {
  if (key == null) return "";
  return record[String(key)];
};

const getCpuChartData = (record: MonitorOverviewRecord) =>
  record.history.map((item) => item.procCpu);

const getMemChartData = (record: MonitorOverviewRecord) =>
  record.history.map((item) => item.procMemPercent);

const getTrendData = (record: MonitorOverviewRecord, field: "tps" | "onlinePlayers") =>
  record.history.map((item) => ({
    label: new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }),
    value: field === "tps" ? item.tps : item.onlinePlayers
  }));
</script>

<template>
  <CardPanel class="monitor-overview-card" style="height: 100%">
    <template #title>{{ props.card.title }}</template>
    <template #operator>
      <a-button size="small" :loading="isLoading" @click="refresh(true)">
        <ReloadOutlined />
        刷新
      </a-button>
    </template>
    <template #body>
      <div class="monitor-overview-card__summary">
        <div
          v-for="item in summaryItems"
          :key="item.key"
          class="monitor-overview-card__summary-item"
        >
          <div class="monitor-overview-card__summary-label">{{ item.label }}</div>
          <div class="monitor-overview-card__summary-value">{{ item.value }}</div>
        </div>
      </div>

      <a-table
        :columns="columns"
        :data-source="dataSource"
        :pagination="false"
        :scroll="{ x: 'max-content' }"
        size="small"
        class="monitor-overview-card__table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'instanceName'">
            <div class="server-name-cell">
              <CloudServerOutlined />
              <span>{{ record.instanceName }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'daemonRemarks'">
            <div>
              <div>{{ record.daemonRemarks || `${record.daemonIp}:${record.daemonPort}` }}</div>
              <div class="server-subtext">{{ record.daemonIp }}:{{ record.daemonPort }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'statusText'">
            <a-tag :color="record.processRunning ? 'green' : 'default'">
              {{ formatProcessStatus(record.statusText) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'pluginStatusText'">
            <a-tag :color="record.plugin.online ? 'blue' : 'default'">
              {{ record.pluginStatusText }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button size="small" @click="toTerminalFromRow(record)">
              <ConsoleSqlOutlined />
              终端
            </a-button>
          </template>
          <template v-else>
            <span>{{ getRecordValue(record, column.key) }}</span>
          </template>
        </template>

        <template #expandedRowRender="{ record }">
          <div class="monitor-expand">
            <div class="monitor-expand__host-summary">
              <div class="monitor-expand__host-card">
                <div class="monitor-expand__host-label">节点状态</div>
                <div class="monitor-expand__host-value">
                  <a-tag :color="record.daemonAvailable ? 'green' : 'default'">
                    {{ record.nodeStatusText }}
                  </a-tag>
                </div>
              </div>
              <div class="monitor-expand__host-card">
                <div class="monitor-expand__host-label">主机 CPU</div>
                <div
                  class="monitor-expand__host-value"
                  :style="{ color: getUsageColor(record.nodeHost?.cpuPercent ?? 0, 'var(--color-primary)') }"
                >
                  {{ record.hostCpuText }}
                </div>
              </div>
              <div class="monitor-expand__host-card">
                <div class="monitor-expand__host-label">主机内存</div>
                <div class="monitor-expand__host-value">{{ record.hostMemText }}</div>
              </div>
              <div class="monitor-expand__host-card">
                <div class="monitor-expand__host-label">主机磁盘</div>
                <div class="monitor-expand__host-value">{{ record.hostDiskText }}</div>
              </div>
            </div>

            <div class="monitor-expand__charts">
              <NodeSimpleChart
                :cpu-data="getCpuChartData(record)"
                :mem-data="getMemChartData(record)"
                :cpu-usage="record.procCpuText"
                :mem-usage="formatPercent(record.process.memoryPercent)"
              />
            </div>

            <div class="monitor-expand__trends">
              <MonitorMiniTrend
                title="TPS 趋势"
                :current-text="record.tpsText"
                :max="20"
                :data="getTrendData(record, 'tps')"
              />
              <MonitorMiniTrend
                title="在线人数趋势"
                :current-text="record.playersText"
                :data="getTrendData(record, 'onlinePlayers')"
              />
            </div>

            <div v-if="record.hostDisks.length" class="monitor-expand__disk-list">
              <div
                v-for="disk in record.hostDisks"
                :key="`${record.key}-${disk.mount}`"
                class="monitor-expand__disk-item"
              >
                <div class="monitor-expand__disk-top">
                  <span class="server-subtext">{{ disk.device }}</span>
                  <span class="server-subtext">{{ disk.mount }}</span>
                </div>
                <div class="monitor-expand__disk-main">
                  <span>{{ formatMemoryUsage(disk.usedBytes) }} / {{ formatMemoryUsage(disk.totalBytes) }}</span>
                  <span>{{ formatMemoryUsage(disk.freeBytes) }} 可用</span>
                  <span>{{ disk.usagePercent.toFixed(1) }}%</span>
                </div>
              </div>
            </div>

            <a-descriptions bordered size="small" :column="2" class="monitor-expand__desc">
              <a-descriptions-item label="实例 ID">{{ record.instanceId }}</a-descriptions-item>
              <a-descriptions-item label="进程 PID">{{ record.process.pid ?? "--" }}</a-descriptions-item>
              <a-descriptions-item label="服务端版本">
                {{ record.plugin.serverVersion || "--" }}
              </a-descriptions-item>
              <a-descriptions-item label="插件版本">
                {{ record.plugin.pluginVersion || "--" }}
              </a-descriptions-item>
              <a-descriptions-item label="MOTD">
                {{ record.plugin.motd || "--" }}
              </a-descriptions-item>
              <a-descriptions-item label="世界">
                {{ record.plugin.worlds.length ? record.plugin.worlds.join(", ") : "--" }}
              </a-descriptions-item>
              <a-descriptions-item label="最后心跳">
                {{ record.plugin.lastSeen ? parseTimestamp(record.plugin.lastSeen) : "--" }}
              </a-descriptions-item>
              <a-descriptions-item label="主线程">
                {{ record.plugin.mainThreadBlocked ? "阻塞" : "正常" }}
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </template>
      </a-table>
    </template>
  </CardPanel>
</template>

<style scoped lang="scss">
.monitor-overview-card__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.monitor-overview-card__summary-item {
  border: 1px solid var(--card-border-color);
  border-radius: 12px;
  padding: 14px 16px;
  background: linear-gradient(180deg, rgba(250, 252, 255, 0.92), rgba(244, 247, 251, 0.92));
}

.monitor-overview-card__summary-label {
  font-size: 12px;
  color: var(--color-gray-7);
}

.monitor-overview-card__summary-value {
  margin-top: 8px;
  font-size: 20px;
  font-weight: 700;
}

.server-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.server-subtext {
  font-size: 12px;
  color: var(--color-gray-7);
}

.monitor-expand {
  display: grid;
  gap: 16px;
}

.monitor-expand__host-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.monitor-expand__host-card {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--card-border-color);
  background: rgba(250, 252, 255, 0.78);
}

.monitor-expand__host-label {
  font-size: 12px;
  color: var(--color-gray-7);
}

.monitor-expand__host-value {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 600;
}

.monitor-expand__trends {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.monitor-expand__disk-list {
  display: grid;
  gap: 10px;
}

.monitor-expand__disk-item {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--card-border-color);
  background: rgba(250, 252, 255, 0.72);
}

.monitor-expand__disk-top,
.monitor-expand__disk-main {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.monitor-expand__disk-main {
  margin-top: 8px;
}

@media (max-width: 992px) {
  .monitor-overview-card__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .monitor-expand__host-summary,
  .monitor-expand__trends {
    grid-template-columns: 1fr;
  }
}
</style>
