<script setup lang="ts">
import { useLayoutCardTools } from "@/hooks/useCardTools";

import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { computed, onMounted } from "vue";

import { userInfoApi } from "@/services/apis/index";

const props = defineProps<{
  card: LayoutCard;
}>();

const { execute, state } = userInfoApi();

const getInstanceList = async () => {
  await execute({
    params: {
      advanced: true
    }
  });
};

const { getMetaValue } = useLayoutCardTools(props.card);

const type = getMetaValue<string>("type");

const computedStatusList = computed(() => {
  if (!state.value) return [];

  return [
    {
      type: "instance_all",
      title: t("管理员所分配给您的所有实例总数"),
      value: state.value.instances.length
    },
    {
      type: "instance_running",
      title: t("实例正在运行中的数量"),
      value: state.value.instances.filter((e: any) => e.status == 3).length
    },
    {
      type: "instance_stop",
      title: t("实例未处于运行中的数量"),
      value: state.value.instances.filter((e: any) => e.status == 0).length
    },
    {
      type: "instance_error",
      title: t("暂时不可使用的实例数"),
      value: state.value.instances.filter(
        (e: any) => e.status == -1 || e.status == 1 || e.status == 2
      ).length
    }
  ];
});

const realStatus = computed(() => computedStatusList.value.find((v) => v.type === type));
onMounted(() => {
  getInstanceList();
});
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
