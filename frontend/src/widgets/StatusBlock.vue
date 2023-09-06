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

  return [
    {
      type: "node",
      title: t("TXT_CODE_4b7eba50"),
      value: `${state.value?.remoteCount.available}/${state.value?.remoteCount.total}`
    },
    {
      type: "instance",
      title: t("TXT_CODE_8201d2c6"),
      value: `${state.value.runningInstance}/${state.value.totalInstance}`
    },
    {
      type: "users",
      title: t("TXT_CODE_871fb0d6"),
      value: `${state.value.record.loginFailed}:${state.value.record.logined}`
    },
    {
      type: "system",
      title: t("TXT_CODE_f4244bbf"),
      value: `${state.value.cpu}% ${state.value.mem}%`
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
