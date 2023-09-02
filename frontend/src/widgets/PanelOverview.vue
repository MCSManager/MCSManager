<script setup lang="ts">
import DataStatistic from "@/components/DataStatistic.vue";
import { t } from "@/lang/i18n";
import { useOverviewInfo } from "@/hooks/useOverviewInfo";
import type { LayoutCard } from "@/types";
import { computed } from "vue";

defineProps<{
  card: LayoutCard;
}>();

const { state, isReady } = useOverviewInfo();

const overviewList = computed(() => {
  if (!state.value || !isReady.value)
    return [
      {
        title: t("数据加载中..."),
        value: ""
      }
    ];

  const { system, version, record, specifiedDaemonVersion, process } = state.value;
  const free = Number((system.freemem / 1024 / 1024 / 1024).toFixed(1));
  const total = Number((system.totalmem / 1024 / 1024 / 1024).toFixed(1));
  const used = Number(total - free).toFixed(1);

  return [
    {
      title: t("Node 环境版本"),
      value: system.node
    },
    {
      title: t("面板版本"),
      value: version
    },
    {
      title: t("对应的节点版本"),
      value: specifiedDaemonVersion
    },
    {
      title: t("进程用户名"),
      value: system.user.username
    },
    {
      title: t("面板时间"),
      value: new Date(system.time).toLocaleString()
    },
    {
      title: t("浏览器时间"),
      value: new Date().toLocaleString()
    },
    {
      title: t("临时封禁IP数"),
      value: record.banips
    },
    {
      title: t("已阻止的访问"),
      value: record.illegalAccess
    },
    {
      title: t("内存"),
      value: `${used}GB/${total}GB`
    },
    {
      title: t("Linux 负载"),
      value: system.loadavg.join("-")
    },
    {
      title: t("面板端使用内存量"),
      value: `${(process.memory / 1024 / 1024).toFixed(1)}MB`
    },
    {
      title: t("主机名"),
      value: system.hostname
    },
    {
      title: t("系统版本"),
      value: `${system.version} ${system.release}`
    },
    {
      title: t("系统类型"),
      value: `${system.type} ${system.platform}`
    }
  ];
});
</script>

<template>
  <div style="height: 100%">
    <CardPanel style="height: 100%">
      <template #title>{{ card.title }}</template>
      <template #body>
        <a-row :gutter="[24, 24]">
          <a-col v-for="item in overviewList" :key="item.value" :span="12" :md="12" :lg="6">
            <DataStatistic :title="item.title" :value="item.value"></DataStatistic>
          </a-col>
        </a-row>
      </template>
    </CardPanel>
  </div>
</template>

<style lang="scss" scoped></style>
