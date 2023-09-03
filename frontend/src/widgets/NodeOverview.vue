<script setup lang="ts">
import { useOverviewInfo } from "@/hooks/useOverviewInfo";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { computed } from "vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { state, isLoading } = useOverviewInfo();

const columns = [
  {
    title: t("IP 地址"),
    dataIndex: "ip"
  },
  {
    title: t("端口"),
    dataIndex: "port"
  },
  {
    title: t("昵称"),
    dataIndex: "remark"
  },
  {
    title: t("CPU"),
    dataIndex: "cpu"
  },
  {
    title: t("内存"),
    dataIndex: "mem"
  },
  {
    title: t("运行实例"),
    dataIndex: "instances"
  },
  {
    title: t("远程节点版本"),
    dataIndex: "version"
  },
  {
    title: t("连接状态"),
    dataIndex: "status"
  }
];

const dataSource = computed(() => {
  const list = state.value?.remote.map((v) => {
    return {
      key: v.uuid,
      ip: v.ip,
      port: v.port,
      remark: v.remarks,
      cpu: v.cpuInfo,
      mem: v.memText,
      instances: `${v.instance?.running ?? "--"}/${v.instance?.total ?? "--"}`,
      version: v.version,
      status: v.available ? t("在线") : t("离线")
    };
  });
  return list;
});
</script>

<template>
  <CardPanel class="NodeOverview" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <a-table :columns="columns" :data-source="dataSource" :pagination="false"></a-table>
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
</style>
