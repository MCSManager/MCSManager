<script setup lang="ts">
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { LayoutCard } from "@/types";
import { useRoute } from "vue-router";
import { useLayoutCardTools } from "../../hooks/useCardTools";
import { getInstanceInfo } from "@/services/apis/instance";
import { onMounted } from "vue";
import { t } from "@/lang/i18n";

const props = defineProps<{
  card: LayoutCard;
}>();

const { state } = useAppStateStore();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);

const instanceId = getMetaOrRouteValue<string>("instanceId");
const daemonId = getMetaOrRouteValue<string>("daemonId");

const { execute, state: instanceInfo } = getInstanceInfo();

onMounted(async () => {
  if (instanceId && daemonId) {
    await execute({
      params: {
        uuid: instanceId,
        remote_uuid: daemonId
      }
    });
  }
});
</script>

<template>
  <CardPanel class="containerWrapper" style="height: 100%">
    <template #title>
      {{ card.title }}
    </template>
    <template #body>
      <a-typography-paragraph>
        {{ t("名称：") }}{{ instanceInfo?.config.nickname }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("类型：") }}{{ instanceInfo?.config.type }}
      </a-typography-paragraph>
      <a-typography-paragraph> {{ t("状态：") }}{{ instanceInfo?.status }} </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("最后启动：") }}{{ instanceInfo?.config.lastDatetime }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("到期时间：") }}{{ instanceInfo?.config.endTime || "--" }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("创建时间：") }}{{ instanceInfo?.config.createDatetime }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        <span>{{ t("输出编码：") }}{{ instanceInfo?.config.nickname }} </span>
        <span class="ml-6">{{ t("输入编码：") }}{{ instanceInfo?.config.nickname }} </span>
      </a-typography-paragraph>

      <!-- <p>{{ t("名称:") }}{{ instanceInfo?.config.nickname }}</p> -->
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
// .containerWrapper {
// }
</style>
