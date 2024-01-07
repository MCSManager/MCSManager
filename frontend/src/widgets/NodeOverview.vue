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
    title: t("TXT_CODE_c7d0002e"),
    dataIndex: "ip"
  },
  {
    title: t("TXT_CODE_f49149d0"),
    dataIndex: "port"
  },
  {
    title: t("TXT_CODE_3c8fd4c2"),
    dataIndex: "remark"
  },
  {
    title: "CPU",
    dataIndex: "cpu"
  },
  {
    title: t("TXT_CODE_593ee330"),
    dataIndex: "mem"
  },
  {
    title: t("TXT_CODE_eaed6901"),
    dataIndex: "instances"
  },
  {
    title: t("TXT_CODE_3f99f17f"),
    dataIndex: "version"
  },
  {
    title: t("TXT_CODE_f80e0786"),
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
      status: v.available ? t("TXT_CODE_823bfe63") : t("TXT_CODE_66ce073e")
    };
  });
  return list;
});
</script>

<template>
  <CardPanel class="NodeOverview" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <a-table
        :scroll="{
          x: 'max-content'
        }"
        :columns="columns"
        :data-source="dataSource"
        :pagination="false"
      ></a-table>
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
