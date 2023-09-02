<script setup lang="ts">
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useOverviewInfo } from "@/hooks/useOverviewInfo";
import { t } from "@/lang/i18n";
import type { JsonData, LayoutCard } from "@/types";
import { computed } from "vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { state } = useOverviewInfo();
const { getMetaValue } = useLayoutCardTools(props.card);

const type = getMetaValue<string>("type");

const computedStatusList = computed(() => {
  if (!state.value) return [];

  let totalInstance = 0;
  let runningInstance = 0;
  for (const iterator of state.value?.remote || []) {
    if (iterator.instance) {
      totalInstance += iterator.instance.total;
      runningInstance += iterator.instance.running;
    }
  }

  let cpu = Number(state.value.system.cpu * 100).toFixed(0);
  let mem = Number((state.value.system.freemem / state.value.system.totalmem) * 100).toFixed(0);

  return [
    {
      type: "node",
      title: t("在线节点 / 总节点"),
      value: `${state.value?.remoteCount.available}/${state.value?.remoteCount.total}`
    },
    {
      type: "instance",
      title: t("正在运行数 / 全部实例总数"),
      value: `${runningInstance}/${totalInstance}`
    },
    {
      type: "users",
      title: t("登录失败次数 : 登录成功次数"),
      value: `${state.value.record.loginFailed}:${state.value.record.logined}`
    },
    {
      type: "system",
      title: t("面板主机 CPU，RAM 使用率"),
      value: `${cpu}% ${mem}%`
    }
  ];
});

const realStatus = computed(() => computedStatusList.value.find((v) => v.type === type));
</script>

<template>
  <CardPanel class="StatusBlock" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <a-typography-text class="color-info">
        {{ realStatus?.title }}
      </a-typography-text>
      <div class="value">{{ realStatus?.value }}</div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.StatusBlock {
  .value {
    font-weight: 800;
    font-size: var(--font-h1);
    margin-top: 4px;
  }
}
</style>
