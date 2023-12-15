<script setup lang="ts">
import DataStatistic from "@/components/DataStatistic.vue";
import { t } from "@/lang/i18n";
import { useOverviewInfo } from "@/hooks/useOverviewInfo";
import type { LayoutCard } from "@/types";
import { computed } from "vue";
import { arrayFilter } from "@/tools/array";

defineProps<{
  card: LayoutCard;
}>();

const { state } = useOverviewInfo();

const overviewList = computed(() => {
  if (!state.value)
    return [
      {
        title: t("TXT_CODE_b197be11"),
        value: ""
      }
    ];

  const { system, version, record, specifiedDaemonVersion, process } = state.value;
  const free = Number((system.freemem / 1024 / 1024 / 1024).toFixed(1));
  const total = Number((system.totalmem / 1024 / 1024 / 1024).toFixed(1));
  const used = Number(total - free).toFixed(1);

  return arrayFilter([
    {
      title: t("TXT_CODE_413b9c01"),
      value: system.node
    },
    {
      title: t("TXT_CODE_af21e6b"),
      value: version
    },
    {
      title: t("TXT_CODE_a0e70887"),
      value: specifiedDaemonVersion
    },
    {
      title: t("TXT_CODE_fdb6c369"),
      value: system.user.username
    },
    {
      title: t("TXT_CODE_f54e6d1f"),
      value: new Date(system.time).toLocaleString()
    },
    {
      title: t("TXT_CODE_4ab6a0b5"),
      value: new Date().toLocaleString()
    },
    {
      title: t("TXT_CODE_856bd2f3"),
      value: record.banips
    },
    {
      title: t("TXT_CODE_da8f97a7"),
      value: record.illegalAccess
    },
    {
      title: t("TXT_CODE_593ee330"),
      value: `${used}GB/${total}GB`
    },
    {
      title: t("TXT_CODE_190ecd56"),
      value: system.loadavg.map((v) => Number(v).toFixed(2)).join("-"),
      condition: () => !system.type.toLowerCase().includes("windows")
    },
    {
      title: t("TXT_CODE_77d038f7"),
      value: `${(process.memory / 1024 / 1024).toFixed(1)}MB`
    },
    {
      title: t("TXT_CODE_4df7e9bd"),
      value: system.hostname
    },
    {
      title: t("TXT_CODE_b4d8588"),
      value: `${system.version} ${system.release}`
    },
    {
      title: t("TXT_CODE_edf84830"),
      value: `${system.type} ${system.platform}`
    }
  ]);
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
