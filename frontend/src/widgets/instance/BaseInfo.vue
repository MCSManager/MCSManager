<script setup lang="ts">
import type { LayoutCard } from "@/types";
import { useLayoutCardTools } from "../../hooks/useCardTools";
import { getInstanceInfo } from "@/services/apis/instance";
import { onMounted } from "vue";
import { t } from "@/lang/i18n";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);

const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

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
        <span>{{ t("输出编码：") }}{{ instanceInfo?.config.oe.toUpperCase() }} </span>
        <span class="ml-6">{{ t("输入编码：") }}{{ instanceInfo?.config.ie.toUpperCase() }} </span>
      </a-typography-paragraph>
    </template>
  </CardPanel>
</template>
